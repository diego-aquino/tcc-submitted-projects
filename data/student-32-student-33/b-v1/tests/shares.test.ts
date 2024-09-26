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

import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';
import { Conversion } from '../src/clients/ConversionClient';

httpInterceptor.default.onUnhandledRequest(async (request, context) => {
  const url = new URL(request.url);
  if (url.hostname !== '127.0.0.1') {
    await context.log();
  }
});

type ShareSchema = HttpSchema<{
  '/conversions': {
    POST: {
      request: {
        body: {
          inputFile: {
            name: string;
          };
          outputFile: {
            format: string;
          };
        };
      };
      response: {
        200: { body: Conversion };
        500: { body: { state: string } };
        503: {};
      };
    };
  };
  '/conversions/zoba': {
    GET: {
      response: {
        200: { body: Conversion };
      };
    };
  };
  '/conversions/id-invalido': {
    GET: {
      response: {
        404: { body: { message: string } };
      };
    };
  };
}>;

const shareInterceptor = httpInterceptor.create<ShareSchema>({
  type: 'local',
  baseURL: process.env.CONVERSION_API_URL,
  saveRequests: true,
});

describe('Shares', () => {
  beforeAll(async () => {
    await shareInterceptor.start();
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    shareInterceptor.clear();
  });

  afterAll(async () => {
    await shareInterceptor.stop();
    await app.close();
  });

  test('caso 1: sucesso na conversão', async () => {
    shareInterceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            name: 'example.docx',
          },
          outputFile: {
            format: 'pdf',
          },
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: {
          id: 'zoba',
          state: 'PENDING',
          inputFileName: 'example.docx',
          inputFileFormat: 'docx',
          outputFileName: 'example.pdf',
          outputFileFormat: 'pdf',
          createdAt: '2024-09-07T14:39:53.455Z',
          completedAt: null,
        },
      });

    shareInterceptor.get('/conversions/zoba').respond({
      status: 200,
      body: {
        id: 'zoba',
        state: 'COMPLETED',
        inputFileName: 'example.docx',
        inputFileFormat: 'docx',
        outputFileName: 'example.pdf',
        outputFileFormat: 'pdf',
        createdAt: '2024-09-07T14:39:53.455Z',
        completedAt: null,
      },
    });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('example.pdf');
    expect(response.body.originalFile.name).toBe('example.docx');
  });

  test('caso 2: id invalido para a api de GET', async () => {
    shareInterceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            name: 'example.docx',
          },
          outputFile: {
            format: 'pdf',
          },
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: {
          id: 'id-invalido',
          state: 'PENDING',
          inputFileName: 'example.docx',
          inputFileFormat: 'docx',
          outputFileName: 'example.pdf',
          outputFileFormat: 'pdf',
          createdAt: '2024-09-07T14:39:53.455Z',
          completedAt: null,
        },
      });

    shareInterceptor.get('/conversions/id-invalido').respond({
      status: 404,
      body: {
        message: 'Conversion not found',
      },
    });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });

  test('caso 3: erro na conversão do arquivo', async () => {
    shareInterceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            name: 'example.docx',
          },
          outputFile: {
            format: 'pdf',
          },
        },
        exact: true,
      })
      .respond({
        status: 500,
        body: {
          state: 'ERROR',
        },
      });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });

  test('caso 4: Service Unavailable no post', async () => {
    shareInterceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            name: 'example.docx',
          },
          outputFile: {
            format: 'pdf',
          },
        },
        exact: true,
      })
      .respond({
        status: 503,
      });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(500);
  });
});
