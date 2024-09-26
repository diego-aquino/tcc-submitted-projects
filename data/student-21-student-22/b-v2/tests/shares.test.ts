import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import app, { ShareFileQuery } from '../src/server/app';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Conversion } from '../src/clients/ConversionClient';

const interceptorServer = setupServer(
  http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
    return HttpResponse.json<Conversion>(
      {
        id: 'pfh0haxfpzowht3oi213cqos',
        state: 'PENDING',
        inputFile: { name: 'file.docx', format: 'docx' },
        outputFile: { name: 'file.pdf', format: 'pdf' },
        createdAt: '2021-08-01T12:00:00Z',
        completedAt: '2021-08-01T12:00:00Z',
      },
      { status: 200 }
    );
  }),
  http.get(
    `${process.env.CONVERSION_API_URL}/conversions/:conversionId`,
    () => {
      return HttpResponse.json<Conversion>(
        {
          id: 'pfh0haxfpzowht3oi213cqos',
          state: 'PENDING',
          inputFile: { name: 'file.docx', format: 'docx' },
          outputFile: { name: 'file.pdf', format: 'pdf' },
          createdAt: '2021-08-01T12:00:00Z',
          completedAt: '2021-08-01T12:00:00Z',
        },
        { status: 200 }
      );
    }
  )
);

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

  afterEach(async () => {
    interceptorServer.resetHandlers();
  });

  afterAll(async () => {
    await app.close();
    interceptorServer.close();
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
            inputFile: { name: 'file.docx', format: 'docx' },
            outputFile: { name: 'file.pdf', format: 'pdf' },
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
            inputFile: { name: 'file.docx', format: 'docx' },
            outputFile: { name: 'file.pdf', format: 'pdf' },
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
    expect(response.body.originalFile).toEqual({ name: 'file.docx' });
  });

  test('caso 2: <Nenhuma Conversão Aplicada - 2XX>', async () => {
    const requests: Request[] = [];

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
    expect(response.body.originalFile).toBeUndefined();
  });

  test('caso 3: <Erro de Validação - 4XX>', async () => {
    const requests: Request[] = [];

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
            inputFile: { name: 'file.docx', format: 'docx' },
            outputFile: { name: 'file.pdf', format: 'pdf' },
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
