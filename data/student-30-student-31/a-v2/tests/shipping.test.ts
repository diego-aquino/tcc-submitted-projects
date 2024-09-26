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

type SearchCitiesSchema = HttpSchema<{
  '/cities': {
    GET: {
      request: {
        searchParams: {
          query: string;
        };
      };
      response: {
        200: { body: LocationCity[] };
        400: {
          body: {
            message: string;
            issues: {
              message: string;
              code: string;
              path: string[];
              additionalProp1?: any;
            }[];
          };
        };
      };
    };
  };
}>;

type calculateDistanceBetweenCitiesSchema = HttpSchema<{
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

const SearchCitiesInterceptor = httpInterceptor.create<SearchCitiesSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL,
  saveRequests: true,
});

const calculateDistanceBetweenCitiesInterceptor =
  httpInterceptor.create<calculateDistanceBetweenCitiesSchema>({
    type: 'local',
    baseURL: process.env.LOCATION_API_URL,
    saveRequests: true,
  });

describe('Shipping', () => {
  beforeAll(async () => {
    await SearchCitiesInterceptor.start();
    await calculateDistanceBetweenCitiesInterceptor.start();
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    SearchCitiesInterceptor.clear();
    calculateDistanceBetweenCitiesInterceptor.clear();
  });

  afterAll(async () => {
    await SearchCitiesInterceptor.stop();
    await calculateDistanceBetweenCitiesInterceptor.stop();
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
  });

  test('caso 1: <descrição>', async () => {
    const SearchCitiesResult1: LocationCity[] = [
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
    const SearchCitiesResult2: LocationCity[] = [
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
    const calculateDistanceBetweenCitiesResult: LocationDistance = {
      kilometers: 2133.137403632718,
    };

    const SearchCitiesHandler1 = SearchCitiesInterceptor.get('/cities')
      .with({
        searchParams: { query: 'São Paulo, SP' },
        exact: true,
      })
      .respond({
        status: 200,
        body: SearchCitiesResult1,
      });

    const SearchCitiesHandler2 = SearchCitiesInterceptor.get('/cities')
      .with({
        searchParams: { query: 'Recife, PE' },
        exact: true,
      })
      .respond({
        status: 200,
        body: SearchCitiesResult2,
      });

    const calculateDistanceHandler = calculateDistanceBetweenCitiesInterceptor
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2', // São Paulo ID
          destinationCityId: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3', // Recife ID
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: calculateDistanceBetweenCitiesResult,
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
    expect(response.body.distanceInKilometers).toBeCloseTo(2133.137403632718);
  });

  test('caso 2: erro de validação com entrada inválida', async () => {
    const errorResult = {
      message: 'Validation error',
      issues: [
        {
          message: 'String must contain at least 1 character(s)',
          code: 'too_small',
          path: ['originCityName'],
          type: 'string',
          minimum: 1,
          inclusive: true,
          exact: false,
        },
      ],
    };

    // Interceptando a requisição para a busca de cidades
    const SearchCitiesHandler = SearchCitiesInterceptor.get('/cities')
      .with({
        searchParams: { query: '' }, // Simulando uma busca com parâmetro vazio
        exact: true,
      })
      .respond({
        status: 400, // Corrigido para refletir erro de validação
        body: errorResult,
      });

    // Fazendo a requisição para a rota /shipping/calculate com parâmetros inválidos
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: '', // Origem inválida
        destinationCityName: 'Recife, PE', // Destino válido
        weightInKilograms: 10, // Peso válido
        volumeInLiters: 0.1, // Volume válido
      } satisfies CalculateShippingQuery);

    // Verificando se o status retornado é 400 (Bad Request)
    expect(response.status).toBe(400);

    // Verificando se a resposta corresponde ao erro esperado
    expect(response.body).toEqual(errorResult);

    // Log opcional para depuração
    console.log(response.body);
  });

  test('caso 3: cálculo de distância com cidades válidas', async () => {
    const SearchCitiesResult1: LocationCity[] = [
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
    const SearchCitiesResult2: LocationCity[] = [
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
    const calculateDistanceBetweenCitiesResult: LocationDistance = {
      kilometers: 2133.137403632718,
    };

    const SearchCitiesHandler1 = SearchCitiesInterceptor.get('/cities')
      .with({
        searchParams: { query: 'São Paulo, SP' },
        exact: true,
      })
      .respond({
        status: 200,
        body: SearchCitiesResult1,
      });

    const SearchCitiesHandler2 = SearchCitiesInterceptor.get('/cities')
      .with({
        searchParams: { query: 'Recife, PE' },
        exact: true,
      })
      .respond({
        status: 200,
        body: SearchCitiesResult2,
      });

    const calculateDistanceHandler = calculateDistanceBetweenCitiesInterceptor
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
          destinationCityId: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: calculateDistanceBetweenCitiesResult,
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
    expect(response.body.distanceInKilometers).toBeCloseTo(2133.137403632718);
  });

  test('caso 4: erro 500 na API de cálculo de distâncias', async () => {
    const SearchCitiesResult1: LocationCity[] = [
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
    const SearchCitiesResult2: LocationCity[] = [
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

    const SearchCitiesHandler1 = SearchCitiesInterceptor.get('/cities')
      .with({
        searchParams: { query: 'São Paulo, SP' },
        exact: true,
      })
      .respond({
        status: 200,
        body: SearchCitiesResult1,
      });

    const SearchCitiesHandler2 = SearchCitiesInterceptor.get('/cities')
      .with({
        searchParams: { query: 'Recife, PE' },
        exact: true,
      })
      .respond({
        status: 200,
        body: SearchCitiesResult2,
      });

    const calculateDistanceHandler = calculateDistanceBetweenCitiesInterceptor
      .get('/cities/distances')
      .with({
        searchParams: {
          originCityId: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDM5MTc2',
          destinationCityId: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDI4NjQ3',
        },
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
    expect(response.body.message).toBe('Internal server error');
  });
});
