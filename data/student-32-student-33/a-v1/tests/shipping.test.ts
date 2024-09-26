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

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const intSer = setupServer(
  http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
    const query = new URL(request.url).searchParams.get('query');

    if (query === 'São Paulo, SP') {
      return HttpResponse.json([
        {
          id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
          name: 'São Paulo',
          stateName: 'São Paulo',
          stateCode: 'SP',
          countryName: 'Brasil',
          countryCode: 'BRA',
        },
      ]);
    }

    if (query === 'Recife, PE') {
      return HttpResponse.json([
        {
          id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3',
          name: 'Recife',
          stateName: 'Pernambuco',
          stateCode: 'PE',
          countryName: 'Brasil',
          countryCode: 'BRA',
        },
      ]);
    }

    return HttpResponse.json([]);
  }),
  http.get(`${process.env.LOCATION_API_URL}/cities/distances`, () => {
    return HttpResponse.json({
      kilometers: 2133.137403632718,
    });
  })
);

describe('Shipping', () => {
  beforeAll(async () => {
    intSer.listen({
      onUnhandledRequest(request, print) {
        const url = new URL(request.url);
        url.hostname !== '127.0.0.1' && print.warning();
      },
    });
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    intSer.resetHandlers();
  });

  afterAll(async () => {
    await app.close();
    intSer.close();
  });

  test('caso 1: Sucesso no cálculo :D', async () => {
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
    expect(response.body.costInCents).toBe(6277);
  });

  test('caso 2: Cidade origem inválida', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Uma cidade legal, XD',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Origin city not found');
  });

  test('caso 3: Cidade destino inválida', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Uma cidade paia, 8D',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Destination city not found');
  });

  test('caso 4: Aplicação fora do ar :(', async () => {
    intSer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        return new HttpResponse(null, { status: 503 });
      })
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(500);
  });
});
