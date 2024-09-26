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
  type MySchema = HttpSchema<{
    '/textsearch/json': {
      GET: {
        request: {
          searchParams: {
            query: string;
            type: string;
            language: string;
            radius: number;
          };
        };
        response: {
          200: { body: PlaceTextSearchResult };
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
      html_attributions: [],
      results: [
        {
          formatted_address: '20 Sherwood St, London W1F 7ED, Reino Unido',
          geometry: {
            location: {
              lat: 51.5105561,
              lng: -0.1355974,
            },
            viewport: {
              northeast: {
                lat: 51.51199682989272,
                lng: -0.1342086701072778,
              },
              southwest: {
                lat: 51.50929717010727,
                lng: -0.1369083298927222,
              },
            },
          },
          name: 'Brasserie Zédel',
          place_id: 'ChIJl-cjD9QEdkgRVkkQt3pySRI',
          rating: 4.5,
        },
        {
          formatted_address: '26-27 Dean St, London W1D 3LL, Reino Unido',
          geometry: {
            location: {
              lat: 51.5141074,
              lng: -0.1326682,
            },
            viewport: {
              northeast: {
                lat: 51.51542947989272,
                lng: -0.1313619701072778,
              },
              southwest: {
                lat: 51.51272982010727,
                lng: -0.1340616298927222,
              },
            },
          },
          name: 'Barrafina',
          place_id: 'ChIJqeYp3NIEdkgRl9hMI8pRL8U',
          rating: 4.5,
        },
      ],
      status: 'OK',
    };

    const myHandlerOk = zimicInterceptor
      .get('/textsearch/json')
      .with({
        searchParams: {
          query: 'restaurantes em Recife',
          type: 'restaurant',
          language: 'pt-BR',
          radius: '10000',
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
    const resultInvalid: PlaceTextSearchResult = {
      error_message:
        'See documentation for valid queries. https://developers.google.com/maps/documentation/places/web-service/search-text#TextSearchRequests',
      html_attributions: [],
      results: [],
      status: 'INVALID_REQUEST',
    };

    const myHandlerInvalid = zimicInterceptor
      .get('/textsearch/json')
      .with({
        searchParams: {
          query: '',
          type: '',
          language: 'pt-BR',
          radius: '10000',
        },
        exact: true,
      })
      .respond({ status: 200, body: resultInvalid });

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
