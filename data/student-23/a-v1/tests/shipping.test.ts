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

import { httpInterceptor } from 'zimic/interceptor/http';
import { CitiesSchema, DistanceSchema, LocationCity } from './types';

httpInterceptor.default.onUnhandledRequest(async (request, context) => {
  const url = new URL(request.url);

  if (url.hostname !== '127.0.0.1') {
    await context.log();
  }
});

const citySchemaInterceptor = httpInterceptor.create<CitiesSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL,
  saveRequests: true,
});

const distanceSchemaInterceptor = httpInterceptor.create<DistanceSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL,
  saveRequests: true,
});

let saoPaulo: LocationCity[];
let campinaGrande: LocationCity[];
let joaoPessoa: LocationCity[];

const campinaGrandeId = '30';
const joaoPessoaId = '28';
const saoPauloId = '10';

saoPaulo = [
  {
    id: '10',
    name: 'São Paulo',
    stateName: 'São Paulo',
    stateCode: 'SP',
    countryName: 'Brasil',
    countryCode: 'BRA',
  },
];

campinaGrande = [
  {
    id: '30',
    name: 'Campina Grande',
    stateName: 'Paraíba',
    stateCode: 'PB',
    countryName: 'Brasil',
    countryCode: 'BRA',
  },
];

joaoPessoa = [
  {
    id: '28',
    name: 'João Pessoa',
    stateName: 'Paraíba',
    stateCode: 'PB',
    countryName: 'Brasil',
    countryCode: 'BRA',
  },
];

describe('Before and after test', () => {
  beforeAll(async () => {
    await app.ready();
    await citySchemaInterceptor.start();
    await distanceSchemaInterceptor.start();
  });

  afterEach(async () => {
    citySchemaInterceptor.clear();
    distanceSchemaInterceptor.clear();
  });

  afterAll(async () => {
    await app.close();
    await citySchemaInterceptor.stop();
    await distanceSchemaInterceptor.stop();
  });

  test('caso 1: Quando buscamos o custo entre duas cidades existentes (2XX)', async () => {
    const saoPauloCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'São Paulo, SP' },
        exact: true,
      })
      .respond({ status: 200, body: saoPaulo });

    const campinaGrandeCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Campina Grande, PB' },
        exact: true,
      })
      .respond({ status: 200, body: campinaGrande });

    const distanceHandlerInterceptor = distanceSchemaInterceptor
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: saoPauloId,
          destinationCityId: campinaGrandeId,
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: { kilometers: 1000000 },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    const requests1 = saoPauloCityInterceptor.requests();
    const requests2 = campinaGrandeCityInterceptor.requests();
    const requests3 = distanceHandlerInterceptor.requests();

    expect(requests1[0].searchParams.size).toBe(1);
    expect(requests1[0].searchParams.get('query')).toBe('São Paulo, SP');

    expect(requests2[0].searchParams.size).toBe(1);
    expect(requests2[0].searchParams.get('query')).toBe('Campina Grande, PB');

    expect(requests3[0].searchParams.size).toBe(2);
    expect(requests3[0].searchParams.get('originCityId')).toBe('10');
    expect(requests3[0].searchParams.get('destinationCityId')).toBe('30');

    expect(response.body.distanceInKilometers).toBe(1000000);
    expect(response.body).toEqual({
      distanceInKilometers: 1000000,
      costInCents: 2002010,
    });
  });

  test('caso 2: Verificamos se frete dentro de um mesmo estado é grátis', async () => {
    const campinaGrandeInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Campina Grande, PB' },
        exact: true,
      })
      .respond({ status: 200, body: campinaGrande });

    const joaoPessoaInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'João Pessoa, PB' },
        exact: true,
      })
      .respond({ status: 200, body: joaoPessoa });

    const distanceHandlerInterceptor = distanceSchemaInterceptor
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: campinaGrandeId,
          destinationCityId: joaoPessoaId,
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: { kilometers: 126 },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'João Pessoa, PB',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    const requests1 = joaoPessoaInterceptor.requests();
    const requests2 = campinaGrandeInterceptor.requests();
    const requests3 = distanceHandlerInterceptor.requests();

    expect(requests1[0].searchParams.get('query')).toBe('João Pessoa, PB');
    expect(requests2[0].searchParams.get('query')).toBe('Campina Grande, PB');

    expect(requests3[0].searchParams.get('originCityId')).toBe(campinaGrandeId);
    expect(requests3[0].searchParams.get('destinationCityId')).toBe(
      joaoPessoaId
    );

    expect(response.body.distanceInKilometers).toBe(126);
    expect(response.body).toEqual({
      distanceInKilometers: 126,
      costInCents: 0,
    });
  });

  test('caso 3: Quando buscamos por uma cidade inexistente (5XX)', async () => {
    const invalidCityCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Cidade que ñ existe' },
        exact: true,
      })
      .respond({ status: 500, body: { message: 'Internal server error' } });

    const campinaGrandeCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Campina Grande, PB' },
        exact: true,
      })
      .respond({ status: 200, body: campinaGrande });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Cidade que ñ existe',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 10,
        volumeInLiters: 10,
      } satisfies CalculateShippingQuery);

    const responses = invalidCityCityInterceptor.requests();
    const responsesCG = campinaGrandeCityInterceptor.requests();

    expect(responses[0].searchParams.get('query')).toBe('Cidade que ñ existe');

    expect(responsesCG[0].searchParams.get('query')).toBe('Campina Grande, PB');

    expect(response.body.message).toBe('Internal server error');
    expect(response.status).toBe(500);
  });

  test('caso 4: Frete grátis quando a distância é 0 (Entrega na mesma cidade)', async () => {
    const campinaGrandeCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Campina Grande, PB' },
        exact: true,
      })
      .respond({ status: 200, body: campinaGrande });

    const distanceHandlerInterceptor = distanceSchemaInterceptor
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: campinaGrandeId,
          destinationCityId: campinaGrandeId,
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: { kilometers: 0 },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 10,
        volumeInLiters: 10,
      } satisfies CalculateShippingQuery);

    const responses = campinaGrandeCityInterceptor.requests();

    expect(responses[0].searchParams.get('query')).toBe('Campina Grande, PB');

    expect(response.body).toEqual({
      distanceInKilometers: 0,
      costInCents: 0,
    });
  });
});
