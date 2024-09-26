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

// 1. Declare your type
interface ErrorMessage {
  message: string;
}

// 2. Declare your HTTP schemas
// https://bit.ly/zimic-interceptor-http-schemas
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

type DistancesSchema = HttpSchema<{
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

// 3. Create your interceptors
// https://bit.ly/zimic-interceptor-http#httpinterceptorcreateoptions
const citySchemaInterceptor = httpInterceptor.create<CitiesSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL,
  saveRequests: true,
});

const distanceSchemaInterceptor = httpInterceptor.create<DistancesSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL,
  saveRequests: true,
});

// 4. Manage your interceptor lifecycle
// https://bit.ly/zimic-guides-testing
describe('Shipping', () => {
  let saoPaulo: LocationCity[];
  let rio: LocationCity[];
  let campinaGrande: LocationCity[];

  beforeAll(async () => {
    await app.ready();
    await citySchemaInterceptor.start();
    await distanceSchemaInterceptor.start();

    saoPaulo = [
      {
        id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDMwNjEy',
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

    rio = [
      {
        id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MjE2',
        name: 'Rio de Janeiro',
        state: {
          name: 'Rio de Janeiro',
          code: 'RJ',
        },
        country: {
          name: 'Brasil',
          code: 'BRA',
        },
      },
    ];

    campinaGrande = [
      {
        id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDMwNjEy',
        name: 'Campina Grande',
        state: {
          name: 'Paraíba',
          code: 'PB',
        },
        country: {
          name: 'Brasil',
          code: 'BRA',
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

  test('caso 1: Shipping coast entre duas cidades existentes (200)', async () => {
    const saoPauloCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'São Paulo' },
        exact: true,
      })
      .respond({ status: 200, body: saoPaulo });

    const rioCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Rio de Janeiro' },
        exact: true,
      })
      .respond({ status: 200, body: rio });

    const distanceHandlerInterceptor = distanceSchemaInterceptor
      .get(
        '/cities/aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDMwNjEy/distances/cities/aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MjE2'
      )
      .respond({
        status: 200,
        body: { kilometers: 1910.503168680847 },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Rio de Janeiro, RJ',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    const requests1 = saoPauloCityInterceptor.requests();
    const requests2 = rioCityInterceptor.requests();

    expect(requests1[0].searchParams.size).toBe(1);
    expect(requests1[0].searchParams.get('query')).toBe('São Paulo');

    expect(requests2[0].searchParams.size).toBe(1);
    expect(requests2[0].searchParams.get('query')).toBe('Rio de Janeiro');

    expect(response.body.distanceInKilometers).toBe(1910.503168680847);
    expect(response.body).toEqual({
      distanceInKilometers: 1910.503168680847,
      costInCents: 0,
    });
  });

  test('caso 2: Quando buscamos os shipping coast com destino a uma cidade inexistente (5XX)', async () => {
    const campinaGrandeCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Campina Grande' },
        exact: true,
      })
      .respond({ status: 200, body: campinaGrande });

    const invalidCityCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'XX' },
        exact: true,
      })
      .respond({ status: 500, body: { message: 'Internal server error' } });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande',
        destinationCityName: 'XX',
        weightInKilograms: 10,
        volumeInLiters: 10,
      } satisfies CalculateShippingQuery);

    const responses = invalidCityCityInterceptor.requests();
    const responsesCG = campinaGrandeCityInterceptor.requests();
    expect(responsesCG[0].searchParams.size).toBe(1);
    expect(responsesCG[0].searchParams.get('query')).toBe('Campina Grande');

    expect(responses[0].searchParams.size).toBe(1);
    expect(response.body.message).toBe('Internal server error');

    expect(response.status).toBe(500);
  });

  test('caso 3: Quando buscamos os shipping coast saindo de uma cidade inexistente (5XX)', async () => {
    const invalidCityCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'XX' },
        exact: true,
      })
      .respond({ status: 500, body: { message: 'Internal server error' } });

    const campinaGrandeCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Campina Grande' },
        exact: true,
      })
      .respond({ status: 200, body: campinaGrande });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'XX',
        destinationCityName: 'Campina Grande',
        weightInKilograms: 10,
        volumeInLiters: 10,
      } satisfies CalculateShippingQuery);

    const responses = invalidCityCityInterceptor.requests();
    const responsesCG = campinaGrandeCityInterceptor.requests();
    expect(responses[0].searchParams.size).toBe(1);
    expect(responses[0].searchParams.get('query')).toBe('XX');

    expect(responsesCG[0].searchParams.size).toBe(1);
    expect(responsesCG[0].searchParams.get('query')).toBe('Campina Grande');

    expect(response.body.message).toBe('Internal server error');
    expect(response.status).toBe(500);
  });

  test('caso 4: Quando buscamos os shipping coast saindo de uma cidade inexistente com destino a uma cidade inexistente(5XX)', async () => {
    const invalidCityCityInterceptor = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'XX' },
        exact: true,
      })
      .respond({ status: 500, body: { message: 'Internal server error' } });

    const invalidCityCityInterceptor2 = citySchemaInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'YY' },
        exact: true,
      })
      .respond({ status: 500, body: { message: 'Internal server error' } });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'XX',
        destinationCityName: 'YY',
        weightInKilograms: 10,
        volumeInLiters: 10,
      } satisfies CalculateShippingQuery);

    const responses = invalidCityCityInterceptor.requests();
    const responses2 = invalidCityCityInterceptor2.requests();
    expect(responses[0].searchParams.size).toBe(1);
    expect(responses[0].searchParams.get('query')).toBe('XX');

    expect(responses2[0].searchParams.size).toBe(1);
    expect(responses2[0].searchParams.get('query')).toBe('YY');

    expect(response.body.message).toBe('Internal server error');
    expect(response.status).toBe(500);
  });
});
