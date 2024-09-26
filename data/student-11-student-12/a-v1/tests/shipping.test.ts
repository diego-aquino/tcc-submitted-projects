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

type ShippingSchema = HttpSchema<{
  '/cities': {
    GET: {
      request: {
        searchParams: {
          query: string;
        };
      };
      response: {
        200: { body: LocationCity[] };
        500: { body: { message: string } };
      };
    };
  };
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
        500: { body: { message: string } };
      };
    };
  };
}>;

const interceptor = httpInterceptor.create<ShippingSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL,
  saveRequests: true,
});

const originCity: LocationCity = {
  id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
  name: 'São Paulo',
  stateName: 'São Paulo',
  stateCode: 'SP',
  countryName: 'Brasil',
  countryCode: 'BRA',
};

const destinationCity: LocationCity = {
  id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3',
  name: 'Recife',
  stateName: 'Pernambuco',
  stateCode: 'PE',
  countryName: 'Brasil',
  countryCode: 'BRA',
};

describe('Shipping', () => {
  beforeAll(async () => {
    await interceptor.start();

    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    interceptor.clear();
  });

  afterAll(async () => {
    await interceptor.stop();

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

  test('caso 1: cidades válidas', async () => {
    const originHandler = interceptor
      .get('/cities')
      .with({
        searchParams: { query: 'São Paulo, SP' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [originCity],
      });
    const destinationHandler = interceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Recife, PE' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [destinationCity],
      });
    const distanceHandler = interceptor
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: originCity.id,
          destinationCityId: destinationCity.id,
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: {
          kilometers: 2133.137403632718,
        },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);

    expect(response.body.distanceInKilometers).toBe(2133.137403632718);

    const originRequests = originHandler.requests();
    const destinationRequests = destinationHandler.requests();
    const distanceRequests = distanceHandler.requests();

    expect(originRequests).toHaveLength(1);
    expect(destinationRequests).toHaveLength(1);
    expect(distanceRequests).toHaveLength(1);
  });

  test('caso 2: cidade de origem não existe', async () => {
    const originHandler = interceptor
      .get('/cities')
      .with({
        searchParams: { query: 'São Paulo, SP' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [],
      });
    const destinationHandler = interceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Recife, PE' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [destinationCity],
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ message: 'Origin city not found' });

    const originRequests = originHandler.requests();
    const destinationRequests = destinationHandler.requests();

    expect(originRequests).toHaveLength(1);
    expect(destinationRequests).toHaveLength(1);
  });

  test('caso 3: cidade de destino não existe', async () => {
    const originHandler = interceptor
      .get('/cities')
      .with({
        searchParams: { query: 'São Paulo, SP' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [originCity],
      });
    const destinationHandler = interceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Recife, PE' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [],
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      message: 'Destination city not found',
    });

    const originRequests = originHandler.requests();
    const destinationRequests = destinationHandler.requests();

    expect(originRequests).toHaveLength(1);
    expect(destinationRequests).toHaveLength(1);
  });

  test('caso 4: api de localização com erro inesperado', async () => {
    const originHandler = interceptor
      .get('/cities')
      .with({
        searchParams: { query: 'São Paulo, SP' },
        exact: true,
      })
      .respond({
        status: 500,
        body: { message: 'Internal server error' },
      });
    const destinationHandler = interceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Recife, PE' },
        exact: true,
      })
      .respond({
        status: 500,
        body: { message: 'Internal server error' },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(500);
    expect(response.body).toStrictEqual({ message: 'Internal server error' });

    const originRequests = originHandler.requests();
    const destinationRequests = destinationHandler.requests();

    expect(originRequests).toHaveLength(1);
    expect(destinationRequests).toHaveLength(1);
  });
});
