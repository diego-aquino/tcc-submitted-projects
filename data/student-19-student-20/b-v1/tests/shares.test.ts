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

const apiMock = setupServer(
  http.post(
    `${process.env.CONVERSION_API_URL}/conversions`,
    async ({ request }) => {
      const body = await request.json();
      const inputNameData = body.inputFile.name.split('.');
      return HttpResponse.json(
        {
          id: 'pfh0haxfpzowht3oi213cqos',
          state: 'PENDING',
          inputFileName: `${inputNameData[0]}.${inputNameData[1]}`,
          inputFileFormat: inputNameData[1],
          outputFileName: `${inputNameData[0]}.${body.outputFile.format}`,
          outputFileFormat: body.outputFile.format,
          createdAt: '2021-08-01T12:00:00Z',
          completedAt: '2021-08-01T12:00:00Z',
        } satisfies Conversion,
        {
          status: 202,
        }
      );
    }
  ),
  http.get(
    `${process.env.CONVERSION_API_URL}/conversions/:id`,
    ({ params }) => {
      return HttpResponse.json(
        {
          id: params.id,
          state: 'COMPLETED',
          inputFileName: 'example.docx',
          inputFileFormat: 'docx',
          outputFileName: 'example.pdf',
          outputFileFormat: 'pdf',
          createdAt: '2021-08-01T12:00:00Z',
          completedAt: '2021-08-01T12:00:00Z',
        },
        {
          status: 200,
        }
      );
    }
  )
);

apiMock.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url);
});

describe('Shares', () => {
  beforeAll(async () => {
    apiMock.listen();
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    apiMock.resetHandlers();
  });

  afterAll(async () => {
    apiMock.close();
    await app.close();
  });

  test('caso 1: shareFiles should share a regular file', async () => {
    const requestBody: ShareFileQuery = {
      name: 'example.docx',
      mode: 'public',
    };
    const response = await supertest(app.server)
      .post('/shares/files')
      .send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body.id).not.toBe(null);
    expect(response.body.name).toBe(requestBody.name);
    expect(response.body.mode).toBe(requestBody.mode);
  });

  test('caso 2: shareFiles should convert type to pdf', async () => {
    const requestBody: ShareFileQuery = {
      name: 'example.docx',
      mode: 'public',
      convertTo: 'pdf',
    };
    const response = await supertest(app.server)
      .post('/shares/files')
      .send(requestBody);

    const expectedName = 'example.pdf';
    expect(response.status).toBe(200);
    expect(response.body.id).not.toBe(null);
    expect(response.body.name).toBe(expectedName);
    expect(response.body.mode).toBe(requestBody.mode);
  });

  test('caso 3: should return http error when api de conversao return an error', () => {
    apiMock.boundary(async () => {
      apiMock.use(
        http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
          return HttpResponse.json({
            status: 'ERROR',
          });
        }),
        http.get(`${process.env.CONVERSION_API_URL}/conversions/:id`, () => {
          return HttpResponse.json({
            status: 'ERROR',
          });
        })
      );
      const errorMessage = 'Error converting file';
      const response = await supertest(app.server)
        .post('/shares/files')
        .send({
          name: 'example.docx',
          mode: 'public',
        } satisfies ShareFileQuery);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe(errorMessage);
    });
  });

  test('caso 4: shareFile should return badRequest when pass invalid arguments', async () => {
    const requestBody = {
      name: 123,
      mode: 'public',
    };
    const response = await supertest(app.server)
      .post('/shares/files')
      .send(requestBody);

    expect(response.status).toBe(400);
  });
});
