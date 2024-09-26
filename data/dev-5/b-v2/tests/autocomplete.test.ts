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

describe('Autocomplete', () => {
  const server = setupServer();

  beforeAll(async () => {
    await app.ready();
    server.listen();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    server.resetHandlers();
  });

  afterAll(async () => {
    await app.close();
    server.close();
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
    server.use(
      http.post(
        `${process.env.GOOGLE_MAPS_PLACES_API_URL}/places:autocomplete`,
        ({ request, params, cookies }) => {
          return HttpResponse.json({
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
              {
                queryPrediction: {
                  text: {
                    text: 'pizza em Louisville, KY, EUA',
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
                      text: 'em Louisville, KY, EUA',
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
                    text: 'pizza em Londres, Reino Unido',
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
                      text: 'em Londres, Reino Unido',
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
                placePrediction: {
                  place: 'places/ChIJJQTxm9asypQRit65-YPgwQw',
                  placeId: 'ChIJJQTxm9asypQRit65-YPgwQw',
                  text: {
                    text: 'Pizza em Lavras MG - Mega Pizza - A melhor Pizza da Cidade - Rua José dos Réis Viléla - Retiro, Lavras - MG, Brasil',
                    matches: [
                      {
                        endOffset: 10,
                      },
                    ],
                  },
                  structuredFormat: {
                    mainText: {
                      text: 'Pizza em Lavras MG - Mega Pizza - A melhor Pizza da Cidade',
                      matches: [
                        {
                          endOffset: 10,
                        },
                      ],
                    },
                    secondaryText: {
                      text: 'Rua José dos Réis Viléla - Retiro, Lavras - MG, Brasil',
                    },
                  },
                  types: [
                    'pizza_restaurant',
                    'establishment',
                    'point_of_interest',
                    'restaurant',
                    'food',
                  ],
                },
              },
            ],
          });
        }
      )
    );

    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: 'pizza em l',
      });

    expect(response.status).toBe(200);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    server.use(
      http.post(
        `${process.env.GOOGLE_MAPS_PLACES_API_URL}/places:autocomplete`,
        ({ request, params, cookies }) => {
          return HttpResponse.json({
            error: {
              code: 400,
              message: 'input must be non-empty.\n',
              status: 'INVALID_ARGUMENT',
            },
          });
        }
      )
    );

    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);
  });
});
