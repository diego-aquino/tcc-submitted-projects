import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { myInterceptor } from './setup';

import app from '../src/server/app';

describe('Conversion API', () => {
  beforeAll(async () => {
    await myInterceptor.start();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await myInterceptor.stop();
  });

  test('caso 1: sucesso ao fazer upload e conversão de arquivo', async () => {
    myInterceptor.post('/conversions').respond({
      status: 202,
      body: {
        id: 'conversion-id',
        state: 'PENDING',
        inputFile: {
          name: 'file.docx',
          format: 'docx',
        },
        outputFile: {
          name: 'file.docx',
          format: 'docx',
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    });

    const response = await supertest(app.server)
      .post('/conversions')
      .send({
        inputFile: {
          name: 'file.docx',
          format: 'docx',
        },
        outputFile: {
          format: 'pdf',
        },
      });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      id: 'conversion-id',
      state: 'PENDING',
      inputFile: {
        name: 'file.docx',
        format: 'docx',
      },
      outputFile: {
        name: 'file.docx',
        format: 'docx',
      },
      createdAt: expect.any(String),
      completedAt: expect.any(String),
    });
  });

  test('caso 2: erro ao tentar converter um arquivo inválido', async () => {
    myInterceptor.post('/conversions').respond({
      status: 400,
      body: {
        message: 'Validation error',
        issues: [
          {
            message: 'Invalid input: expected string, received number',
            code: 'invalid_type',
            path: ['names', 1],
            additionalProp1: {},
          },
        ],
      },
    });

    const response = await supertest(app.server)
      .post('/conversions')
      .send({
        inputFile: {
          name: '',
          format: '',
        },
        outputFile: {
          format: '',
        },
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Validation error',
      issues: [
        {
          message: 'Invalid input: expected string, received number',
          code: 'invalid_type',
          path: ['names', 1],
          additionalProp1: {},
        },
      ],
    });
  });

  test('caso 3: checar status de conversão com sucesso', async () => {
    const searchHandler = myInterceptor
      .get('/conversions/conversion-id')
      .respond({
        status: 200,
        body: {
          id: 'conversion-id',
          state: 'PENDING',
          inputFile: {
            name: 'file.docx',
            format: 'docx',
          },
          outputFile: {
            name: 'file.docx',
            format: 'docx',
          },
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      });

    const response = await supertest(app.server).get(
      '/conversions/conversion-id'
    );

    expect(response.status).toBe(200);
    expect(Object.keys(response.body)).toHaveLength(6);
    expect(response.body).toEqual({
      id: 'conversion-id',
      state: 'PENDING',
      inputFile: {
        name: 'file.docx',
        format: 'docx',
      },
      outputFile: {
        name: 'file.docx',
        format: 'docx',
      },
      createdAt: expect.any(String),
      completedAt: expect.any(String),
    });

    const requests = searchHandler.requests();
    expect(requests).toHaveLength(1);
  });

  test('caso 4: checar status de conversão com erro', async () => {
    const searchHandler = myInterceptor
      .get('/conversions/conversion-id')
      .respond({
        status: 500,
        body: {
          message: 'Internal server error',
        },
      });

    const response = await supertest(app.server).get(
      '/conversions/conversion-id'
    );

    expect(response.status).toBe(500);
    expect(Object.keys(response.body)).toHaveLength(1);
    expect(response.body).toEqual({
      message: 'Internal server error',
    });

    const requests = searchHandler.requests();
    expect(requests).toHaveLength(1);
  });
});
