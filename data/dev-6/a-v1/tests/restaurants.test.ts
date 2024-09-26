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

const server = setupServer(
  // Describe network behavior with request handlers.
  // Tip: move the handlers into their own module and
  // import it across your browser and Node.js setups!
  http.get(
    process.env.GOOGLE_MAPS_PLACES_API_URL + '/textsearch/json',
    ({ request, params, cookies }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get('query');
      const type = url.searchParams.get('type');
      let response;

      if (type == 'restaurant' && query != '') {
        response = {
          html_attributions: [],
          next_page_token:
            'AXCi2Q7wQuYcQ9-7064jLtcUnsuf7CN8hp45VnP9kMiaAMFFGj48K_q9gnF03vhR9RhKo01aceqxaZ7To5mfk4tTHrMYNYSpEYH6bmjqBoSa9syXCbbJxHywY66Xax-VLply2TcTXR8Lgw5DxH7CQmzsuVKhVcrDhY2xfAwFYGqsOalsOsHoNxmHgvECuiuSkk1tZ0Epk85xX4XI0zniyhQclUuYM8tj83wawFShPKS-UNJ-iJnvAvj1Fo9W-3ZiKPufNVc8S5NJRLom4A1YS8J7SGk6VnaNvW7r4Mjf0oBCV_cexcGCCb0QYR9b4r94Bt7GVEK34mzBOk7N8w1Vno8pzKA52CnuIDucQ3Edlp9MMYO99dW4aYm6QEuax6mh0k-1tOiXWKdnThs2HzZiP9k26VmKnW-PjExcn8Z2qDFxyuBG',
          results: [
            {
              business_status: 'OPERATIONAL',
              formatted_address: '4-5 London Rd, London SE1 6JZ, Reino Unido',
              geometry: {
                location: {
                  lat: 51.4981672,
                  lng: -0.1043162,
                },
                viewport: {
                  northeast: {
                    lat: 51.49955907989272,
                    lng: -0.1029596701072778,
                  },
                  southwest: {
                    lat: 51.49685942010727,
                    lng: -0.1056593298927222,
                  },
                },
              },
              icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png',
              icon_background_color: '#FF9E67',
              icon_mask_base_uri:
                'https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet',
              name: 'Paladar',
              opening_hours: {
                open_now: true,
              },
              photos: [
                {
                  height: 968,
                  html_attributions: [
                    '<a href="https://maps.google.com/maps/contrib/115840760912783185373">A Google User</a>',
                  ],
                  photo_reference:
                    'AXCi2Q4AIfTxX7iUtnkTaRxdz6RWPzHuhzo3dIH5eUeiThIvIRrvpghugpgBRM5bqRj-GTC5A9CejbcbfWLXRIk_qb6F6dQIJAVkv_Uro11GugjbgK6GEwptiUROzX4n42LwEfBF0VTd_ni9fjsOiwcyTkqr_ZEqibsICeA0jbOy3JrZMIk',
                  width: 1500,
                },
              ],
              place_id: 'ChIJeRmWQaMEdkgRxzs1yBsmrSQ',
              plus_code: {
                compound_code: 'FVXW+77 Londres, Reino Unido',
                global_code: '9C3XFVXW+77',
              },
              price_level: 2,
              rating: 4.2,
              reference: 'ChIJeRmWQaMEdkgRxzs1yBsmrSQ',
              types: [
                'liquor_store',
                'store',
                'restaurant',
                'food',
                'point_of_interest',
                'establishment',
              ],
              user_ratings_total: 1433,
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
                    'AXCi2Q7voTqjqRcmX_B9iiOn2dk-mOyyG9eNUy9a7RIxSA625mvvtGqydQ2KJjTXbxL-UYnIfkNziyP3nl5Zc0uCKsw3pO4etDL9GYX0Rc-jG21bIVxOpfF9Tl80Ji_F9_qbpF07E7gU8-LJO5FEJ6m-dYIDVZcFCMlMt_Ay7EJA4M12AB3A',
                  width: 1190,
                },
              ],
              place_id: 'ChIJl-cjD9QEdkgRVkkQt3pySRI',
              plus_code: {
                compound_code: 'GV67+6Q Londres, Reino Unido',
                global_code: '9C3XGV67+6Q',
              },
              price_level: 2,
              rating: 4.8,
              reference: 'ChIJl-cjD9QEdkgRVkkQt3pySRI',
              types: [
                'cafe',
                'restaurant',
                'food',
                'point_of_interest',
                'establishment',
              ],
              user_ratings_total: 8727,
            },
          ],
          status: 'OK',
        };
      } else if (type == '' && query == '') {
        response = {
          error_message:
            'See documentation for valid queries. https://developers.google.com/maps/documentation/places/web-service/search-text#TextSearchRequests',
          html_attributions: [],
          results: [],
          status: 'INVALID_REQUEST',
        };
      }

      return HttpResponse.json(response);
    }
  )
);

describe('Restaurants', () => {
  beforeAll(async () => {
    server.listen();
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    server.resetHandlers();
  });

  afterAll(async () => {
    server.close();
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
        query: 'London',
      });

    expect(response.status).toBe(200);
    expect(response.body.length).not.toBe(0);
    expect(response.body[0].rating).toBeGreaterThan(response.body[1].rating);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});
