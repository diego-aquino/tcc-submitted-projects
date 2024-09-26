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
      http.get(
        `${process.env.GOOGLE_MAPS_PLACES_API_URL}/queryautocomplete/json`,
        ({ request, params, cookies }) => {
          return HttpResponse.json({
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
              {
                description: 'pizza em Louisville, KY, EUA',
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
                  secondary_text: 'em Louisville, KY, EUA',
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
                    value: 'Louisville',
                  },
                  {
                    offset: 21,
                    value: 'KY',
                  },
                  {
                    offset: 25,
                    value: 'EUA',
                  },
                ],
              },
              {
                description: 'pizza em Londres, Reino Unido',
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
                  secondary_text: 'em Londres, Reino Unido',
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
                    value: 'Londres',
                  },
                  {
                    offset: 18,
                    value: 'Reino Unido',
                  },
                ],
              },
              {
                description:
                  'Pizza em Lavras MG - Mega Pizza - A melhor Pizza da Cidade - Rua José dos Réis Viléla - Retiro, Lavras - MG, Brasil',
                matched_substrings: [
                  {
                    length: 10,
                    offset: 0,
                  },
                ],
                place_id: 'ChIJJQTxm9asypQRit65-YPgwQw',
                reference: 'ChIJJQTxm9asypQRit65-YPgwQw',
                structured_formatting: {
                  main_text:
                    'Pizza em Lavras MG - Mega Pizza - A melhor Pizza da Cidade',
                  main_text_matched_substrings: [
                    {
                      length: 10,
                      offset: 0,
                    },
                  ],
                  secondary_text:
                    'Rua José dos Réis Viléla - Retiro, Lavras - MG, Brasil',
                },
                terms: [
                  {
                    offset: 0,
                    value:
                      'Pizza em Lavras MG - Mega Pizza - A melhor Pizza da Cidade',
                  },
                  {
                    offset: 61,
                    value: 'Rua José dos Réis Viléla',
                  },
                  {
                    offset: 88,
                    value: 'Retiro',
                  },
                  {
                    offset: 96,
                    value: 'Lavras',
                  },
                  {
                    offset: 105,
                    value: 'MG',
                  },
                  {
                    offset: 109,
                    value: 'Brasil',
                  },
                ],
                types: [
                  'restaurant',
                  'food',
                  'point_of_interest',
                  'establishment',
                ],
              },
            ],
            status: 'OK',
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
      http.get(
        `${process.env.GOOGLE_MAPS_PLACES_API_URL}/queryautocomplete/json`,
        ({ request, params, cookies }) => {
          return HttpResponse.json({
            predictions: [],
            status: 'INVALID_REQUEST',
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
