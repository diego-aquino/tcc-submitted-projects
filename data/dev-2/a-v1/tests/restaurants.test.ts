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

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import app from '../src/server/app';

const BASE_URL = process.env.GOOGLE_MAPS_PLACES_API_URL ?? '';

describe('Restaurants', () => {
  beforeAll(async () => {
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  afterAll(async () => {
    await app.close();
  });

  const server = setupServer(
    http.get(`${BASE_URL}/textsearch/json`, ({ request, params, cookies }) => {
      const url = new URL(request.url);

      const query = url.searchParams.get('query');
      const type = url.searchParams.get('type');
      const language = url.searchParams.get('language');
      const radius = url.searchParams.get('radius');

      return HttpResponse.json({
        status: 'OK',
        html_attributions: [],
        next_page_token:
          'AXCi2Q7srCl6bZsH0IJxGCFDsk5tNepM6uyndYcCZbhG_7dkJeOCg_ev2B3fXwH42LqIULbhb5Iv_eRTAJrHHwcls0cm8I7bgRUEp9M2LhlapNXjvu7Er411zBrpUOl_psuI5LwG5tF4VBeTEa-B1YEB7l1yrKwetvFMIuah4t1ksVg_j-hdEjHn44Q7gBrFkD6DvavgfAewwurRxnsUktaE5SXj1S2ecnvwox76qlKSotr0DatMMc8X_ZFhCq8iejQ0LtPu0WGBcwjSgflH4xWbvmb421l6B0GnvqIwHh0tvk0WDh-1TF0hnyPWu4CPlp_Q5h4XUkhZDgNoSHXinmEqnAQV3mPqatbTN3-FLQ6YisMz71l-CReuOS0QLx4cNbZWF9z45VESDtHflR8VXCsFf0GEj62fv-nDsRXYu16TugO7',
        results: [
          {
            business_status: 'OPERATIONAL',
            formatted_address: '26-27 Dean St, London W1D 3LL, Reino Unido',
            geometry: {
              location: {
                lat: 51.5140955,
                lng: -0.1326729,
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
            icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png',
            icon_background_color: '#FF9E67',
            icon_mask_base_uri:
              'https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet',
            name: 'Barrafina',
            opening_hours: {
              open_now: true,
            },
            photos: [
              {
                height: 3024,
                html_attributions: [
                  '<a href="https://maps.google.com/maps/contrib/115677102232200197362">孟辰</a>',
                ],
                photo_reference:
                  'AXCi2Q7Ss_iTISw8k6Aqoiuc9jjS2mNqr-ngS16RVatM7p2Zb3gZQTUIv6iFq6mzXFd5zptvimLF9D1SE4XP8EfsHUSd5siSwwylV6clKvrw_d5YhZKjNe5Qr7ShDgCPTRzgvBpBeItCxn4FPnXwcKzQ7Bp39kf_8gnL_uj6F-PqIw_abSd8',
                width: 4032,
              },
            ],
            place_id: 'ChIJqeYp3NIEdkgRl9hMI8pRL8U',
            plus_code: {
              compound_code: 'GV78+JW Londres, Reino Unido',
              global_code: '9C3XGV78+JW',
            },
            price_level: 3,
            rating: 4.5,
            reference: 'ChIJqeYp3NIEdkgRl9hMI8pRL8U',
            types: ['restaurant', 'food', 'point_of_interest', 'establishment'],
            user_ratings_total: 2410,
          },
          {
            business_status: 'OPERATIONAL',
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
            icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png',
            icon_background_color: '#FF9E67',
            icon_mask_base_uri:
              'https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet',
            name: 'Brasserie Zédel',
            opening_hours: {
              open_now: true,
            },
            photos: [
              {
                height: 793,
                html_attributions: [
                  '<a href="https://maps.google.com/maps/contrib/113570482208630965072">Brasserie Zédel</a>',
                ],
                photo_reference:
                  'AXCi2Q4URXgI1hW5THLDGtcN1HjA_CftTV6pIwODII6atUnW5NzvomRMJata3S_atwozKnG_YwRQ4ykQd9zf4oBiEcj-zX_nNdxUVfiKsKfUiVgi-0JjEjFcXOHM_XKVOsbvSvNIE2qT-MnQNw_UYWJfDRcWNZHINbnFfijpjcIEkmtcXn_A',
                width: 1190,
              },
            ],
            place_id: 'ChIJl-cjD9QEdkgRVkkQt3pySRI',
            plus_code: {
              compound_code: 'GV67+6Q Londres, Reino Unido',
              global_code: '9C3XGV67+6Q',
            },
            price_level: 2,
            rating: 4.5,
            reference: 'ChIJl-cjD9QEdkgRVkkQt3pySRI',
            types: [
              'cafe',
              'restaurant',
              'food',
              'point_of_interest',
              'establishment',
            ],
            user_ratings_total: 8710,
          },
        ],
      });
    })
  );

  // Enable request interception.
  beforeAll(() => server.listen());

  // Reset handlers so that each test could alter them
  // without affecting other, unrelated tests.
  afterEach(() => server.resetHandlers());

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
        query: 'Campina Grande, PB',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 'ChIJqeYp3NIEdkgRl9hMI8pRL8U',
        name: 'Barrafina',
        rating: 4.5,
        location: {
          latitude: 51.5140955,
          longitude: -0.1326729,
          formattedAddress: '26-27 Dean St, London W1D 3LL, Reino Unido',
        },
      },
      {
        id: 'ChIJl-cjD9QEdkgRVkkQt3pySRI',
        name: 'Brasserie Zédel',
        rating: 4.5,
        location: {
          latitude: 51.5105561,
          longitude: -0.1355974,
          formattedAddress: '20 Sherwood St, London W1F 7ED, Reino Unido',
        },
      },
    ]);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    server.use(
      http.get(
        `${BASE_URL}/textsearch/json`,
        ({ request, params, cookies }) => {
          const url = new URL(request.url);

          const query = url.searchParams.get('query');
          const type = url.searchParams.get('type');
          const language = url.searchParams.get('language');
          const radius = url.searchParams.get('radius');

          return HttpResponse.json({
            status: 'INVALID_REQUEST',
            error_message:
              'See documentation for valid queries. https://developers.google.com/maps/documentation/places/web-service/search-text#TextSearchRequests',
            html_attributions: [],
            results: [],
          });
        }
      )
    );

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
  });
});
