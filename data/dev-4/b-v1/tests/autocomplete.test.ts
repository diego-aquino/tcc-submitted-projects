import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import app from '../src/server/app';
import { PlaceAutocompleteResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';
import { placeAutocompleteRequestInterceptor } from './interceptor';

describe('Autocomplete', () => {
  beforeAll(async () => {
    await app.ready();
    await placeAutocompleteRequestInterceptor.start();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  afterAll(async () => {
    await placeAutocompleteRequestInterceptor.stop();
    await app.close();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server).get('/places/autocomplete').query({
      query: 'pizza em l',
    });

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 1: sucesso (2XX)', async () => {
    const words: PlaceAutocompleteResult = {
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
      ],
      status: 'OK',
    };

    const listHandler = placeAutocompleteRequestInterceptor
      .get('/queryautocomplete/json')
      .with({
        searchParams: { input: 'pizza', language: 'pt-BR', radius: `${10000}` },
      })
      .respond({ status: 200, body: words });

    const response = await supertest(app.server).get('/places/autocomplete').query({
      query: 'pizza',
    });

    const listRequests = listHandler.requests();
    expect(listRequests).toHaveLength(1);

    expect(response.status).toBe(200);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const words: PlaceAutocompleteResult = {
      predictions: [],
      status: 'INVALID_REQUEST',
    };

    const listHandler = placeAutocompleteRequestInterceptor
      .get('/queryautocomplete/json')
      .with({
        searchParams: { input: '', language: 'pt-BR', radius: `${10000}` },
      })
      .respond({ status: 200, body: words });

    const response = await supertest(app.server).get('/places/autocomplete').query({
      query: '',
    });

    const listRequests = listHandler.requests();
    expect(listRequests).toHaveLength(1);

    expect(response.status).toBe(500);
    console.log(response.body);
  });
});
