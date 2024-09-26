import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import supertest from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from 'vitest';

import app, { ShareFileQuery } from '../src/server/app';
import { Server } from 'http';

// Inicializando o servidor mock MSW
const server = setupServer(
  // Mock para quando a conversão é aceita e o estado é PENDING
  http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
    return HttpResponse.json(
      {
        id: 'conversao01',
        state: 'PENDING',
        inputFileName: 'documento.docx',
        inputFileFormat: 'docx',
        outputFileName: 'documento.pdf',
        outputFileFormat: 'pdf',
        createdAt: '2024-08-01T12:00:00Z',
        completedAt: null,
      },
      { status: 202 }
    );
  }),
  // Mock para o GET que retorne o estado "COMPLETED" após o polling
  http.get(`${process.env.CONVERSION_API_URL}/conversions/conversao01`, () => {
    return HttpResponse.json(
      {
        id: 'conversao01',
        state: 'COMPLETED',
        inputFileName: 'documento.docx',
        inputFileFormat: 'docx',
        outputFileName: 'documento.pdf',
        outputFileFormat: 'pdf',
        createdAt: '2024-08-01T12:00:00Z',
        completedAt: '2024-08-01T12:05:00Z',
      },
      { status: 200 }
    );
  })
);

describe('Shares', () => {
  beforeAll(async () => {
    server.listen(); // inicializando o MSW
    await app.ready();
  });

  afterEach(() => server.resetHandlers());

  afterAll(async () => {
    server.close();
    await app.close();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 1: Conversão Encontrada e em estado pendente, depois concluída', async () => {
    const response = await supertest(app.server)
      .post('/shares/files') // simulando uma requisição HTTP nessa rota
      .send({
        name: 'documento.docx',
        mode: 'public',
        convertTo: 'pdf',
      });

    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'documento.pdf',
      originalFile: { name: 'documento.docx' },
      mode: 'public',
    });
  });

  test('caso 2: Erro de Validação 400', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 5,
        mode: 'public',
        convertTo: 'pdf',
      });

    console.log(response.body);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ],
    });
  });

  test('caso 3: Conversão falha e retorna erro 500', async () => {
    // sobrescrevendo o mock para simular o erro 500
    server.use(
      http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
        return HttpResponse.json(
          { message: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'documento.docx',
        mode: 'public',
        convertTo: 'pdf',
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error',
    });
  });

  test('caso 4: Conversao falha algumas vezes antes de funcionar', async () => {
    let requestCount = 0;

    server.use(
      http.get(`${process.env.CONVERSION_API_URL}/conversions`, () => {
        requestCount += 1;
        
        if (requestCount < 3) {
          return HttpResponse.json({
              id: 'conversao01',
              state: 'ERROR',
              inputFileName: 'documento.docx',
              inputFileFormat: 'docx',
              outputFileName: 'documento.pdf',
              outputFileFormat: 'pdf',
              createdAt: new Date().toISOString(),
              completedAt: null,
            },
            { status: 500 });
        }
      
        // Simula uma conversão bem-sucedida no terceiro request
        return HttpResponse.json({
          id: 'conversion-id',
          state: 'COMPLETED',
          inputFileName: 'documento.docx',
          inputFileFormat: 'docx',
          outputFileName: 'documento.pdf',
          outputFileFormat: 'pdf',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }, { status: 200 });
      })
    );
        
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
       name: 'documento.docx',
       mode: 'public',
       convertTo: 'pdf',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'documento.pdf',
      originalFile: {name: 'documento.docx'},
      mode: 'public',
    });
  });
});
