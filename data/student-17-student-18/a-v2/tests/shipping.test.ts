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

import app, { CalculateShippingQuery } from '../src/server/app';

describe('Shipping', () => {
  beforeAll(async () => {
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  afterAll(async () => {
    await app.close();
  });

  test('caso 1: Teste de Campina Grande - PB para Recife - PE, com 2.5kg e 0.3L', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 2.5,
        volumeInLiters: 0.3,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 2: Teste de Campina Grande - PB para Campinas - SP, com 4.5kg e 0.2L', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Campinas, SP',
        weightInKilograms: 4.5,
        volumeInLiters: 0.2,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 3: Teste de São Paulo - SP para Manaus - AM, com 9kg e 0.6L', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Manaus, AM',
        weightInKilograms: 9,
        volumeInLiters: 0.6,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 4: Teste de Fortaleza - CE para Divinópolis - MG, com 2kg e 0.3L', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Fortaleza, CE',
        destinationCityName: 'Divinópolis, MG',
        weightInKilograms: 2,
        volumeInLiters: 0.3,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    console.log(response.body);
  });
});
