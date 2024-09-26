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

export const handlers = [
  http.get(`${process.env.GOOGLE_MAPS_PLACES_API_URL}/textsearch/json`, () => {
    const results = {
      places: [
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
        {
          id: 'ChIJj6yD2340GQ0RM137RrwiBao',
          formattedAddress: 'R. Anchieta 15, 1200-224 Lisboa, Portugal',
          location: {
            latitude: 38.710197,
            longitude: -9.141077,
          },
          rating: 4.7,
          displayName: {
            text: 'Alma',
            languageCode: 'pt',
          },
        },
      ],
    };

    return HttpResponse.json(results);
  }),

  http.get(`${process.env.GOOGLE_MAPS_PLACES_API_URL}/textsearch/json`, () => {
    const results = {
      error_message:
        'See documentation for valid queries. https://developers.google.com/maps/documentation/places/web-service/search-text#TextSearchRequests',
      html_attributions: [],
      results: [],
      status: 'INVALID_REQUEST',
    };

    return HttpResponse.json(results);
  }),
];

export const server = setupServer(...handlers);

describe('Restaurants', () => {
  beforeAll(async () => {
    server.listen();
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  afterAll(async () => {
    await app.close();
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
    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Fortaleza, CE',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 'ChIJmUOQv5g0GQ0RQXio4tGUxDM',
        name: 'Come Prima',
        rating: 4.8,
        location: {
          latitude: 38.704848999999996,
          longitude: -9.166345699999999,
          formattedAddress: 'R. do Olival 258, 1200-744 Lisboa, Portugal',
        },
      },
      {
        id: 'ChIJj6yD2340GQ0RM137RrwiBao',
        name: 'Alma',
        rating: 4.7,
        location: {
          latitude: 38.710197,
          longitude: -9.141077,
          formattedAddress: 'R. Anchieta 15, 1200-224 Lisboa, Portugal',
        },
      },
    ]);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    server.use(
      http.get(
        `${process.env.GOOGLE_MAPS_PLACES_API_URL}/textsearch/json`,
        () => {
          const results = {
            error: {
              code: 400,
              message: 'Empty text_query.\n',
              status: 'INVALID_ARGUMENT',
            },
          };

          return HttpResponse.json(results);
        }
      )
    );

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);
    console.log(response.body);
  });
});
