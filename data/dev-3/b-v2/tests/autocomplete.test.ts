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
  http.post(
    `${process.env.GOOGLE_MAPS_PLACES_API_URL}/places:autocomplete`,
    async ({ request, params, cookies }) => {
      const url = new URL(request.url);

      const body = await request.clone().json();

      if (body.input === '') {
        return HttpResponse.json({
          error: {
            code: 400,
            message: 'input must be non-empty.\n',
            status: 'INVALID_ARGUMENT',
          },
        });
      }

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
        ],
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

    const request = requests[0];
    const url = new URL(requests[0].url);
    const body = await request.json();
    expect(body).toEqual({
      input: 'pizza em l',
      languageCode: 'pt-BR',
      includeQueryPredictions: true,
    });
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

    const request = requests[0];
    const body = await request.json();
    expect(body).toEqual({
      input: '',
      languageCode: 'pt-BR',
      includeQueryPredictions: true,
    });
  });
});
