import supertest from 'supertest';
import { httpInterceptor } from 'zimic/interceptor/http';
import { type HttpSchema } from 'zimic/http';

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

httpInterceptor.default.onUnhandledRequest(async (request, context) => {
  const url = new URL(request.url);

  if (url.hostname !== '127.0.0.1') {
    await context.log();
  }
});

const CONVERSION_API_URL = process.env.CONVERSION_API_URL;

interface Conversion {
  id: string;
  state: 'PENDING' | 'COMPLETED' | 'ERROR';
  inputFileName: string;
  inputFileFormat: string;
  outputFileName: string;
  outputFileFormat: string;
  createdAt: string;
  completedAt: string | null;
}

type MeuSchemaGetConversion = HttpSchema<{
  '/conversions': {
    POST: {
      request: {
        body: {
          inputFile: {
            name: string;
            format: string;
          };
          outputFile: {
            format: string;
          };
        };
      };
      response: {
        200: { body: Conversion }; // User create
        400: { body: { message: string } }; // Bad request
      };
    };
  };
}>;

const interceptor = httpInterceptor.create<MeuSchemaGetConversion>({
  type: 'local',
  baseURL: CONVERSION_API_URL,
  saveRequests: true,
});

const interceptorII = httpInterceptor.create<{
  '/conversions/:conversionId': {
    GET: {
      request: {};
      response: {
        200: { body: Conversion };
        400: { body: { message: string } };
      };
    };
  };
}>({
  type: 'local',
  baseURL: CONVERSION_API_URL,
  saveRequests: true,
});

describe('Shares', () => {
  beforeAll(async () => {
    await interceptor.start();
    await interceptorII.start();
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    interceptor.clear();
    interceptorII.clear();
  });

  afterAll(async () => {
    await interceptor.stop();
    await interceptorII.stop();
    await app.close();
  });

  test('caso 1: todos os parametros corretos', async () => {
    const postHandler = interceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            name: 'file.docx',
          },
          outputFile: {
            format: 'pdf',
          },
        },
      })
      .respond({
        status: 200,
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

    const getHandler = interceptorII.get('/conversions/:conversionId').respond({
      status: 200,
      body: {
        id: 'pfh0haxfpzowht3oi213cqos',
        state: 'COMPLETED',
        inputFileName: 'file.docx',
        inputFileFormat: 'docx',
        outputFileName: 'file.pdf',
        outputFileFormat: 'pdf',
        createdAt: '2021-08-01T12:00:00Z',
        completedAt: '2021-08-01T12:00:00Z',
      },
    });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(postHandler.requests()).toHaveLength(1);
    expect(getHandler.requests()).toHaveLength(1);
    expect(response.status).toBe(200);
    expect(response.body.name).toEqual('file.pdf');
  }, 10000);

  test('caso 2: caso não seja passado o nome do arquivo', async () => {
    const postHandler = interceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            name: 'file.docx',
          },
          outputFile: {
            format: 'pdf',
          },
        },
      })
      .respond({
        status: 200,
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

    const getHandler = interceptorII.get('/conversions/:conversionId').respond({
      status: 200,
      body: {
        id: 'pfh0haxfpzowht3oi213cqos',
        state: 'COMPLETED',
        inputFileName: 'file.docx',
        inputFileFormat: 'docx',
        outputFileName: 'file.pdf',
        outputFileFormat: 'pdf',
        createdAt: '2021-08-01T12:00:00Z',
        completedAt: '2021-08-01T12:00:00Z',
      },
    });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: '',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Validation error');
  });

  test('caso 3: enviando sem fazer converção', async () => {
    const postHandler = interceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            name: 'file',
            format: 'docx',
          },
          outputFile: {
            format: 'pdf',
          },
        },
      })
      .respond({
        status: 200,
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

    const getHandler = interceptorII.get('/conversions/:conversionId').respond({
      status: 200,
      body: {
        id: 'pfh0haxfpzowht3oi213cqos',
        state: 'COMPLETED',
        inputFileName: 'file.docx',
        inputFileFormat: 'docx',
        outputFileName: 'file.pdf',
        outputFileFormat: 'pdf',
        createdAt: '2021-08-01T12:00:00Z',
        completedAt: '2021-08-01T12:00:00Z',
      },
    });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.docx',
        mode: 'public',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    expect(response.body.name).toEqual('file.docx');
    expect(response.body.mode).toEqual('public');
  });

  test('caso 4: Testando quando o mode é privado', async () => {
    const postHandler = interceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            name: 'file',
            format: 'docx',
          },
          outputFile: {
            format: 'pdf',
          },
        },
      })
      .respond({
        status: 200,
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

    const getHandler = interceptorII.get('/conversions/:conversionId').respond({
      status: 200,
      body: {
        id: 'pfh0haxfpzowht3oi213cqos',
        state: 'COMPLETED',
        inputFileName: 'file.docx',
        inputFileFormat: 'docx',
        outputFileName: 'file.pdf',
        outputFileFormat: 'pdf',
        createdAt: '2021-08-01T12:00:00Z',
        completedAt: '2021-08-01T12:00:00Z',
      },
    });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'file.docx',
        mode: 'private',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

      console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.name).toEqual('file.pdf');
    expect(response.body.mode).toEqual('private');
  });
});
