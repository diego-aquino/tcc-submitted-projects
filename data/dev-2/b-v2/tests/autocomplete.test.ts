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

interface RequestError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

type GoogleSchema = HttpSchema<{
  '/places:autocomplete': {
    POST: {
      request: {
        headers: {
          'Content-Type': string;
        };
        body: GetQueryParams;
      };
      response: {
        200: { body: PlaceAutocompleteResult };
        400: { body: RequestError };
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
      .post('/places:autocomplete')
      .with({
        body: {
          input: 'pizza em l',
          languageCode: 'pt-BR',
          includeQueryPredictions: true,
        },
      })
      .respond({
        status: 200,
        body: {
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
            {
              queryPrediction: {
                text: {
                  text: 'pizza em Las Vegas, NV, EUA',
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
                    text: 'em Las Vegas, NV, EUA',
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

    expect(listRequests[0].body.input).toEqual('pizza em l');
    expect(listRequests[0].body.languageCode).toEqual('pt-BR');
    expect(listRequests[0].body.includeQueryPredictions).toEqual(true);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const listHandler = interceptor
      .post('/places:autocomplete')
      .with({
        body: {
          input: '',
          languageCode: 'pt-BR',
          includeQueryPredictions: true,
        },
      })
      .respond({
        status: 400,
        body: {
          error: {
            code: 400,
            message: 'input must be non-empty.\n',
            status: 'INVALID_ARGUMENT',
          },
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
    console.log(body);
    expect(body).toEqual({ message: 'Internal server error' });

    expect(listRequests[0].body.input).toEqual('');
    expect(listRequests[0].body.languageCode).toEqual('pt-BR');
    expect(listRequests[0].body.includeQueryPredictions).toEqual(true);
  });
});
