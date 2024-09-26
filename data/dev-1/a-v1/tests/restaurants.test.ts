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

import app, { Restaurant } from '../src/server/app';
import { googleMapsInterceptor } from './zimic-interceptors';

describe('Restaurants', () => {
  beforeAll(async () => {
    await app.ready();
    await googleMapsInterceptor.start();
  });

  beforeEach(async () => {});

  afterEach(() => {
    googleMapsInterceptor.clear();
  });

  afterAll(async () => {
    await app.close();
    await googleMapsInterceptor.stop();
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
    const restaurantsMockData = [
      {
        formatted_address: '20 Sherwood St, London W1F 7ED, Reino Unido',
        geometry: {
          location: {
            lat: 51.5105561,
            lng: -0.1355974,
          },
          viewport: {
            northeast: {
              lat: 51.51199682989272,
              lng: -0.1342086701072778,
            },
            southwest: {
              lat: 51.50929717010727,
              lng: -0.1369083298927222,
            },
          },
        },
        name: 'Brasserie Zédel',
        place_id: 'ChIJl-cjD9QEdkgRVkkQt3pySRI',
        rating: 4.5,
      },
    ];

    const googleMapsSearchHandler = googleMapsInterceptor
      .get('/textsearch/json')
      .respond({
        status: 200,
        body: {
          html_attributions: ['hello'],
          status: 'OK',
          results: restaurantsMockData,
        },
      });

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Campina Grande, PB',
      });

    const body = response.body as Restaurant[];

    expect(googleMapsSearchHandler.requests()).toHaveLength(1);
    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);

    const restaurant = body[0];

    expect(restaurant.id).toBe(restaurantsMockData[0].place_id);
    expect(restaurant.name).toBe(restaurantsMockData[0].name);
    expect(restaurant.rating).toBe(restaurantsMockData[0].rating);
    expect(restaurant.location.formattedAddress).toBe(
      restaurantsMockData[0].formatted_address
    );
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const googleMapsSearchHandler = googleMapsInterceptor
      .get('/textsearch/json')
      .respond({
        status: 200,
        body: {
          html_attributions: [],
          status: 'INVALID_REQUEST',
          results: [],
        },
      });

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Campina Grande, PB',
      });

    expect(response.status).toBe(500);
  });
});
