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
import { LocationDistance } from '../src/clients/LocationClient';

// 1. Declare your types
interface User {
  username: string;
}

interface RequestError {
  code: string;
  message: string;
}

// 2. Declare your HTTP schema
// https://bit.ly/zimic-interceptor-http-schemas
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
      };
    };
  };
}>;

const DistanceInterceptor = httpInterceptor.create<DistanceSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL,
  saveRequests: true, // Allow access to `handler.requests()`
});

describe('Shipping', () => {
  beforeAll(async () => {
    await app.ready();
    await DistanceInterceptor.start();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    DistanceInterceptor.clear();
  });

  afterAll(async () => {
    await app.close();
    await DistanceInterceptor.stop();
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
    //console.log(response);
  });

  test('caso 1: <descrição>', async () => {
    const mockDistance = DistanceInterceptor.get('/cities/distances')
      .with({
        searchParams: {
          originCityId: '123',
          destinationCityId: '456',
        },
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
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body.distanceInKilometers).toBe(2133.137403632718);
    expect(response.body.costInCents).toBeDefined();
    expect(mockDistance.requests()).toHaveLength(1);
  });

  test('caso 2: <descrição>', async () => {
    // Implemente aqui...
  });

  test('caso 3: <descrição>', async () => {
    // Implemente aqui...
  });

  test('caso 4: <descrição>', async () => {
    // Implemente aqui...
  });
});
