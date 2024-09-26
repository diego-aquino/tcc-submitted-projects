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
import { RequestBody } from '../src/clients/googleMaps/GoogleMapsPlacesClient';

const server = setupServer(
  // Describe network behavior with request handlers.
  // Tip: move the handlers into their own module and
  // import it across your browser and Node.js setups!
  http.post(
    process.env.GOOGLE_MAPS_PLACES_API_URL + '/places:searchText',
    async ({ request, params, cookies }) => {
      const { textQuery, includedType } = (await request.json()) as RequestBody;

      let response;

      if (includedType == 'restaurant' && textQuery != '') {
        response = {
          places: [
            {
              id: 'teste',
              formattedAddress: 'R. do Olival 258, 1200-744 Lisboa, Portugal',
              location: {
                latitude: 38.704848999999996,
                longitude: -9.166345699999999,
              },
              rating: 4.2,
              displayName: {
                text: 'Come Prima',
                languageCode: 'pt',
              },
            },
            {
              id: 'ChIJcVPiRjk1GQ0R4E4ckO3whcA',
              formattedAddress: 'R. da Atalaia 31, 1200-037 Lisboa, Portugal',
              location: {
                latitude: 38.7118452,
                longitude: -9.1449444,
              },
              rating: 4.8,
              displayName: {
                text: 'A Nossa Casa',
                languageCode: 'pt',
              },
            },
          ],
        };
      } else if (includedType == 'restaurant' && textQuery == '') {
        response = {
          error: {
            code: 400,
            message: 'Empty text_query test.\n',
            status: 'INVALID_ARGUMENT',
          },
        };
      }

      return HttpResponse.json(response);
    }
  )
);

describe('Restaurants', () => {
  beforeAll(async () => {
    server.listen();
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    server.resetHandlers();
  });

  afterAll(async () => {
    server.close();
    await app.close();
  });

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
        query: 'London',
      });
    console.log(response.body);

    expect(response.status).toBe(200);
    expect(response.body.length).not.toBe(0);
    expect(response.body[0].rating).toBeGreaterThan(response.body[1].rating);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: '',
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});
