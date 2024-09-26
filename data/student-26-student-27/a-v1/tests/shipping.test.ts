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
import { LocationApiMock } from './mocks/location';

describe('Shipping', () => {
  beforeAll(async () => {
    LocationApiMock.listen();
    await app.ready();
  });

  afterEach(async () => {
    LocationApiMock.resetHandlers();
  });

  afterAll(async () => {
    LocationApiMock.close();
    await app.close();
  });

  test('Quando ambas as cidades existem, a requisição para calcular o frete entre elas deve retornar um status 200', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
  });

  test('Dado que a cidade de origem não foi encontrada, a requisição para calcular o frete entre elas deve retornar um status 400', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Recife, PE',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
  });

  test('Dado que a cidade de destino não foi encontrada, a requisição para calcular o frete entre elas deve retornar um status 400', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
  });

  test('Dado que ambas as cidades não foram encontradas, a requisição para calcular o frete entre elas deve retornar um status 400', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'João Pessoa, PB',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
  });
});
