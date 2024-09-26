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

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  // Describe network behavior with request handlers.
  // Tip: move the handlers into their own module and
  // import it across your browser and Node.js setups!
  http.get(
    `${process.env.GOOGLE_MAPS_PLACES_API_URL}/queryautocomplete/json`,
    ({ request, params, cookies }) => {
      const url = new URL(request.url);
      const inputId = url.searchParams.get('input');

      if (inputId === '') {
        return HttpResponse.json({
          predictions: [],
          status: 'INVALID_REQUEST',
        });
      }

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
        ],
        status: 'OK',
      });
    }
  )
);

describe('Autocomplete', () => {
  beforeAll(async () => {
    await app.ready();
    server.listen();
  });

  beforeEach(async () => {
    server.resetHandlers();
  });

  afterEach(async () => {});

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
    const requests: Request[] = [];

    server.events.on('request:start', ({ request }) => {
      console.log('Outgoing:', request.method, request.url);
      if (request.url.startsWith(process.env.GOOGLE_MAPS_PLACES_API_URL)) {
        requests.push(request);
      }
    });

    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: 'pizza em l',
      });

    expect(response.status).toBe(200);

    expect(requests).toHaveLength(1);

    const url = new URL(requests[0].url);
    const inputId = url.searchParams.get('input');

    expect(inputId).toEqual('pizza em l');
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const requests: Request[] = [];

    server.events.on('request:start', ({ request }) => {
      console.log('Outgoing:', request.method, request.url);
      if (request.url.startsWith(process.env.GOOGLE_MAPS_PLACES_API_URL)) {
        requests.push(request);
      }
    });

    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);

    expect(requests).toHaveLength(1);

    const url = new URL(requests[0].url);
    const inputId = url.searchParams.get('input');

    expect(inputId).toEqual('');
  });
});
