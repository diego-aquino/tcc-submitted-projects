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
import { httpInterceptor } from 'zimic/interceptor/http';
import app, { ShareFileQuery } from '../src/server/app';
import { v1Schema } from './mocks/v1';

const myInterceptor = httpInterceptor.create<v1Schema>({
  type: 'local',
  baseURL: process.env.CONVERSION_API_URL,
  saveRequests: true, // Allow access to `handler.requests()`
});

describe('Shares', () => {
  beforeAll(async () => {
    await app.ready();
    await myInterceptor.start();
  });

  beforeEach(async () => {
    myInterceptor.clear();
  });

  afterEach(async () => {});

  afterAll(async () => {
    await myInterceptor.stop();
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

  test('caso 1: deve rodar ok', async () => {
    const req = myInterceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            format: 'docx',
            name: 'test',
          },
          outputFile: {
            format: 'pdf',
          },
        },
      })
      .respond({
        status: 201,
        body: {
          id: 'pfh0haxfpzowht3oi213cqos',
          state: 'PENDING',
          inputFileName: 'file.docx',
          inputFileFormat: 'docx',
          outputFileName: 'file.pdf',
          outputFileFormat: 'pdf',
          createdAt: '2021-08-01T12:00:00Z',
          completedAt: '2021-08-01T12:00:00Z',
        },
      });

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'file.docx',
      mode: 'public',
      convertTo: 'pdf',
    });

    expect(response.status).toBe(200);
  });

  test('caso 2', async () => {
    const req = myInterceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            format: 'docx',
            name: 'test',
          },
          outputFile: {
            format: 'invalidFormat', // Formato inválido
          },
        },
      })
      .respond({
        status: 400,
        body: {
          message: 'Formato de conversão inválido',
        },
      });

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'file.docx',
      mode: 'public',
      convertTo: 'invalidFormat', // Formato inválido
    });

    expect(response.status).toBe(200);
  });

  test('caso 3', async () => {
    const req = myInterceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            format: 'docx',
            name: 'file.docx',
          },
          outputFile: {
            format: 'docx', // Mesmo formato, sem conversão
          },
        },
      })
      .respond({
        status: 201,
        body: {
          id: 'pfh0haxfpzowht3oi213cqos',
          state: 'COMPLETED',
          inputFileName: 'file.docx',
          inputFileFormat: 'docx',
          outputFileName: 'file.docx',
          outputFileFormat: 'docx',
          createdAt: '2021-08-01T12:00:00Z',
          completedAt: '2021-08-01T12:00:00Z',
        },
      });

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'file.docx',
      mode: 'private', // Modo privado, sem conversão
    });

    expect(response.status).toBe(200);
  });

  test('caso 4: body vazio', async () => {
    const req = myInterceptor
      .post('/conversions')
      .with({
        body: {},
      })
      .respond({
        status: 500,
        body: {
          message: 'Erro interno do servidor',
        },
      });

    const response = await supertest(app.server).post('/shares/files').send({});

    expect(response.status).toBe(400);
  });
});
