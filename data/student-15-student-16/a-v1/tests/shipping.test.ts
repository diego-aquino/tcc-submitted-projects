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

import app from '../src/server/app';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  LocationCity,
  LocationDistance,
  Res,
} from '../src/clients/LocationClient';

const interceptorServer = setupServer(
  http.get(`${process.env.LOCATION_API_URL}/cities`, () => {
    return HttpResponse.json<LocationCity>({
      id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDMwNjEy',
      name: 'São Paulo',
      stateName: 'São Paulo',
      stateCode: 'SP',
      countryName: 'Brasil',
      countryCode: 'BRA',
    });
  }),
  http.get(`${process.env.LOCATION_API_URL}/cities/distances`, () => {
    return HttpResponse.json<LocationDistance>({
      kilometers: 137.77557092507496,
    });
  })
);

describe('Shipping', () => {
  beforeAll(async () => {
    interceptorServer.listen({
      onUnhandledRequest(request, print) {
        const url = new URL(request.url);

        if (url.hostname !== '127.0.0.1') {
          print.warning();
        }
      },
    });

    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    interceptorServer.resetHandlers();
  });

  afterAll(async () => {
    await app.close();
    interceptorServer.close();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      });

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 1: frete gratis', async () => {
    const citiesRequests: Request[] = [];
    const distanceRequests: Request[] = [];

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        citiesRequests.push(request);
        var city;

        if (citiesRequests.length == 1) {
          city = HttpResponse.json<LocationCity[]>([
            {
              id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDMwNjEy',
              name: 'São Paulo',
              stateName: 'São Paulo',
              stateCode: 'SP',
              countryName: 'Brasil',
              countryCode: 'BRA',
            },
          ]);
        } else {
          city = HttpResponse.json<LocationCity[]>([
            {
              id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMzM3Nzgy',
              name: 'Piracicaba',
              stateName: 'São Paulo',
              stateCode: 'SP',
              countryName: 'Brasil',
              countryCode: 'BRA',
            },
          ]);
        }

        return city;
      })
    );

    interceptorServer.use(
      http.get(
        `${process.env.LOCATION_API_URL}/cities/distances`,
        ({ request }) => {
          distanceRequests.push(request);

          const res = HttpResponse.json<LocationDistance>({
            kilometers: 137.77557092507496,
          });
          return res;
        }
      )
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Piracicaba, SP',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      });

    expect(response.body).toEqual({
      distanceInKilometers: 137.77557092507496,
      costInCents: 0,
    });

    expect(citiesRequests).toHaveLength(2);
    expect(distanceRequests).toHaveLength(1);

    expect(response.status).toBe(200);
    expect(response.body.costInCents).toBe(0);
    expect(response.body.distanceInKilometers).toBe(137.77557092507496);

    console.log(response.body);
  });

  test('caso 2: erro 4XX', async () => {
    const citiesRequests: Request[] = [];
    const distanceRequests: Request[] = [];

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Campina Grande, PB',
        weightInKilograms: 0,
        volumeInLiters: 0.1,
      });

    expect(response.body).toEqual({
      message: 'Validation error',
      issues: [
        {
          code: 'too_small',
          minimum: 0,
          type: 'number',
          inclusive: false,
          exact: false,
          message: 'Number must be greater than 0',
          path: ['weightInKilograms'],
        },
      ],
    });

    expect(citiesRequests).toHaveLength(0);
    expect(distanceRequests).toHaveLength(0);

    expect(response.status).toBe(400);
    console.log(response.body);
  });

  test('caso 3: frete calculado', async () => {
    const citiesRequests: Request[] = [];
    const distanceRequests: Request[] = [];

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        citiesRequests.push(request);
        var city;

        if (citiesRequests.length == 1) {
          city = HttpResponse.json<LocationCity[]>([
            {
              id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDMwNjEy',
              name: 'Campina Grande',
              stateName: 'Paraíba',
              stateCode: 'PB',
              countryName: 'Brasil',
              countryCode: 'BRA',
            },
          ]);
        } else {
          city = HttpResponse.json<LocationCity[]>([
            {
              id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMzM3Nzgy',
              name: 'Piracicaba',
              stateName: 'São Paulo',
              stateCode: 'SP',
              countryName: 'Brasil',
              countryCode: 'BRA',
            },
          ]);
        }

        return city;
      })
    );

    interceptorServer.use(
      http.get(
        `${process.env.LOCATION_API_URL}/cities/distances`,
        ({ request }) => {
          distanceRequests.push(request);

          const res = HttpResponse.json<LocationDistance>({
            kilometers: 2133.9439331917633,
          });
          return res;
        }
      )
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: 'Piracicaba, SP',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      });

    expect(response.body).toEqual({
      distanceInKilometers: 2133.9439331917633,
      costInCents: 6278,
    });

    expect(citiesRequests).toHaveLength(2);
    expect(distanceRequests).toHaveLength(1);

    expect(response.status).toBe(200);
    expect(response.body.costInCents).toBe(6278);
    expect(response.body.distanceInKilometers).toBe(2133.9439331917633);

    console.log(response.body);
  });

  test('caso 4: erro 5XX', async () => {
    const citiesRequests: Request[] = [];
    const distanceRequests: Request[] = [];

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        citiesRequests.push(request);
        var city;

        if (citiesRequests.length == 1) {
          city = HttpResponse.json<LocationCity[]>([
            {
              id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDMwNjEy',
              name: 'Campina Grande',
              stateName: 'Paraíba',
              stateCode: 'PB',
              countryName: 'Brasil',
              countryCode: 'BRA',
            },
          ]);
        } else {
          city = [];
        }

        return city;
      })
    );

    interceptorServer.use(
      http.get(
        `${process.env.LOCATION_API_URL}/cities/distances`,
        ({ request }) => {
          distanceRequests.push(request);

          const res = HttpResponse.json<LocationDistance>({
            kilometers: 137.77557092507496,
          });
          return res;
        }
      )
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Campina Grande, PB',
        destinationCityName: ' ',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      });

    expect(response.body).toEqual({
      message: 'Internal server error',
    });

    expect(citiesRequests).toHaveLength(2);
    expect(distanceRequests).toHaveLength(0);
    expect(response.status).toBe(500);

    console.log(response.body);
  });
});
