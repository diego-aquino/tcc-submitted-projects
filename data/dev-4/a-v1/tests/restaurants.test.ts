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
      html_attributions: [],
      next_page_token:
        'AXCi2Q6wI6XBmRx8mV77jdtzardVAWZpJLQClYZ2H_4jhngzaAN5ArjcjNBDnEPPBeBv_PQZJ3-rk2WG1QDtx8KtNw51M5K1sk5nA6sN630dElRBPgPVAb73jYVc2Dfbz-TEcqJd90AG9qYgrZNGQ0nmzmwWk0R5fud_4zFabr4tMq3rkqKQ0G23ZryvPZMG81U4eTPYGwPBCtjyIVPiEx1zBKWkqB3vv2vtKEMjxcof2KO5rzjAOpfXrPHBhsh46C_Cc5aMWhiQD3Mu4nndXdoz45-raozaM9KyTHhDOW9meJBS8d7AblvpobpozQ9JyL27rjnSwRoh97LC2A6Yf83lz3uxzaTmMd6sVmSsy91AZ1aQ0bi25FRRlLE9_2pGUO1R2AN_KULJyhrEQ2z1A1hh7i4pivaHUz2uhLxKi0pmMJj8',
      results: [
        {
          business_status: 'OPERATIONAL',
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
                'AXCi2Q67WMG3bx2JOq7GFKvQH3fCo_NvkEGJMnC86LtVIt5j0bPHAVdRtdtVVje3QvgjaxrmsAAxNUFYw8RgE_Lwwi9-EZ3fJHxd3SIMV-Au5O9E9YhYPaK-cREGstNAefOxNDZdSt52fuDk3jqfW22HIjJvUcTvDTKOF8XZXFn_rQRMELCO',
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
          user_ratings_total: 2411,
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
                'AXCi2Q7Hr9y7CjqbS-VA7xhW2_6w_adtDuycSj01EwOgZVnWjNs0OU5NJKEogbh_EPcMS5yGX_7DX9syBOBp5D0dSt8Uqi-kwKG1S0cKIovVOhxoRYTJkI6I1137VCDgu7Sv7AmqjyZxnKWJ1HEOn8t5fDWCD1P60BjW8NMms05BqsMY65w_',
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
          user_ratings_total: 8723,
        },
      ],
      status: 'OK',
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
        id: 'ChIJqeYp3NIEdkgRl9hMI8pRL8U',
        name: 'Barrafina',
        rating: 4.5,
        location: {
          latitude: 51.5141074,
          longitude: -0.1326682,
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
        `${process.env.GOOGLE_MAPS_PLACES_API_URL}/textsearch/json`,
        () => {
          const results = {
            error_message:
              'See documentation for valid queries. https://developers.google.com/maps/documentation/places/web-service/search-text#TextSearchRequests',
            html_attributions: [],
            results: [],
            status: 'INVALID_REQUEST',
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
