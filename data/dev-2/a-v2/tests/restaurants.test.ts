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

const BASE_URL = process.env.GOOGLE_MAPS_PLACES_API_URL ?? '';

describe('Restaurants', () => {
  beforeAll(async () => {
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  afterAll(async () => {
    await app.close();
  });

  const server = setupServer(
    http.post(
      `${BASE_URL}/places:searchText`,
      ({ request, params, cookies }) => {
        const url = new URL(request.url);

        // const query = url.searchParams.get('query');
        // const type = url.searchParams.get('type');
        // const language = url.searchParams.get('language');
        // const radius = url.searchParams.get('radius');

        return HttpResponse.json({
          places: [
            {
              id: 'ChIJ3Qt2HU3LHg0RErFZs07tcZ0',
              formattedAddress:
                'Pavilhão Poente (ao lado do MAAT, Av. Brasília, 1300-598 Lisboa, Portugal',
              location: {
                latitude: 38.6963541,
                longitude: -9.191757299999999,
              },
              rating: 4.5,
              displayName: {
                text: 'SUD Lisboa',
                languageCode: 'pt-PT',
              },
            },
            {
              id: 'ChIJmUOQv5g0GQ0RQXio4tGUxDM',
              formattedAddress: 'R. do Olival 258, 1200-744 Lisboa, Portugal',
              location: {
                latitude: 38.704848999999996,
                longitude: -9.166345699999999,
              },
              rating: 4.8,
              displayName: {
                text: 'Come Prima',
                languageCode: 'pt',
              },
            },
          ],
        });
      }
    )
  );

  // Enable request interception.
  beforeAll(() => server.listen());

  // Reset handlers so that each test could alter them
  // without affecting other, unrelated tests.
  afterEach(() => server.resetHandlers());

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Campina Grande, PB',
      });

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 1: sucesso (2XX)', async () => {
    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Campina Grande, PB',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 'ChIJmUOQv5g0GQ0RQXio4tGUxDM',
        name: 'Come Prima',
        rating: 4.8,
        location: {
          latitude: 38.704848999999996,
          longitude: -9.166345699999999,
          formattedAddress: 'R. do Olival 258, 1200-744 Lisboa, Portugal',
        },
      },
      {
        id: 'ChIJ3Qt2HU3LHg0RErFZs07tcZ0',
        name: 'SUD Lisboa',
        rating: 4.5,
        location: {
          latitude: 38.6963541,
          longitude: -9.191757299999999,
          formattedAddress:
            'Pavilhão Poente (ao lado do MAAT, Av. Brasília, 1300-598 Lisboa, Portugal',
        },
      },
    ]);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    server.use(
      http.post(
        `${BASE_URL}/places:searchText`,
        ({ request, params, cookies }) => {
          const url = new URL(request.url);

          return HttpResponse.json({
            error: {
              code: 400,
              message: 'Empty text_query.\n',
              status: 'INVALID_ARGUMENT',
            },
          });
        }
      )
    );

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
  });
});
