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
import { httpInterceptor } from 'zimic/interceptor/http';
import { type AutocompleteServiceSchema } from '../schema2';

const interceptor = httpInterceptor.create<AutocompleteServiceSchema>({
  type: 'local',
  baseURL: process.env.GOOGLE_MAPS_PLACES_API_URL,
  saveRequests: true,
});

describe('Autocomplete', () => {
  beforeAll(async () => {
    await app.ready();
    await interceptor.start();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    interceptor.clear();
  });

  afterAll(async () => {
    await interceptor.stop();
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
    const mockedResponse = {
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
    };

    const listHandler = interceptor
      .post('/places:autocomplete')
      .with({
        body: {
          input: 'pizza em l',
          includeQueryPredictions: true,
          languageCode: 'pt-BR',
        },
      })
      .respond({ status: 200, body: mockedResponse });

    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: 'pizza em l',
      });

    expect(response.status).toBe(200);
    expect(response.body.length).not.toBe(0);
    expect(listHandler.requests().length).toBe(1);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const mockedErrorResponse = {
      error: {
        code: 400,
        message: 'input must be non-empty.\n',
        status: 'INVALID_ARGUMENT' as const,
      },
    };

    const mockedSuccessResponse = {
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
    };

    let listHandlerSuccess = interceptor
      .post('/places:autocomplete')
      .respond({ status: 200, body: mockedSuccessResponse });

    const listHandlerError = interceptor
      .post('/places:autocomplete')
      .with({
        body: {
          input: '',
          includeQueryPredictions: true,
          languageCode: 'pt-BR',
        },
      })
      .respond({ status: 400, body: mockedErrorResponse });

    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
    expect(listHandlerError.requests().length).toBe(1);
    expect(listHandlerSuccess.requests().length).toBe(0);
  });
});
