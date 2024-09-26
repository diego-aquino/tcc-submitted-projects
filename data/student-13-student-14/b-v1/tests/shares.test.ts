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

import { httpInterceptor } from 'zimic/interceptor/http';
import { HttpSchema } from 'zimic/http';

import { Conversion } from '../src/clients/ConversionClient';

const CONVERSION_API_URL = process.env.CONVERSION_API_URL;

type ConversionApiSchema = HttpSchema<{
  '/conversions': {
    POST: {
      response: {
        200: { body: Conversion };
        500: { body: { message: string } };
      };
    };
  };
  '/conversions/:id': {
    GET: {
      response: {
        200: { body: Conversion };
        500: { body: { message: string } };
      };
    };
  };
}>;

const interceptor = httpInterceptor.create<ConversionApiSchema>({
  type: 'local',
  baseURL: CONVERSION_API_URL,
  saveRequests: true,
});

describe('Shares', () => {
  beforeAll(async () => {
    await interceptor.start();
    await app.ready();
  });

  beforeEach(async () => {
    interceptor.clear();
  });

  afterEach(async () => {
    interceptor.clear();
  });

  afterAll(async () => {
    await app.close();
    await interceptor.stop();
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

  test('caso 1: sucesso - conversão de arquivo (2XX)', async () => {
    const conversion: Conversion = {
      id: 'conversion-id-1',
      state: 'COMPLETED',
      inputFileName: 'example.txt',
      inputFileFormat: 'txt',
      outputFileName: 'example.pdf',
      outputFileFormat: 'pdf',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    interceptor.post('/conversions').respond({
      status: 200,
      body: conversion,
    });

    interceptor.get('/conversions/:id').respond({
      status: 200,
      body: conversion,
    });

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'example.txt',
      mode: 'public',
      convertTo: 'pdf',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'example.pdf',
      mode: 'public',
      originalFile: { name: 'example.txt' },
    });
  });

  test('caso 2: sucesso - compartilhamento sem conversão (2XX)', async () => {
    const response = await supertest(app.server).post('/shares/files').send({
      name: 'example.txt',
      mode: 'public',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'example.txt',
      mode: 'public',
      originalFile: undefined,
    });
  });

  test('caso 3: erro - validação de parâmetros inválidos (4XX)', async () => {
    const response = await supertest(app.server).post('/shares/files').send({
      mode: 'public',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      issues: expect.any(Array),
    });
  });

  test('caso 4: erro - falha na conversão (5XX)', async () => {
    interceptor.post('/conversions').respond({
      status: 500,
      body: { message: 'Error converting file' },
    });

    const response = await supertest(app.server).post('/shares/files').send({
      name: 'example.txt',
      mode: 'private',
      convertTo: 'pdf',
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error',
    });
  });
});
