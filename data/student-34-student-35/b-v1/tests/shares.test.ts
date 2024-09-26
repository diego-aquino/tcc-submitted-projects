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

const interceptorServer = setupServer(
  http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
    return HttpResponse.json<Conversion>({
      id: 'rtlfv9ve6jlor902uwlmul3g',
      state: 'PENDING',
      inputFileName: 'file.docx',
      inputFileFormat: 'docx',
      outputFileName: 'file.pdf',
      outputFileFormat: 'pdf',
      createdAt: '2024-09-05T18:05:46.097Z',
      completedAt: null,
    });
  }),
  http.get(`${process.env.LOCATION_API_URL}/conversions/:conversionId`, () => {
    return HttpResponse.json<Conversion>({
      id: 'rtlfv9ve6jlor902uwlmul3g',
      state: 'COMPLETED',
      inputFileName: 'file.docx',
      inputFileFormat: 'docx',
      outputFileName: 'file.pdf',
      outputFileFormat: 'pdf',
      createdAt: '2024-09-05T18:07:22.013Z',
      completedAt: '2024-09-05T18:07:22.313Z',
    });
  })
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
    console.log(response.body);
  });

  test('caso 1: caso de sucesso enviando um publico com conversão', async () => {
    const postsRequests: Request[] = [];
    const getRequests: Request[] = [];

    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions`,
        async ({ request }) => {
          const body = await request.json();
          expect(body.inputFile.name).toEqual('file.docx');
          expect(body.outputFile.format).toEqual('pdf');

          postsRequests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'rtlfv9ve6jlor902uwlmul3g',
            state: 'PENDING',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2024-09-05T18:05:46.097Z',
            completedAt: null,
          });
        }
      )
    );

    interceptorServer.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/:conversionId`,
        ({ request }) => {
          getRequests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'rtlfv9ve6jlor902uwlmul3g',
            state: 'COMPLETED',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2024-09-05T18:07:22.013Z',
            completedAt: '2024-09-05T18:07:22.313Z',
          });
        }
      )
    );

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'file.docx',
      mode: 'public',
      convertTo: 'pdf',
    });

    expect(response.body.name).toEqual('file.pdf');
    expect(response.body.mode).toEqual('public');
    expect(response.body.originalFile).toEqual({
      name: 'file.docx',
    });

    console.log(response.body);
    expect(postsRequests).toHaveLength(1);
    expect(getRequests).toHaveLength(1);

    expect(response.status).toBe(200);
  });

  test('caso 2: compartilhando um arquivo privado com conversão', async () => {
    const postsRequests: Request[] = [];
    const getRequests: Request[] = [];

    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions`,
        async ({ request }) => {
          const body = await request.json();
          expect(body.inputFile.name).toEqual('file.docx');
          expect(body.outputFile.format).toEqual('pdf');

          postsRequests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'rtlfv9ve6jlor902uwlmul3g',
            state: 'PENDING',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2024-09-05T18:05:46.097Z',
            completedAt: null,
          });
        }
      )
    );

    interceptorServer.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/:conversionId`,
        ({ request }) => {
          getRequests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'rtlfv9ve6jlor902uwlmul3g',
            state: 'COMPLETED',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2024-09-05T18:07:22.013Z',
            completedAt: '2024-09-05T18:07:22.313Z',
          });
        }
      )
    );

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'file.docx',
      mode: 'private',
      convertTo: 'pdf',
    });

    expect(response.body.name).toEqual('file.pdf');
    expect(response.body.mode).toEqual('private');
    expect(response.body.originalFile).toEqual({
      name: 'file.docx',
    });

    console.log(response.body);
    expect(postsRequests).toHaveLength(1);
    expect(getRequests).toHaveLength(1);

    expect(response.status).toBe(200);
  });

  test('caso 3: compartilhando um arquivo que demora para ser convertido', async () => {
    const postsRequests: Request[] = [];
    const getRequests: Request[] = [];

    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions`,
        async ({ request }) => {
          const body = await request.json();
          expect(body.inputFile.name).toEqual('file.docx');
          expect(body.outputFile.format).toEqual('pdf');

          postsRequests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'rtlfv9ve6jlor902uwlmul3g',
            state: 'PENDING',
            inputFileName: 'file.docx',
            inputFileFormat: 'docx',
            outputFileName: 'file.pdf',
            outputFileFormat: 'pdf',
            createdAt: '2024-09-05T18:05:46.097Z',
            completedAt: null,
          });
        }
      )
    );

    interceptorServer.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/:conversionId`,
        ({ request }) => {
          getRequests.push(request);
          if (getRequests.length < 3) {
            return HttpResponse.json<Conversion>({
              id: 'rtlfv9ve6jlor902uwlmul3g',
              state: 'PENDING',
              inputFileName: 'file.docx',
              inputFileFormat: 'docx',
              outputFileName: 'file.pdf',
              outputFileFormat: 'pdf',
              createdAt: '2024-09-05T18:07:22.013Z',
              completedAt: '2024-09-05T18:07:22.313Z',
            });
          } else {
            return HttpResponse.json<Conversion>({
              id: 'rtlfv9ve6jlor902uwlmul3g',
              state: 'COMPLETED',
              inputFileName: 'file.docx',
              inputFileFormat: 'docx',
              outputFileName: 'file.pdf',
              outputFileFormat: 'pdf',
              createdAt: '2024-09-05T18:07:22.013Z',
              completedAt: '2024-09-05T18:07:22.313Z',
            });
          }
        }
      )
    );

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'file.docx',
      mode: 'private',
      convertTo: 'pdf',
    });

    expect(response.body.name).toEqual('file.pdf');
    expect(response.body.mode).toEqual('private');
    expect(response.body.originalFile).toEqual({
      name: 'file.docx',
    });

    console.log(response.body);
    expect(postsRequests).toHaveLength(1);
    expect(getRequests).toHaveLength(3);

    expect(response.status).toBe(200);
  });

  test('caso 4: compartilhando um arquivo que ocorre um erro na conversão', async () => {
    const postsRequests: Request[] = [];
    const getRequests: Request[] = [];

    interceptorServer.use(
      http.post(
        `${process.env.CONVERSION_API_URL}/conversions`,
        async ({ request }) => {
          const body = await request.json();
          expect(body.inputFile.name).toEqual('file');
          expect(body.outputFile.format).toEqual('pdf');

          postsRequests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'rtlfv9ve6jlor902uwlmul3g',
            state: 'PENDING',
            inputFileName: 'file',
            inputFileFormat: '',
            outputFileName: 'file',
            outputFileFormat: '',
            createdAt: '2024-09-05T18:05:46.097Z',
            completedAt: null,
          });
        }
      )
    );

    interceptorServer.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/:conversionId`,
        ({ request }) => {
          getRequests.push(request);
          return HttpResponse.json<Conversion>({
            id: 'rtlfv9ve6jlor902uwlmul3g',
            state: 'ERROR',
            inputFileName: 'file',
            inputFileFormat: '',
            outputFileName: '',
            outputFileFormat: '',
            createdAt: '2024-09-05T18:07:22.013Z',
            completedAt: null,
          });
        }
      )
    );

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'file',
      mode: 'public',
      convertTo: 'pdf',
    });

    console.log(response.body);

    expect(response.body.message).toEqual('Error converting file');

    expect(postsRequests).toHaveLength(1);
    expect(getRequests).toHaveLength(1);

    expect(response.status).toBe(500);
  });
});
