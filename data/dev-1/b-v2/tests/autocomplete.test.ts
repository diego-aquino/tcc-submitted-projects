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
import app from '../src/server/app';
import { server } from './setup';
import { PlaceAutocompleteResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';

describe('Autocomplete', () => {
  beforeAll(async () => {
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

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
    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: 'pizza em l',
      });

    expect(response.status).toBe(200);
    const body = response.body;

    expect(body).toHaveLength(2);
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    server.use(
      http.post(
        `${process.env.GOOGLE_MAPS_PLACES_API_URL}/places:autocomplete`,
        ({ request, params, cookies }) => {
          return HttpResponse.json<PlaceAutocompleteResult>(null, {
            status: 400,
          });
        }
      )
    );

    const response = await supertest(app.server)
      .get('/places/autocomplete')
      .query({
        query: 'pizza em l',
      });

    expect(response.status).toBe(500);
  });
});
