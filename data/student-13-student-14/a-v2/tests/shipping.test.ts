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

describe('Shipping (v2 API)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  afterAll(async () => {
    await app.close();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 1: Deve retornar sucesso 200 e cálculo do custo do frete com API v2.', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 5.3,
        volumeInLiters: 2.0,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body.distanceInKilometers).toBeGreaterThan(0);
    expect(response.body.costInCents).toBeGreaterThan(0);
    expect(response.body.originCity.state.name).toBe('São Paulo');
    expect(response.body.originCity.country.name).toBe('Brasil');
  });

  test('caso 2: Deve retornar erro de validação 400 quando parâmetros estiverem faltando com API v2.', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: '',
        destinationCityName: '',
        weightInKilograms: 5.3,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
  });

  test('caso 3: Deve retornar erro 400 quando a cidade de origem não for encontrada na API v2.', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: '99999',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 5.3,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Origin city not found');
  });

  test('caso 4: Deve retornar erro de servidor 400 quando o valor de peso passado for negativo com API v2.', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: -10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
  });
});
