import supertest from 'supertest';
import request from 'supertest';
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

interface State {
  name: string;
  code: string;
}

interface Country {
  name: string;
  code: string;
}

interface City {
  id: string;
  name: string;
  state: State;
  country: Country;
}

interface Distance {
  kilometers: number;
}

interface RequestError {
  message: string;
}

type MySchema = HttpSchema<{
  '/cities': {
    GET: {
      request: {
        searchParams: { query: string };
      };
      response: {
        200: { body: City[] };
        400: { body: RequestError };
        500: { body: RequestError };
      };
    };
  };
  '/cities/:originCityId/distances/cities/:destinationCityId': {
    GET: {
      response: {
        200: { body: Distance };
        400: { body: RequestError };
        404: { body: RequestError };
        500: { body: RequestError };
      };
    };
  };
}>;

const myInterceptor = httpInterceptor.create<MySchema>({
  type: 'local',
  baseURL: 'https://v2-location-d8b1dd3.vercel.app',
  saveRequests: true,
});

describe('Shipping', () => {
  beforeAll(async () => {
    await app.ready();
    await myInterceptor.start();
  });

  beforeEach(async () => {
    const myHandler1 = myInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Origin City' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [
          {
            id: 'id1',
            name: 'Origin City',
            state: {
              name: 'state',
              code: 'ST',
            },
            country: {
              name: 'Brasil',
              code: 'BR',
            },
          },
        ],
      });

    const myHandler2 = myInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'Destination City' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [
          {
            id: 'id2',
            name: 'Destination City',
            state: {
              name: 'state',
              code: 'ST',
            },
            country: {
              name: 'Brasil',
              code: 'BR',
            },
          },
        ],
      });

    const myHandler3 = myInterceptor
      .get('/cities/id1/distances/cities/id2')
      .respond({ status: 200, body: { kilometers: 10.0 } });
  });

  afterEach(async () => {
    myInterceptor.clear();
  });

  afterAll(async () => {
    await app.close();
    await myInterceptor.stop();
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

  test('caso 1: testando calculo do frete quando as cidades estão no mesmo estado', async () => {
    const response = await request(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Origin City',
        destinationCityName: 'Destination City',
        weightInKilograms: 10,
        volumeInLiters: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      distanceInKilometers: 10.0,
      costInCents: 0,
    });
  });

  test('caso 2: Testando retorno da aplicação quando a API não encontra uma das cidades especificadas na entrada', async () => {
    const noExistentCityHandler = myInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'city' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [],
      });

    const response = await request(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'city',
        destinationCityName: 'Destination City',
        weightInKilograms: 10,
        volumeInLiters: 5,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Origin city not found',
    });
  });

  test('caso 3: Testando calculo de frete quando as cidades estão em estados diferentes', async () => {
    const myHandler5 = myInterceptor
      .get('/cities')
      .with({
        searchParams: { query: 'ccc' },
        exact: true,
      })
      .respond({
        status: 200,
        body: [
          {
            id: 'id4',
            name: 'ccc',
            state: {
              name: 'newState',
              code: 'NS',
            },
            country: {
              name: 'Brasil',
              code: 'BR',
            },
          },
        ],
      });

    const myHandler6 = myInterceptor
      .get('/cities/id1/distances/cities/id4')
      .respond({ status: 200, body: { kilometers: 200.0 } });

    const response = await request(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Origin City',
        destinationCityName: 'ccc',
        weightInKilograms: 15,
        volumeInLiters: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      distanceInKilometers: 200.0,
      costInCents: 3900,
    });
  });

  test('caso 4: Testando resposta da aplicação quando a cidade de origem e destino é a mesma ', async () => {
    const myHandler6 = myInterceptor
      .get('/cities/id1/distances/cities/id1')
      .respond({ status: 200, body: { kilometers: 0 } });

    const response = await request(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Origin City',
        destinationCityName: 'Origin City',
        weightInKilograms: 10,
        volumeInLiters: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      distanceInKilometers: 0,
      costInCents: 0,
    });
  });
});
