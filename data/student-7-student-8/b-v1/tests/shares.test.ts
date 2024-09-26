import { setupServer } from 'msw/node';
import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import { http, HttpResponse } from 'msw';
import { Conversion } from '../src/clients/ConversionClient';
import app, { ShareFileQuery } from '../src/server/app';

const server = setupServer(
  http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
    return HttpResponse.json<Conversion>({
      id: 'conversion-id',
      state: 'PENDING',
      inputFileName: 'example.txt',
      inputFileFormat: 'txt',
      outputFileName: 'example.pdf',
      outputFileFormat: 'pdf',
      createdAt: new Date().toISOString(),
      completedAt: null,
    });
  }),

  http.get(
    `${process.env.CONVERSION_API_URL}/conversions/conversion-id`,
    () => {
      return HttpResponse.json<Conversion>({
        id: 'conversion-id',
        state: 'COMPLETED',
        inputFileName: 'example.txt',
        inputFileFormat: 'txt',
        outputFileName: 'example.pdf',
        outputFileFormat: 'pdf',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }
  )
);

describe('Shares', () => {
  beforeAll(async () => {
    server.listen();
    await app.ready();
  });

  afterEach(() => {
    server.resetHandlers();
  });

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

  test('caso 1: Deve compartilhar um arquivo sem conversão', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('example.docx');
    expect(response.body.mode).toBe('public');
    expect(response.body.originalFile).toBeUndefined();
  });

  test('caso 2: Deve compartilhar um arquivo com conversão', async () => {
    const response = await supertest(app.server).post('/shares/files').send({
      name: 'example.docx',
      mode: 'public',
      convertTo: 'pdf',
    });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('example.pdf');
    expect(response.body.mode).toBe('public');
    expect(response.body.originalFile).toBeDefined();
    expect(response.body.originalFile.name).toBe('example.txt');
  });

  test('caso 3: Deve retornar erro se a conversão falhar', async () => {
    server.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/conversion-id`,
        () => {
          return HttpResponse.json<Conversion>({
            id: 'conversion-id',
            state: 'ERROR',
            inputFileName: 'example.docx',
            inputFileFormat: 'docx',
            outputFileName: '',
            outputFileFormat: '',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          });
        }
      )
    );

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'example.docx',
      mode: 'public',
      convertTo: 'pdf',
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Error converting file');
  });

  test('caso 4: Deve retornar 400 se a API de conversão retornar um erro', async () => {
    server.use(
      http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
        return HttpResponse.json<{ statusCode: Number; body: {} }>({
          statusCode: 400,
          body: JSON.stringify({ message: 'Bad Request' }),
        });
      })
    );

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'example.docx',
      mode: 'public',
      convertTo: 'pdf',
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});
