import supertest from 'supertest';
import {
  afterAll,
  afterEach,
  beforeEach,
  beforeAll,
  describe,
  expect,
  test,
} from 'vitest';

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import app, { ShareFileQuery } from '../src/server/app';
import { Conversion } from '../src/clients/ConversionClient';

const interceptorServer = setupServer(
  http.post(
    `${process.env.CONVERSION_API_URL}/conversions/conversion-id`,
    () => {
      return HttpResponse.json<Conversion>({
        id: 'id',
        state: 'PENDING',
        input: {
          inputFileName: 'example.docx',
          inputFileFormat: 'docx',
        },
        output: {
          outputFileName: 'example.pdf',
          outputFileFormat: 'pdf',
        },
        createdAt: new Date().toISOString(),
        completedAt: null,
      });
    }
  ),
  http.get(
    `${process.env.CONVERSION_API_URL}/conversions/conversion-id`,
    () => {
      return HttpResponse.json<Conversion>({
        id: 'id',
        state: 'COMPLETED',
        input: {
          inputFileName: 'example.docx',
          inputFileFormat: 'docx',
        },
        output: {
          outputFileName: 'example.pdf',
          outputFileFormat: 'pdf',
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }
  )
);

describe('Conversion API', () => {
  beforeAll(async () => {
    await app.ready();
    interceptorServer.listen();
  });

  beforeEach(async () => {
    interceptorServer.resetHandlers();
  });

  afterEach(async () => {
    interceptorServer.resetHandlers();
  });

  afterAll(async () => {
    await app.close();
    interceptorServer.close();
  });

  test('caso 1: Sucesso na conversão do arquivo', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'teste1.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    console.log(response.body);
    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'teste1.pdf',
      mode: 'public',
      originalFile: {
        name: 'teste1.docx',
      },
    });
  });

  test('caso 2: Falha na conversão', async () => {
    // não entendo por que não está sobrescrevendo
    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions/conversion-id`,
        () => {
          return HttpResponse.json<Conversion>(
            {
              id: 'id',
              state: 'ERROR',
              input: {
                inputFileName: 'example.docx',
                inputFileFormat: 'docx',
              },
              output: {
                outputFileName: 'example.pdf',
                outputFileFormat: 'pdf',
              },
              createdAt: new Date().toISOString(),
              completedAt: null,
            },
            { status: 500 }
          );
        }
      )
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'teste2.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    console.log(response.body);

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: 'Error converting file',
    });
  });

  test('caso 3: Compartilhando sem converter', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'teste3.docx',
        mode: 'public',
      } satisfies ShareFileQuery);

    console.log(response.body);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'teste3.docx',
      mode: 'public',
      originalFile: undefined,
    });
  });

  test('caso 4: Formato inválido', async () => {
    // Não está sobrescrevendo
    // Como especificar como erro 400?
    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions/conversion-id`,
        () => {
          return HttpResponse.json<Conversion>(
            {
              id: 'id',
              state: 'ERROR',
              input: {
                inputFileName: 'example.docx',
                inputFileFormat: 'docx',
              },
              output: {
                outputFileName: 'example.pdf',
                outputFileFormat: 'pdf',
              },
              createdAt: new Date().toISOString(),
              completedAt: null,
            },
            { status: 400 }
          );
        }
      )
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.unknown',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Error converting file',
    });
  });
});
