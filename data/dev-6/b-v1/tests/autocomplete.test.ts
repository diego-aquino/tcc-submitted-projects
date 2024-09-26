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
import { type AutocompleteServiceSchema } from '../schema';

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
      status: 'OK' as const,
    };

    const listHandler = interceptor
      .get('/queryautocomplete/json')
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
      predictions: [],
      status: 'INVALID_REQUEST' as const,
    };

    const mockedSuccessResponse = {
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
      status: 'OK' as const,
    };

    let listHandlerSuccess = interceptor
      .get('/queryautocomplete/json')
      .respond({ status: 200, body: mockedSuccessResponse });

    const listHandlerError = interceptor
      .get('/queryautocomplete/json')
      .with({
        searchParams: {
          input: '',
        },
      })
      .respond({ status: 200, body: mockedErrorResponse });

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
