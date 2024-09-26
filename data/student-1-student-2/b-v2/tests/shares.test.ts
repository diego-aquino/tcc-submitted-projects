import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import app, { ShareFileQuery } from '../src/server/app';
import { Conversion } from '../src/clients/ConversionClient';
import { handlers } from './handlers';

const server = setupServer(...handlers);
describe('Shares', () => {
  beforeAll(async () => {
    await app.ready();
  });

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

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

  test('caso 1: shares a file with conversion successfully', async () => {
    const { status, body } = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.txt',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(status).toBe(200);

    expect(body).toEqual({
      id: expect.any(String),
      name: 'file.pdf',
      mode: 'public',
      originalFile: {
        name: 'file.txt',
      },
    });
  });

  test('caso 2: handles conversion error correctly', async () => {
    server.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/conversion-id`,
        () => {
          return HttpResponse.json<Conversion>({
            id: 'conversion-id',
            state: 'ERROR',
            input: {
              inputFileName: 'file.txt',
              inputFileFormat: 'txt',
            },
            output: {
              outputFileName: 'file.pdf',
              outputFileFormat: 'pdf',
            },
            createdAt: new Date().toISOString(),
            completedAt: null,
          });
        }
      )
    );
    const { status, body } = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.txt',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(status).toBe(500);

    expect(body).toEqual({
      message: 'Error converting file',
    });
  });

  test('caso 3: shares a file without conversion', async () => {
    const { status, body } = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.txt',
        mode: 'public',
      } satisfies ShareFileQuery);

    expect(status).toBe(200);

    expect(body).toEqual({
      id: expect.any(String),
      name: 'file.txt',
      mode: 'public',
      originalFile: undefined,
    });
  });

  test('caso 4: handles long-running conversion', async () => {
    let requestCount = 0;

    server.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/conversion-id`,
        () => {
          requestCount += 1;

          if (requestCount < 3) {
            return HttpResponse.json<Conversion>({
              id: 'conversion-id',
              state: 'PENDING',
              input: {
                inputFileName: 'file.txt',
                inputFileFormat: 'txt',
              },
              output: {
                outputFileName: 'file.pdf',
                outputFileFormat: 'pdf',
              },
              createdAt: new Date().toISOString(),
              completedAt: null,
            });
          }

          return HttpResponse.json<Conversion>({
            id: 'conversion-id',
            state: 'COMPLETED',
            input: {
              inputFileName: 'file.txt',
              inputFileFormat: 'txt',
            },
            output: {
              outputFileName: 'file.pdf',
              outputFileFormat: 'pdf',
            },
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          });
        }
      )
    );

    const { status, body } = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.txt',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(status).toBe(200);

    expect(body).toEqual({
      id: expect.any(String),
      name: 'file.pdf',
      mode: 'public',
      originalFile: {
        name: 'file.txt',
      },
    });

    expect(requestCount).toBe(3);
  });
});
