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

  test('caso 1: caso de sucesso com duas cidades no mesmo estado (frete deve ser gratuito)', async () => {
    const citiesRequests: Request[] = [];
    const distanceRequests: Request[] = [];

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        //console.log(request);
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

    //console.log('passei');

    interceptorServer.use(
      http.get(
        `${process.env.LOCATION_API_URL}/cities/distances`,
        ({ request }) => {
          //console.log(request);
          distanceRequests.push(request);

          const res = HttpResponse.json<LocationDistance>({
            kilometers: 137.77557092507496,
          });
          return res;
        }
      )
    );

    //console.log(distanceRequests);

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

    //console.log(citiesRequests);
    expect(citiesRequests).toHaveLength(2); //procurou 2 cidades
    expect(distanceRequests).toHaveLength(1); //calculou uma única distância

    expect(response.status).toBe(200);
    expect(response.body.costInCents).toBe(0);
    expect(response.body.distanceInKilometers).toBe(137.77557092507496);

    console.log(response.body);
  });

  test('caso 2: caso de sucesso com duas cidades em estados diferentes (frete deve ser calculado)', async () => {
    const citiesRequests: Request[] = [];
    const distanceRequests: Request[] = [];

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        //console.log(request);
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

    //console.log('passei');

    interceptorServer.use(
      http.get(
        `${process.env.LOCATION_API_URL}/cities/distances`,
        ({ request }) => {
          //console.log(request);
          distanceRequests.push(request);

          const res = HttpResponse.json<LocationDistance>({
            kilometers: 2133.9439331917633,
          });
          return res;
        }
      )
    );

    //console.log(distanceRequests);

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

    //console.log(citiesRequests);
    expect(citiesRequests).toHaveLength(2); //procurou 2 cidades
    expect(distanceRequests).toHaveLength(1); //calculou uma única distância

    expect(response.status).toBe(200);
    expect(response.body.costInCents).toBe(6278);
    expect(response.body.distanceInKilometers).toBe(2133.9439331917633);

    console.log(response.body);
  });

  test('caso 3: caso de erro 4XX', async () => {
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

    expect(citiesRequests).toHaveLength(0); //quebrou antes de pesquisar as cidades
    expect(distanceRequests).toHaveLength(0); //quebrou antes de calcular as distâncias

    expect(response.status).toBe(400);
    console.log(response.body);
  });

  test('caso 4: caso de erro 5XX', async () => {
    const citiesRequests: Request[] = [];
    const distanceRequests: Request[] = [];

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        //console.log(request);
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

    //console.log(distanceRequests);

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

    expect(citiesRequests).toHaveLength(2); //procurou 2 cidades e quebrou após a segunda
    expect(distanceRequests).toHaveLength(0); //quebrou antes de calcular a distância

    expect(response.status).toBe(500);

    console.log(response.body);
  });
});
