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
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import app from '../src/server/app';
const API_URL = 'https://v1-conversion-bd636ba3.vercel.app/conversions';

const interceptorServer = setupServer(
  http.post(`${API_URL}/convert`, () => {
    return HttpResponse.json(
      {
        id: '56b87018-731a-4f17-acb0-261bded5b7f9',
        name: 'example.pdf',
        mode: 'public',
        originalFile: { name: 'example.docx' },
      },
      { status: 200 }
    );
  }),

  http.get(`${API_URL}/convert/dhmfileyr1ul5e3h5u2e53z0`, () => {
    return HttpResponse.json(
      {
        id: '56b87018-731a-4f17-acb0-261bded5b7f9',
        name: 'example.pdf',
        mode: 'public',
        originalFile: { name: 'example.docx' },
      },
      { status: 200 }
    );
  }),

  http.post(`${API_URL}/convert`, () => {
    return HttpResponse.json(
      {
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }),

  http.get(`${API_URL}/convert/d5msvrvtzo7d65irt5ep1e2g`, () => {
    return HttpResponse.json(
      {
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }),

  http.post(`${API_URL}/convert`, () => {
    return HttpResponse.json(
      {
        message: 'Validation error',
        issues: [
          {
            code: 'too_small',
            minimum: 1,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'String must contain at least 1 character(s)',
            path: ['name'],
          },
        ],
      },
      { status: 400 }
    );
  }),

  http.get(`${API_URL}/convert/invalid_id`, () => {
    return HttpResponse.json(
      {
        error: 'Not Found',
        message: 'Route GET:/shares/invalid_id not found',
        statusCode: 404,
      },
      { status: 404 }
    );
  })
);

describe('Shares (MSW)', () => {
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

  test('caso 1: sucesso (2XX)', async () => {
    const response = await supertest(app.server)
      .post('/shares')
      .send({ file: 'example.docx' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: '56b87018-731a-4f17-acb0-261bded5b7f9',
      name: 'example.pdf',
      mode: 'public',
      originalFile: { name: 'example.docx' },
    });
  });

  test('caso 2: erro do servidor (5XX)', async () => {
    const response = await supertest(app.server)
      .post('/shares')
      .send({ file: 'example.docx' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error',
    });
  });

  test('caso 3: erro de solicitação (4XX)', async () => {
    const response = await supertest(app.server)
      .post('/shares')
      .send({ file: '' }); // Supondo que um arquivo vazio causa o erro

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      issues: [
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'String must contain at least 1 character(s)',
          path: ['name'],
        },
      ],
    });
  });

  test('caso 4: sem conversão', async () => {
    const response = await supertest(app.server).get('/shares/invalid_id');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Not Found',
      message: 'Route GET:/shares/invalid_id not found',
      statusCode: 404,
    });
  });
});
