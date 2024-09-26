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
import { httpInterceptor } from 'zimic/interceptor/http';
import { HttpSchema } from 'zimic/http';

import app, { CalculateShippingQuery } from '../src/server/app';
import { LocationCity, LocationDistance } from '../src/clients/LocationClient';

httpInterceptor.default.onUnhandledRequest(async (request, context) => {
  const url = new URL(request.url);

  if (url.hostname !== '127.0.0.1') {
    await context.log();
  }
});

const LOCATION_API_URL = process.env.LOCATION_API_URL;

interface ServerError {
  message: string;
}

type LocationSchema = HttpSchema<{
  '/cities': {
    GET: {
      request: {
        searchParams: {
          query: string;
        };
      };
      response: {
        200: { body: LocationCity[] };
        500: { body: ServerError };
      };
    };
  };
}>;

type DistanceSchema = HttpSchema<{
  '/cities/distances': {
    GET: {
      request: {
        searchParams: {
          originCityId: string;
          destinationCityId: string;
        };
      };
      response: {
        200: { body: LocationDistance };
        500: { body: ServerError };
      };
    };
  };
}>;

const interceptorI = httpInterceptor.create<LocationSchema>({
  type: 'local',
  baseURL: LOCATION_API_URL,
  saveRequests: true,
});

const interceptorII = httpInterceptor.create<DistanceSchema>({
  type: 'local',
  baseURL: LOCATION_API_URL,
  saveRequests: true,
});

describe('Shipping', () => {
  beforeAll(async () => {
    await interceptorI.start();
    await interceptorII.start();

    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    interceptorI.clear();
    interceptorII.clear();
  });

  afterAll(async () => {
    await app.close();

    await interceptorI.stop();
    await interceptorII.stop();
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

  test('caso 1: sucesso (2XX) - estados diferentes', async () => {
    const citiesIHandler = interceptorI
      .get('/cities')
      .with({
        searchParams: {
          query: 'São Paulo, SP',
        },
      })
      .respond({
        status: 200,
        body: [
          {
            id: '1',
            name: 'São Paulo',
            stateName: 'São Paulo',
            stateCode: 'SP',
            countryName: 'Brasil',
            countryCode: 'BR',
          },
        ],
      });

    const citiesIIHandler = interceptorI
      .get('/cities')
      .with({
        searchParams: {
          query: 'Recife, PE',
        },
      })
      .respond({
        status: 200,
        body: [
          {
            id: '2',
            name: 'Recife, PE',
            stateName: 'Pernambuco',
            stateCode: 'PE',
            countryName: 'Brasil',
            countryCode: 'BR',
          },
        ],
      });

    const distanceHandler = interceptorII
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: '1',
          destinationCityId: '2',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: { kilometers: 2133.137403632718 },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 5.3,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body.costInCents).toBe(5337);

    const requestsI = citiesIHandler.requests();
    expect(requestsI).toHaveLength(1);
    const requestsII = citiesIIHandler.requests();
    expect(requestsII).toHaveLength(1);
    const requestsIII = distanceHandler.requests();
    expect(requestsIII).toHaveLength(1);
  });

  test('caso 2: sucesso (2XX) - estados iguais', async () => {
    const citiesIHandler = interceptorI
      .get('/cities')
      .with({
        searchParams: {
          query: 'Queimadas, PB',
        },
      })
      .respond({
        status: 200,
        body: [
          {
            id: '5',
            name: 'Queimadas',
            stateName: 'Paraiba',
            stateCode: 'PB',
            countryName: 'Brasil',
            countryCode: 'BR',
          },
        ],
      });

    const citiesIIHandler = interceptorI
      .get('/cities')
      .with({
        searchParams: {
          query: 'Campina Grande, PB',
        },
      })
      .respond({
        status: 200,
        body: [
          {
            id: '6',
            name: 'Campina Grande, PB',
            stateName: 'Paraiba',
            stateCode: 'PB',
            countryName: 'Brasil',
            countryCode: 'BR',
          },
        ],
      });

    const distanceHandler = interceptorII
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: '5',
          destinationCityId: '6',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: { kilometers: 15.403591275335282 },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Queimadas, PB',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 5.3,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body.costInCents).toBe(0);

    const requestsI = citiesIHandler.requests();
    expect(requestsI).toHaveLength(1);
    const requestsII = citiesIIHandler.requests();
    expect(requestsII).toHaveLength(1);
    const requestsIII = distanceHandler.requests();
    expect(requestsIII).toHaveLength(1);
  });

  test('caso 3: erro (5XX) - Erro inesperado em /cities/distances', async () => {
    const citiesIHandler = interceptorI
      .get('/cities')
      .with({
        searchParams: {
          query: 'Campina Grande, PB',
        },
      })
      .respond({
        status: 200,
        body: [
          {
            id: '6',
            name: 'Campina Grande, PB',
            stateName: 'Paraiba',
            stateCode: 'PB',
            countryName: 'Brasil',
            countryCode: 'BR',
          },
        ],
      });

    const distanceHandler = interceptorII
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: '6',
          destinationCityId: '6',
        },
        exact: true,
      })
      .respond({
        status: 500,
        body: { message: 'Erro inesperado' },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 5.3,
        volumeInLiters: 10,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });

  test('caso 4: erro (5XX) - Erro inesperado em /cities', async () => {
    const citiesIHandler = interceptorI
      .get('/cities')
      .with({
        searchParams: {
          query: 'Campina Grande, PB',
        },
      })
      .respond({
        status: 500,
        body: { message: 'Erro inesperado' },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 5.3,
        volumeInLiters: 10,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});
