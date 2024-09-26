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

import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';

import app from '../src/server/app';
import {
  GetQueryParams,
  PlaceAutocompleteResult,
} from '../src/clients/googleMaps/GoogleMapsPlacesClient';

const BASE_URL = process.env.GOOGLE_MAPS_PLACES_API_URL ?? '';

type GoogleSchema = HttpSchema<{
  '/queryautocomplete/json': {
    GET: {
      request: {
        searchParams: GetQueryParams;
      };
      response: {
        200: { body: PlaceAutocompleteResult };
      };
    };
  };
}>;

describe('Autocomplete', () => {
  const interceptor = httpInterceptor.create<GoogleSchema>({
    type: 'local',
    baseURL: BASE_URL,
    saveRequests: true, // Allow access to `handler.requests()`
  });

  beforeAll(async () => {
    await interceptor.start();
  });

  afterEach(() => {
    interceptor.clear();
  });

  afterAll(async () => {
    await interceptor.stop();
  });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: 'pizza em l',
      });

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 1: sucesso (2XX)', async () => {
    const listHandler = interceptor
      .get('/queryautocomplete/json')
      .with({
        searchParams: {
          input: 'pizza em l',
          language: 'pt-BR',
          radius: '10000',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: {
          status: 'OK',
          predictions: [
            {
              description: 'pizza em Los Angeles, CA, EUA',
              matched_substrings: [
                {
                  length: 5,
                  offset: 0,
                },
                {
                  length: 1,
                  offset: 9,
                },
              ],
              structured_formatting: {
                main_text: 'pizza',
                main_text_matched_substrings: [
                  {
                    length: 5,
                    offset: 0,
                  },
                ],
                secondary_text: 'em Los Angeles, CA, EUA',
                secondary_text_matched_substrings: [
                  {
                    length: 1,
                    offset: 3,
                  },
                ],
              },
              terms: [
                {
                  offset: 0,
                  value: 'pizza',
                },
                {
                  offset: 6,
                  value: 'em',
                },
                {
                  offset: 9,
                  value: 'Los Angeles',
                },
                {
                  offset: 22,
                  value: 'CA',
                },
                {
                  offset: 26,
                  value: 'EUA',
                },
              ],
            },
            {
              description: 'pizza em Las Vegas, NV, EUA',
              matched_substrings: [
                {
                  length: 5,
                  offset: 0,
                },
                {
                  length: 1,
                  offset: 9,
                },
              ],
              structured_formatting: {
                main_text: 'pizza',
                main_text_matched_substrings: [
                  {
                    length: 5,
                    offset: 0,
                  },
                ],
                secondary_text: 'em Las Vegas, NV, EUA',
                secondary_text_matched_substrings: [
                  {
                    length: 1,
                    offset: 3,
                  },
                ],
              },
              terms: [
                {
                  offset: 0,
                  value: 'pizza',
                },
                {
                  offset: 6,
                  value: 'em',
                },
                {
                  offset: 9,
                  value: 'Las Vegas',
                },
                {
                  offset: 20,
                  value: 'NV',
                },
                {
                  offset: 24,
                  value: 'EUA',
                },
              ],
            },
          ],
        },
      });

    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: 'pizza em l',
      });

    expect(response.status).toBe(200);

    const listRequests = listHandler.requests();
    expect(listRequests).toHaveLength(1);

    const body = response.body;
    expect(body).toEqual([
      {
        text: 'pizza em Los Angeles, CA, EUA',
        formattedText: '**pizza** em **L**os Angeles, CA, EUA',
      },
      {
        text: 'pizza em Las Vegas, NV, EUA',
        formattedText: '**pizza** em **L**as Vegas, NV, EUA',
      },
    ]);

    expect(listRequests[0].searchParams.size).toBe(3);
    expect(listRequests[0].searchParams.get('input')).toBe('pizza em l');
    expect(listRequests[0].searchParams.get('language')).toBe('pt-BR');
    expect(listRequests[0].searchParams.get('radius')).toBe('10000');
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const listHandler = interceptor
      .get('/queryautocomplete/json')
      .with({
        searchParams: {
          input: '',
          language: 'pt-BR',
          radius: '10000',
        },
        exact: true,
      })
      .respond({
        status: 200,
        body: {
          predictions: [],
          status: 'INVALID_REQUEST',
        },
      });

    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);

    const listRequests = listHandler.requests();
    expect(listRequests).toHaveLength(1);

    const body = response.body;
    expect(body).toEqual({ message: 'Internal server error' });

    expect(listRequests[0].searchParams.size).toBe(3);
    expect(listRequests[0].searchParams.get('input')).toBe('');
    expect(listRequests[0].searchParams.get('language')).toBe('pt-BR');
    expect(listRequests[0].searchParams.get('radius')).toBe('10000');
  });
});
