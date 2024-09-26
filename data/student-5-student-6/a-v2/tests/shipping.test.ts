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
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { LocationCity, LocationDistance } from '../src/clients/LocationClient';

type ValidationError = {
  message: string;
  issues: Array<{
    message: string;
    code: string;
    path: Array<string | number>;
    additionalProp1: Record<string, unknown>;
  }>;
};

type InternalServerError = {
  message: 'Internal server error';
};

const interceptorServer = setupServer(
  http.get(`${process.env.LOCATION_API_URL}/cities`, () => {
    return HttpResponse.json([]);
  }),
  http.get(
    `${process.env.LOCATION_API_URL}/cities/:originCityId/distances/cities/:destinationCityId`,
    () => {
      return HttpResponse.json([]);
    }
  )
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
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);
    expect(response.status).toBe(200);
  });

  test('caso 1: sucesso (200)', async () => {
    const cidadeSP: LocationCity[] = [
      {
        id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
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
    const cidadeRec: LocationCity[] = [
      {
        id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3',
        name: 'Recife',
        state: {
          name: 'Pernambuco',
          code: 'PE',
        },
        country: {
          name: 'Brasil',
          code: 'BRA',
        },
      },
    ];

    const distanceResponse: LocationDistance = {
      kilometers: 2133.137403632718,
    };

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (query === 'São Paulo, SP') {
          return HttpResponse.json<LocationCity[]>(cidadeSP, { status: 200 });
        } else if (query === 'Recife, PE') {
          return HttpResponse.json<LocationCity[]>(cidadeRec, { status: 200 });
        } else {
          return HttpResponse.json<LocationCity[]>([], { status: 200 });
        }
      })
    );

    interceptorServer.use(
      http.get(
        `${process.env.LOCATION_API_URL}/cities/:originCityId/distances/cities/:destinationCityId`,
        () => {
          return HttpResponse.json<LocationDistance>(distanceResponse, {
            status: 200,
          });
        }
      )
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      costInCents: 0,
      distanceInKilometers: 2133.137403632718,
    });
  });

  test('caso 2: error validation (500)', async () => {
    const erro: ValidationError = {
      message: 'Validation error',
      issues: [
        {
          message: 'Invalid input: expected string, received number',
          code: 'invalid_type',
          path: ['names', 1],
          additionalProp1: {},
        },
      ],
    };

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        return HttpResponse.json<ValidationError>(erro, { status: 400 });
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
    expect(response.body).toEqual({
      message: 'Internal server error',
    });
  });

  test('caso 3: origin City Not Found (400)', async () => {
    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        return HttpResponse.json<LocationCity[]>([], { status: 200 });
      })
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Joab Cesar',
        destinationCityName: '!',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Origin city not found',
    });
  });

  test('caso 4: Internal Server Error distance (500)', async () => {
    const cidadeSP: LocationCity[] = [
      {
        id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
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

    const cidadeRec: LocationCity[] = [
      {
        id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3',
        name: 'Recife',
        state: {
          name: 'Pernambuco',
          code: 'PE',
        },
        country: {
          name: 'Brasil',
          code: 'BRA',
        },
      },
    ];

    const distanceResponse: InternalServerError = {
      message: 'Internal server error',
    };

    interceptorServer.use(
      http.get(`${process.env.LOCATION_API_URL}/cities`, ({ request }) => {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (query === 'São Paulo, SP') {
          return HttpResponse.json<LocationCity[]>(cidadeSP, { status: 200 });
        } else if (query === 'Recife, PE') {
          return HttpResponse.json<LocationCity[]>(cidadeRec, { status: 200 });
        } else {
          return HttpResponse.json<LocationCity[]>([], { status: 200 });
        }
      })
    );

    interceptorServer.use(
      http.get(
        `${process.env.LOCATION_API_URL}/cities/:originCityId/distances/cities/:destinationCityId`,
        ({ request }) => {
          return HttpResponse.json<InternalServerError>(distanceResponse, {
            status: 500,
          });
        }
      )
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
    expect(response.body).toEqual({
      message: 'Internal server error',
    });
  });
});
