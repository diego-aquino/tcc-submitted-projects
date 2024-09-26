import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import app from '../src/server/app';
import { PlaceAutocompletePrediction, PlaceAutocompleteResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';
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
      suggestions: [
        {
          queryPrediction: {
            text: {
              text: 'pizza em Los Angeles, CA, EUA',
              matches: [
                {
                  endOffset: 5,
                },
                {
                  startOffset: 9,
                  endOffset: 10,
                },
              ],
            },
            structuredFormat: {
              mainText: {
                text: 'pizza',
                matches: [
                  {
                    endOffset: 5,
                  },
                ],
              },
              secondaryText: {
                text: 'em Los Angeles, CA, EUA',
                matches: [
                  {
                    startOffset: 3,
                    endOffset: 4,
                  },
                ],
              },
            },
          },
        },
      ],
    };

    const listHandler = placeAutocompleteRequestInterceptor
      .post('/places:autocomplete')
      .with({
        body: {
          input: 'pizza em l',
          languageCode: 'pt-BR',
          includeQueryPredictions: true,
        },
      })
      .respond({ status: 200, body: words });

    const response = await supertest(app.server).get('/places/autocomplete').query({
      query: 'pizza em l',
    });

    const listRequests = listHandler.requests();
    expect(listRequests).toHaveLength(1);

    expect(response.status).toBe(200);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const words = {
      error: {
        code: 400,
        message: 'input must be non-empty.\n',
        status: 'INVALID_ARGUMENT',
      },
    };

    const listHandler = placeAutocompleteRequestInterceptor
      .post('/places:autocomplete')
      .with({
        body: {
          input: '',
          languageCode: 'pt-BR',
          includeQueryPredictions: true,
        },
      })
      .respond({ status: 400, body: words });

    const response = await supertest(app.server).get('/places/autocomplete').query({
      query: '',
    });

    const listRequests = listHandler.requests();
    expect(listRequests).toHaveLength(1);

    expect(response.status).toBe(500);
    console.log(response.body);
  });
});
