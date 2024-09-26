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
import { PlaceTextSearchResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';

interface RequestError {
  message: string;
}

type PlaceTextSearchResultSchema = HttpSchema<{
  '/textsearch/json': {
    GET: {
      request: {
        headers: { authorization?: string };
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
      html_attributions: [],
      next_page_token:
        'AXCi2Q6GLVDDOBKeiTRiW0Ytw9LHOqWpW_E0k8fJ7Sv6n-UHCRDqUgLD3FL1QDoVrYKbUFyYtaQZxRvtub6SBIPJ5sQoLouPKYpyT_Rervw_3NZGpwonmo4zJXdGi3qObqSOKYYSL2NIT5Enq2aeBq5LlaLJoGrZsEBB2NzQ-TaNsdkUK2YIXvD-U-fqnWO-E0N18B1tTiJ970egcRryYtPX8y754JSHoZyJaNya8JXs32NZeGbtwXQxzg1a-b5GEzMZAQS_QntXgbnkt2tTtR72WCSQJbkyehcpyLE49FAbrGT4OJKYhkzTNCWijMpZT8dPuQxcVoBxpGjvTeEUo1YPsksRUlgG3H3toQrPHWX-YLIApCnTzCbRJiCoHIgZK5uT6akhA7HNktYMYUzmvy3QXp6oyWwuu1Ilsi-SI6PtAldj',
      results: [
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
                'AXCi2Q7zfC27B_P_lnuv6yc1iZWwvioh_UvrnjkOP_EJzvktKS_cbF-2ZdSscFgbHW9LdK1_DrrGwSZLAedhD1jChcPTbKSUqu6c6yU8I6kAIW0qT8k8yzZUo2R0wmLGm2qNbUMLpFe9aEuBFQjt2JjAsV-UtibZNzrSF-wMcxFZkhuGNM-B',
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
          user_ratings_total: 8712,
        },
        {
          business_status: 'OPERATIONAL',
          formatted_address: '160 Piccadilly, London W1J 9EB, Reino Unido',
          geometry: {
            location: {
              lat: 51.5074827,
              lng: -0.1409759,
            },
            viewport: {
              northeast: {
                lat: 51.50884387989272,
                lng: -0.1396387201072778,
              },
              southwest: {
                lat: 51.50614422010727,
                lng: -0.1423383798927222,
              },
            },
          },
          icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png',
          icon_background_color: '#FF9E67',
          icon_mask_base_uri:
            'https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet',
          name: 'The Wolseley',
          opening_hours: {
            open_now: true,
          },
          photos: [
            {
              height: 2048,
              html_attributions: [
                '<a href="https://maps.google.com/maps/contrib/106710366462744701509">James Leakey</a>',
              ],
              photo_reference:
                'AXCi2Q7cagHmjyzIpD49GeyTV28Gzy_gTdt9-Es_XoVXjEi3aq2KYT3C8Od2fiP_Spgljf7hPbrcxazAkf8Pn9WOqSYf91sJq9yTO-_uRW45hNzzN8JG5IST7RFPmL9_X2NnfhyUD6Q4Jo2SklC9V1R2xBh2Pvxsb5uWZ-7qMXQ7y0lQ9bcT',
              width: 1622,
            },
          ],
          place_id: 'ChIJr_4cVy8FdkgRIrNbO93eUFM',
          plus_code: {
            compound_code: 'GV45+XJ Londres, Reino Unido',
            global_code: '9C3XGV45+XJ',
          },
          price_level: 3,
          rating: 4.4,
          reference: 'ChIJr_4cVy8FdkgRIrNbO93eUFM',
          types: [
            'cafe',
            'restaurant',
            'food',
            'point_of_interest',
            'establishment',
          ],
          user_ratings_total: 6473,
        },
      ],
      status: 'OK',
    };

    const placesHandler = googleMapsPlacesClientHandler
      .get('/textsearch/json')
      .with({
        searchParams: {
          query: 'restaurantes em Londres, Inglaterra',
          type: 'restaurant',
          language: 'pt-BR',
          radius: `${10000}`,
        },
        exact: true,
      })
      .respond({ status: 200, body: placesResponse });

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Londres, Inglaterra',
      });

    expect(response.status).toBe(200);

    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual([
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
      {
        id: 'ChIJr_4cVy8FdkgRIrNbO93eUFM',
        name: 'The Wolseley',
        rating: 4.4,
        location: {
          latitude: 51.5074827,
          longitude: -0.1409759,
          formattedAddress: '160 Piccadilly, London W1J 9EB, Reino Unido',
        },
      },
    ]);
    const placesRequests = placesHandler.requests();
    expect(placesRequests).toHaveLength(1);
    expect(placesRequests[0].headers.get('authorization')).toBeNull();

    expect(placesRequests[0].searchParams.size).toBe(4);
    expect(placesRequests[0].searchParams.get('language')).toBe('pt-BR');
    expect(placesRequests[0].searchParams.get('query')).toBe(
      'restaurantes em Londres, Inglaterra'
    );
    expect(placesRequests[0].searchParams.get('radius')).toBe('10000');
    expect(placesRequests[0].searchParams.get('type')).toBe('restaurant');

    expect(placesRequests[0].body).toBe(null);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const placesResponseWithError: PlaceTextSearchResult = {
      error_message:
        'See documentation for valid queries. https://developers.google.com/maps/documentation/places/web-service/search-text#TextSearchRequests',
      html_attributions: [],
      results: [],
      status: 'INVALID_REQUEST',
    };

    const placesHandler = googleMapsPlacesClientHandler
      .get('/textsearch/json')
      .with({
        searchParams: {
          query: '',
          type: '',
          language: 'pt-BR',
          radius: `${10000}`,
        },
        exact: true,
      })
      .respond({ status: 200, body: placesResponseWithError });

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);

    expect(response.body.message).toEqual('Internal server error');

    const placesRequests = placesHandler.requests();
    expect(placesRequests).toHaveLength(1);
    expect(placesRequests[0].headers.get('authorization')).toBeNull();

    expect(placesRequests[0].searchParams.size).toBe(4);
    expect(placesRequests[0].searchParams.get('language')).toBe('pt-BR');
    expect(placesRequests[0].searchParams.get('query')).toBe('');
    expect(placesRequests[0].searchParams.get('radius')).toBe('10000');
    expect(placesRequests[0].searchParams.get('type')).toBe('');

    expect(placesRequests[0].body).toBe(null);
  });
});
