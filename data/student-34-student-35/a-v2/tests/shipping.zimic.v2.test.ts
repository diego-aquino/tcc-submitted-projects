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

import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';
import { LocationCity, LocationDistance } from '../src/clients/LocationClient';

httpInterceptor.default.onUnhandledRequest(async (request, context) => {
  const url = new URL(request.url);

  if (url.hostname !== '127.0.0.1') {
    await context.log();
  }
});

interface ErrorMessage {
  message: string;
}
type CitiesSchema = HttpSchema<{
  '/cities': {
    GET: {
      request: {
        searchParams: { query: string };
      };
      response: {
        200: {
          body: Array<{
            id: string;
            name?: string;
            state?: {
              name: string;
              code: string;
            };
            country?: {
              name: string;
              code: string;
            };
          }>;
        };
        500: { body: ErrorMessage };
      };
    };
  };
}>;

type DistanceSchema = HttpSchema<{
  '/cities/:originCityId/distances/cities/:destinationCityId': {
    GET: {
      request: {
        searchParams: {
          originCityId: string;
          destinationCityId: string;
        };
      };
      response: {
        200: { body: LocationDistance };
        500: { body: ErrorMessage };
      };
    };
  };
}>;

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
describe('Before and after test', () => {
  let saoPaulo: LocationCity[];
  let recife: LocationCity[];
  let campinaGrande: LocationCity[];
  let cidadeInexistente: LocationCity[];

  beforeAll(async () => {
    await app.ready();
    await citySchemaInterceptor.start();
    await distanceSchemaInterceptor.start();

    saoPaulo = [
      {
        id: '10',
        name: 'São Paulo',
        state: {
          name: 'São Paulo',
          code: 'SP',
        },
        country: {
          name: 'Brasil',
          code: 'BRA',
        },
      },
    ];

    recife = [
      {
        id: '16',
        name: 'Recife',
        state: {
          name: 'Recife',
          code: 'PE',
        },
        country: {
          name: 'Brasil',
          code: 'BRA',
        },
      },
    ];

    campinaGrande = [
      {
        id: '30',
        name: 'Campina Grande',
        state: {
          name: 'Campina Grande',
          code: 'PB',
        },
        country: {
          name: 'Brasil',
          code: 'BRA',
        },
      },
    ];

    cidadeInexistente = [
      {
        id: '-20',
        name: 'XX',
        state: {
          name: 'XX',
          code: 'XX',
        },
        country: {
          name: 'XX',
          code: 'XX',
        },
      },
    ];
  });

  beforeEach(async () => {});

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

    const recifeCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Recife, PE' },
        exact: true,
      })
      .respond({ status: 200, body: recife });

    const distanceHandlerInterceptor = distanceSchemaInterceptor
      .get('/cities/10/distances/cities/16')
      .respond({
        status: 200,
        body: { kilometers: 1000000 },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    const requests1 = saoPauloCityInterceptor.requests();
    const requests2 = recifeCityInterceptor.requests();

    expect(requests1[0].searchParams.size).toBe(1);
    expect(requests1[0].searchParams.get('query')).toBe('São Paulo, SP');

    expect(requests2[0].searchParams.size).toBe(1);
    expect(requests2[0].searchParams.get('query')).toBe('Recife, PE');

    expect(response.body.distanceInKilometers).toBe(1000000);
    expect(response.body).toEqual({
      distanceInKilometers: 1000000,
      costInCents: 0,
    });
  });

  test('caso 2: Quando avaliamos se o custo para a mesma cidade é igual a 0', async () => {
    const recifeCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Recife, PE' },
        exact: true,
      })
      .respond({ status: 200, body: recife });

    const distanceHandlerInterceptor = distanceSchemaInterceptor
      .get('/cities/16/distances/cities/16')
      .respond({
        status: 200,
        body: { kilometers: 1000000 },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Recife, PE',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    const requests2 = recifeCityInterceptor.requests();
    const requests3 = distanceHandlerInterceptor.requests();

    expect(requests2[0].searchParams.size).toBe(1);
    expect(requests2[0].searchParams.get('query')).toBe('Recife, PE');

    expect(response.body.distanceInKilometers).toBe(1000000);
    expect(response.body).toEqual({
      distanceInKilometers: 1000000,
      costInCents: 0,
    });
  });

  test('caso 3: Quando buscamos por uma cidade inexistente (5XX)', async () => {
    const invalidCityCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Sao' },
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
        originCityName: 'Sao',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 10,
        volumeInLiters: 10,
      } satisfies CalculateShippingQuery);

    const responses = invalidCityCityInterceptor.requests();
    const responsesCG = campinaGrandeCityInterceptor.requests();
    expect(responses[0].searchParams.size).toBe(1);
    expect(responses[0].searchParams.get('query')).toBe('Sao');

    expect(responsesCG[0].searchParams.size).toBe(1);
    expect(responsesCG[0].searchParams.get('query')).toBe('Campina Grande, PB');

    expect(response.body.message).toBe('Internal server error');
    expect(response.status).toBe(500);
  });

  test('caso 4: Quando buscamos por uma cidade com ID inválido (5XX)', async () => {
    const invalidCityCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'XX, XX' },
        exact: true,
      })
      .respond({ status: 500, body: { message: 'Internal server error' } });

    const distanceHandlerInterceptor2 = distanceSchemaInterceptor
      .get('/cities/-20/distances/cities/-20')
      .respond({
        status: 500,
        body: { message: 'Internal server error' },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'XX, XX',
        destinationCityName: 'XX, XX',
        weightInKilograms: 10,
        volumeInLiters: 10,
      } satisfies CalculateShippingQuery);

    const responses = invalidCityCityInterceptor.requests();
    expect(responses[0].searchParams.size).toBe(1);
    expect(responses[0].searchParams.get('query')).toBe('XX, XX');

    const distanceInterceptor = distanceHandlerInterceptor2.requests();
    console.log(distanceInterceptor);
    expect(distanceInterceptor.length).toBe(0);

    expect(response.body.message).toBe('Internal server error');
    expect(response.status).toBe(500);
  });
});
