import supertest from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import app, { ShareFileQuery } from '../src/server/app';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Conversion } from '../src/clients/ConversionClient';

const interceptorServer = setupServer();

describe('Shares', () => {
  beforeAll(async () => {
    interceptorServer.listen({
      onUnhandledRequest(request, print) {
        const url = new URL(request.url);
        if (url.hostname !== '127.0.0.1') {
          print.warning();
        }
      },
    });
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    interceptorServer.resetHandlers();
  });

  afterAll(async () => {
    await app.close();
    interceptorServer.close();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
  });

  test('caso 1: <Conversão .docx para .pdf aplicada - 2XX>', async () => {
    const requests: Request[] = [];

    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions`,
        ({ request }) => {
          requests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'pfh0haxfpzowht3oi213cqos',
            state: 'PENDING',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2021-08-01T12:00:00Z',
            completedAt: '2021-08-01T12:00:00Z',
          });
        }
      )
    );

    interceptorServer.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/pfh0haxfpzowht3oi213cqos`,
        ({ request }) => {
          requests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'pfh0haxfpzowht3oi213cqos',
            state: 'COMPLETED',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2021-08-01T12:00:00Z',
            completedAt: '2021-08-01T12:00:00Z',
          });
        }
      )
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    expect(requests).toHaveLength(2);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'file.pdf');
    expect(response.body).toHaveProperty('mode', 'public');
  });

  test('caso 2: <Nenhuma Conversão Aplicada - 2XX>', async () => {
    const requests: Request[] = [];
    const getRequests: Request[] = [];

    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions`,
        ({ request }) => {
          requests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'pfh0haxfpzowht3oi213cqos',
            state: 'COMPLETED',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2021-08-01T12:00:00Z',
            completedAt: '2021-08-01T12:00:00Z',
          });
        }
      )
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.docx',
        mode: 'public',
      } satisfies ShareFileQuery);
    expect(response.status).toBe(200);
    expect(requests).toHaveLength(0);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'file.docx');
    expect(response.body).toHaveProperty('mode', 'public');
  });

  test('caso 3: <Erro de Validação - 4XX>', async () => {
    const requests: Request[] = [];
    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions`,
        ({ request }) => {
          requests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'pfh0haxfpzowht3oi213cqos',
            state: 'PENDING',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2021-08-01T12:00:00Z',
            completedAt: '2021-08-01T12:00:00Z',
          });
        }
      )
    );

    interceptorServer.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/pfh0haxfpzowht3oi213cqos`,
        ({ request }) => {
          requests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'pfh0haxfpzowht3oi213cqos',
            state: 'COMPLETED',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2021-08-01T12:00:00Z',
            completedAt: '2021-08-01T12:00:00Z',
          });
        }
      )
    );
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: '',
        mode: 'public',
      } satisfies ShareFileQuery);
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Validation error');
  });

  test('caso 4: <Erro de Conversão - 5XX>', async () => {
    const requests: Request[] = [];

    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions`,
        ({ request }) => {
          requests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'pfh0haxfpzowht3oi213cqos',
            state: 'ERROR',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2021-08-01T12:00:00Z',
            completedAt: '2021-08-01T12:00:00Z',
          });
        }
      )
    );
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);
    expect(response.status).toBe(500);
    expect(response.body.message).toEqual('Error converting file');
  });
});
