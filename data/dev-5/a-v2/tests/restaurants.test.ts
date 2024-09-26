import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';
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
import { PlaceTextSearchResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';

describe('Restaurants', () => {
  type Error = {
    error: {
      code: number;
      message: string;
      status: string;
    };
  };

  type MySchema = HttpSchema<{
    '/places:searchText': {
      POST: {
        request: {
          body: {
            textQuery: string;
            includedType: string;
            languageCode: string;
          };
          headers: {
            'Content-Type': string;
            'X-Goog-Fieldmask': string;
          };
        };
        response: {
          200: { body: PlaceTextSearchResult };
          400: { body: Error };
        };
      };
    };
  }>;

  const zimicInterceptor = httpInterceptor.create<MySchema>({
    type: 'local',
    baseURL: process.env.GOOGLE_MAPS_PLACES_API_URL,
    saveRequests: true,
  });

  beforeAll(async () => {
    await app.ready();
    await zimicInterceptor.start();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    zimicInterceptor.clear();
  });

  afterAll(async () => {
    await app.close();
    await zimicInterceptor.stop();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Campina Grande, PB',
      });

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 1: sucesso (2XX)', async () => {
    const resultsOk: PlaceTextSearchResult = {
      places: [
        {
          id: 'ChIJ_-dU9g8zGQ0RZuM8v0sKEt8',
          formattedAddress:
            'R. Francisco Tomás da Costa 28, 1600-093 Lisboa, Portugal',
          location: {
            latitude: 38.7430711,
            longitude: -9.1558751,
          },
          rating: 4.7,
          displayName: {
            text: 'Lucimar',
            languageCode: 'pt-PT',
          },
        },
        {
          id: 'ChIJmUOQv5g0GQ0RQXio4tGUxDM',
          formattedAddress: 'R. do Olival 258, 1200-744 Lisboa, Portugal',
          location: {
            latitude: 38.704848999999996,
            longitude: -9.166345699999999,
          },
          rating: 4.8,
          displayName: {
            text: 'Come Prima',
            languageCode: 'pt',
          },
        },
      ],
    };

    const myHandlerOk = zimicInterceptor
      .post('/places:searchText')
      .with({
        body: {
          textQuery: 'restaurantes em Recife',
          includedType: 'restaurant',
          languageCode: 'pt-BR',
        },
        exact: true,
      })
      .respond({ status: 200, body: resultsOk });

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Recife',
      });

    const requests = myHandlerOk.requests();
    expect(requests).toHaveLength(1);

    expect(response.status).toBe(200);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const resultInvalid: Error = {
      error: {
        code: 400,
        message: 'Empty text_query.\n',
        status: 'INVALID_ARGUMENT',
      },
    };

    const myHandlerInvalid = zimicInterceptor
      .post('/places:searchText')
      .with({
        body: {
          textQuery: '',
          includedType: '',
          languageCode: 'pt-BR',
        },
        exact: true,
      })
      .respond({ status: 400, body: resultInvalid });

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: '',
      });

    const requests = myHandlerInvalid.requests();
    expect(requests).toHaveLength(1);

    expect(response.status).toBe(500);
  });
});
