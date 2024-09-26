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

interface ValidationError {
  message: string;
  issues: Issue[];
}

interface Issue {
  code: string;
  minimum: number;
  type: string;
  inclusive: boolean;
  exact: boolean;
  message: string;
  path: any;
}

type ConversionSchema = HttpSchema<{
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
        400: { body: ValidationError };
        500: { body: { message: string } };
      };
    };
  };

  '/conversions/:conversionId': {
    GET: {
      request: {};
      response: {
        200: { body: Conversion };
      };
    };
  };
}>;

const conversionInterceptor = httpInterceptor.create<ConversionSchema>({
  type: 'local',
  baseURL: process.env.CONVERSION_API_URL,
  saveRequests: true,
});

describe('Shares', () => {
  beforeAll(async () => {
    await app.ready();
    await conversionInterceptor.start();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    conversionInterceptor.clear();
  });

  afterAll(async () => {
    await app.close();
    await conversionInterceptor.stop();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: '',
        mode: 'private',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(400);
    console.log(response.body);
  });

  test('caso 1: sucesso (200)', async () => {
    const testPostResponse: Conversion = {
      id: 'qfo92s2ie29ieh1n3jvld4tc',
      state: 'PENDING',
      inputFileName: 'example.docx',
      inputFileFormat: 'docx',
      outputFileName: 'example.pdf',
      outputFileFormat: 'pdf',
      createdAt: '2024-09-08T20:35:03.909Z',
      completedAt: null,
    };

    const postConversionHandler = conversionInterceptor
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
      })
      .respond({
        status: 200,
        body: testPostResponse,
      });

    const testGetResponse: Conversion = {
      id: 'qfo92s2ie29ieh1n3jvld4tc',
      state: 'COMPLETED',
      inputFileName: 'example.docx',
      inputFileFormat: 'docx',
      outputFileName: 'example.pdf',
      outputFileFormat: 'pdf',
      createdAt: '2024-09-08T20:35:03.909Z',
      completedAt: '2024-09-08T20:35:03.851Z',
    };

    const getConversionHandler = conversionInterceptor
      .get('/conversions/:conversionId')
      .respond({
        status: 200,
        body: testGetResponse,
      });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: testGetResponse.outputFileName,
        mode: 'public',
        originalFile: { name: testGetResponse.inputFileName },
      })
    );

    const postRequests = postConversionHandler.requests();
    expect(postRequests).toHaveLength(1);
    const postRequest = postRequests[0];
    expect(postRequest.body.inputFile.name).toBe('example.docx');
    expect(postRequest.body.outputFile.format).toBe('pdf');

    const getRequests = getConversionHandler.requests();
    expect(getRequests).toHaveLength(1);
  });

  test('caso 2: Validation error (400)', async () => {
    const testPostResponse = {
      message: 'Validation error',
      issues: [
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'String must contain at least 1 character(s)',
          path: [Array],
        },
      ],
    };

    const postConversionHandler = conversionInterceptor
      .post('/conversions')
      .with({
        body: {
          inputFile: {
            name: '',
          },
          outputFile: {
            format: 'pdf',
          },
        },
      })
      .respond({
        status: 400,
        body: testPostResponse,
      });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: '',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Validation error',
        issues: [
          expect.objectContaining({
            code: 'too_small',
            minimum: 1,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'String must contain at least 1 character(s)',
          }),
        ],
      })
    );

    const postRequests = postConversionHandler.requests();
    expect(postRequests).toHaveLength(0);
  });

  test('caso 3: Error converting file (500)', async () => {
    const testPostResponse: Conversion = {
      id: 'qfo92s2ie29ieh1n3jvld4tc',
      state: 'ERROR',
      inputFileName: 'example.docx',
      inputFileFormat: 'docx',
      outputFileName: 'example.pdf',
      outputFileFormat: 'pdf',
      createdAt: '2024-09-08T20:35:03.909Z',
      completedAt: null,
    };

    const postConversionHandler = conversionInterceptor
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
      })
      .respond({
        status: 200,
        body: testPostResponse,
      });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Error converting file' });

    const postRequests = postConversionHandler.requests();
    expect(postRequests).toHaveLength(1);
    const postRequest = postRequests[0];
    expect(postRequest.body.inputFile.name).toBe('example.docx');
    expect(postRequest.body.outputFile.format).toBe('pdf');
  });

  test('caso 4: Internal server error (500)', async () => {
    const testPostResponse = {
      message: 'Internal server error',
    };

    const postConversionHandler = conversionInterceptor
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
      })
      .respond({
        status: 500,
        body: testPostResponse,
      });

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: '',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Validation error',
        issues: [
          expect.objectContaining({
            code: 'too_small',
            minimum: 1,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'String must contain at least 1 character(s)',
          }),
        ],
      })
    );

    const postRequests = postConversionHandler.requests();
    expect(postRequests).toHaveLength(0);
  });
});
