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
import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';

import app, { CalculateShippingQuery } from '../src/server/app';
import { LocationCity, LocationDistance } from '../src/clients/LocationClient';

const LOCATION_API_URL = process.env.LOCATION_API_URL;

type LocationApiSchema = HttpSchema<{
  '/cities': {
    GET: {
      request: {
        searchParams: {
          query: string;
        };
      };
      response: {
        200: { body: LocationCity[] };
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
      };
    };
  };
}>;

const interceptor = httpInterceptor.create<LocationApiSchema>({
  type: 'local',
  baseURL: LOCATION_API_URL,
  saveRequests: true,
});

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
    await app.close();
    await interceptor.stop();
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

  test('caso 1: sucesso (200) com cidades de estados diferentes', async () => {
    const locationsTestData: LocationCity[] = [
      {
        id: '1',
        name: 'Campina Grande',
        stateName: 'Paraíba',
        stateCode: 'PB',
        countryName: 'Brasil',
        countryCode: 'BR',
      },
      {
        id: '2',
        name: 'Recife',
        stateName: 'Pernambuco',
        stateCode: 'PE',
        countryName: 'Brasil',
        countryCode: 'BR',
      },
    ];

    const searchCityHandler = interceptor
      .get('/cities')
      .with({
        searchParams: {
          query: 'Campina Grande',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: [locationsTestData[0]],
      });

    const searchCityHandler2 = interceptor
      .get('/cities')
      .with({
        searchParams: {
          query: 'Recife',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: [locationsTestData[1]],
      });

    const calculateDistanceHandler = interceptor
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
        body: {
          kilometers: 300,
        },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande',
        destinationCityName: 'Recife',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body.distanceInKilometers).toBe(300);
    expect(response.body.costInCents).toBeGreaterThan(0);

    expect(searchCityHandler.requests()).toHaveLength(1);
    expect(searchCityHandler2.requests()).toHaveLength(1);
    expect(calculateDistanceHandler.requests()).toHaveLength(1);
  });

  test('caso 2: sucesso (200) com cidades do mesmo estado', async () => {
    const locationsTestData: LocationCity[] = [
      {
        id: '1',
        name: 'Campina Grande',
        stateName: 'Paraíba',
        stateCode: 'PB',
        countryName: 'Brasil',
        countryCode: 'BR',
      },
      {
        id: '2',
        name: 'João Pessoa',
        stateName: 'Paraíba',
        stateCode: 'PB',
        countryName: 'Brasil',
        countryCode: 'BR',
      },
    ];

    const searchCityHandler = interceptor
      .get('/cities')
      .with({
        searchParams: {
          query: 'Campina Grande',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: [locationsTestData[0]],
      });

    const searchCityHandler2 = interceptor
      .get('/cities')
      .with({
        searchParams: {
          query: 'João Pessoa',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: [locationsTestData[1]],
      });

    const calculateDistanceHandler = interceptor
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
        body: {
          kilometers: 130,
        },
      });

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande',
        destinationCityName: 'João Pessoa',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body.distanceInKilometers).toBe(130);
    expect(response.body.costInCents).toBe(0);

    expect(searchCityHandler.requests()).toHaveLength(1);
    expect(searchCityHandler2.requests()).toHaveLength(1);
    expect(calculateDistanceHandler.requests()).toHaveLength(1);
  });

  test('caso 3: erro (400) com cidade de origem invalida', async () => {
    const locationsTestData: LocationCity[] = [
      {
        id: '1',
        name: 'Campina Grande',
        stateName: 'Paraíba',
        stateCode: 'PB',
        countryName: 'Brasil',
        countryCode: 'BR',
      },
    ];

    const searchCityHandler = interceptor
      .get('/cities')
      .with({
        searchParams: {
          query: 'xxxx',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: [],
      });

    const searchCityHandler2 = interceptor
      .get('/cities')
      .with({
        searchParams: {
          query: 'Campina Grande',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: locationsTestData,
      });

    const calculateDistanceHandler = interceptor.get('/cities/distances');

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'xxxx',
        destinationCityName: 'Campina Grande',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Origin city not found');

    expect(searchCityHandler.requests()).toHaveLength(1);
    expect(searchCityHandler2.requests()).toHaveLength(1);
    expect(calculateDistanceHandler.requests()).toHaveLength(0);
  });

  test('caso 4: erro (400) com cidade de destino invalida', async () => {
    const locationsTestData: LocationCity[] = [
      {
        id: '1',
        name: 'Campina Grande',
        stateName: 'Paraíba',
        stateCode: 'PB',
        countryName: 'Brasil',
        countryCode: 'BR',
      },
    ];

    const searchCityHandler = interceptor
      .get('/cities')
      .with({
        searchParams: {
          query: 'Campina Grande',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: locationsTestData,
      });

    const searchCityHandler2 = interceptor
      .get('/cities')
      .with({
        searchParams: {
          query: 'yyyy',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: [],
      });

    const calculateDistanceHandler = interceptor.get('/cities/distances');

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande',
        destinationCityName: 'yyyy',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Destination city not found');

    expect(searchCityHandler.requests()).toHaveLength(1);
    expect(searchCityHandler2.requests()).toHaveLength(1);
    expect(calculateDistanceHandler.requests()).toHaveLength(0);
  });
});
