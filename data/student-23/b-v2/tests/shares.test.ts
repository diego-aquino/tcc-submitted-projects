import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import app, { ShareFileQuery } from '../src/server/app';
import { server, setupTests } from './setup';
import { http, HttpResponse } from 'msw';

setupTests();

describe('Shares', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test('caso 1: compartilhamento de arquivo com conversão bem-sucedida', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'converted-file.pdf',
      mode: 'public',
      originalFile: { name: 'example.docx' },
    });
  });

  test('caso 2: erro ao converter arquivo (erro 500)', async () => {
    server.use(
      http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
        return HttpResponse.json(
          { message: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Error communicating with the conversion API',
      details: {
        message: 'Request failed with status code 500',
        status: 500,
        data: {
          message: 'Internal Server Error',
        },
      },
    });
  });

  test('caso 3: conversão não encontrada (erro 404)', async () => {
    server.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/:conversionId`,
        () => {
          return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
        }
      )
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Error communicating with the conversion API',
      details: {
        message: 'Request failed with status code 404',
        status: 404,
        data: {
          message: 'Not Found',
        },
      },
    });
  });

  test('caso 4: compartilhamento de arquivo sem conversão', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'private',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'example.docx',
        mode: 'private',
      })
    );
  });
});
