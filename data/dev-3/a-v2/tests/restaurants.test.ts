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

import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';
import {
  Place,
  PlaceTextSearchResult,
} from '../src/clients/googleMaps/GoogleMapsPlacesClient';

type PlaceTextSearchResultSchema = HttpSchema<{
  '/places:searchText': {
    POST: {
      request: {
        headers: {
          'Content-Type': string;
          'X-Goog-Fieldmask': string;
        };
        body: {
          textQuery: string;
          includedType: string;
          languageCode: string;
        };
      };
      response: {
        200: { body: PlaceTextSearchResult };
        400: {
          body: {
            error: {
              code: number;
              message: string;
              status: string;
            };
          };
        };
      };
    };
  };
}>;

const googleMapsPlacesClientHandler =
  httpInterceptor.create<PlaceTextSearchResultSchema>({
    type: 'local',
    baseURL: process.env.GOOGLE_MAPS_PLACES_API_URL,
    saveRequests: true,
  });

describe('Restaurants', () => {
  beforeAll(async () => {
    await app.ready();
    await googleMapsPlacesClientHandler.start();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    googleMapsPlacesClientHandler.clear();
  });

  afterAll(async () => {
    await app.close();
    await googleMapsPlacesClientHandler.stop();
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
    const placesResponse: PlaceTextSearchResult = {
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

    const placesHandler = googleMapsPlacesClientHandler
      .post('/places:searchText')
      .with({
        body: {
          textQuery: 'restaurantes em Lisboa, Portugal',
          includedType: 'restaurant',
          languageCode: 'pt-BR',
        },
        exact: true,
      })
      .respond({ status: 200, body: placesResponse });

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Lisboa, Portugal',
      });

    expect(response.status).toBe(200);

    expect(response.body).toHaveLength(2);
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
    const placesRequests = placesHandler.requests();
    expect(placesRequests).toHaveLength(1);
    expect(placesRequests[0].headers.get('Content-Type')).toEqual(
      'application/json'
    );
    expect(placesRequests[0].headers.get('X-Goog-Fieldmask')).toEqual(
      'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
    );

    expect(placesRequests[0].body).toEqual({
      textQuery: 'restaurantes em Lisboa, Portugal',
      includedType: 'restaurant',
      languageCode: 'pt-BR',
    });
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const placesResponseWithError = {
      error: {
        code: 400,
        message: 'Empty text_query.\n',
        status: 'INVALID_ARGUMENT',
      },
    };

    const placesHandler = googleMapsPlacesClientHandler
      .post('/places:searchText')
      .with({
        body: {
          textQuery: '',
          includedType: '',
          languageCode: 'pt-BR',
        },
        exact: true,
      })
      .respond({ status: 400, body: placesResponseWithError });

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);

    expect(response.body.message).toEqual('Internal server error');

    const placesRequests = placesHandler.requests();
    expect(placesRequests).toHaveLength(1);
    expect(placesRequests[0].headers.get('Content-Type')).toEqual(
      'application/json'
    );
    expect(placesRequests[0].headers.get('X-Goog-Fieldmask')).toEqual(
      'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
    );

    expect(placesRequests[0].body).toEqual({
      textQuery: '',
      includedType: '',
      languageCode: 'pt-BR',
    });
  });
});
