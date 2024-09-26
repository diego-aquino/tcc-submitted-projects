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

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import app, { CalculateShippingQuery } from '../src/server/app';
import LocationClient, { LocationCity } from '../src/clients/LocationClient';
import { calculateShippingCost } from '../src/utils/shipping';

//https://v1-location-d8b1dd3.vercel.app

const server = setupServer(
  http.get('https://v1-location-d8b1dd3.vercel.app/cities/distances', () => {
    return HttpResponse.json(
      {
        kilometers: 90,
      },
      { status: 200 }
    );
  })
);

describe('Shipping', () => {
  beforeAll(async () => {
    server.listen();
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(() => server.resetHandlers());

  afterAll(async () => {
    server.close();
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
  });

  test('caso 1: retorna custo zero para cidades no mesmo estado', async () => {
    const { status, body } = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'João Pessoa, PB',
        weightInKilograms: 20,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(status).toBe(200);
    expect(body.costInCents).toBe(0);
  });

  test('caso 2: retorna custo correto para frete entre cidades de estados diferentes', async () => {
    const { status, body } = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 20,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(status).toBe(200);
    expect(body.costInCents).toBe(4190);
  });

  test('caso 3: retorna erro 400 para cidade inexistente', async () => {
    server.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, () => {
        return HttpResponse.json([], { status: 200 });
      })
    );

    const { status, body } = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 20,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(status).toBe(400);
  });

  test('caso 4: testa para entrada invalida de volume da encomenda', async () => {
    const { status, body } = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 20,
        volumeInLiters: -1,
      } satisfies CalculateShippingQuery);

    expect(status).toBe(400);
  });
});
