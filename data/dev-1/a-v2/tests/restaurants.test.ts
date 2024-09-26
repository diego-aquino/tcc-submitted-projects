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
    const placeMockData = [
      {
        id: 'ChIJj6yD2340GQ0RM137RrwiBao',
        formattedAddress: 'R. Anchieta 15, 1200-224 Lisboa, Portugal',
        location: {
          latitude: 38.710197,
          longitude: -9.141077,
        },
        rating: 4.7,
        displayName: {
          text: 'Alma',
          languageCode: 'pt',
        },
      },
      {
        id: 'ChIJ-aZhRHU0GQ0RU45DdYW7dgg',
        formattedAddress: 'Calçada do Forte 22, 1100-256 Lisboa, Portugal',
        location: {
          latitude: 38.7136987,
          longitude: -9.1244447,
        },
        rating: 4.7,
        displayName: {
          text: 'Taberna Sal Grosso',
          languageCode: 'pt',
        },
      },
      {
        id: 'ChIJbeoKfIIzGQ0R9xAksm9Xpo4',
        formattedAddress: 'Av. da Liberdade 182 184, 1250-146 Lisboa, Portugal',
        location: {
          latitude: 38.720279999999995,
          longitude: -9.1449959,
        },
        rating: 4.5,
        displayName: {
          text: 'JNcQUOI Avenida',
          languageCode: 'pt-PT',
        },
      },
    ];

    const googleMapsSearchHandler = googleMapsInterceptor
      .post('/places:searchText')
      .respond({
        status: 200,
        body: {
          places: placeMockData,
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
    expect(body).toHaveLength(3);

    const restaurant = body[0];

    expect(restaurant.id).toBe(placeMockData[0].id);
    expect(restaurant.name).toBe(placeMockData[0].displayName.text);
    expect(restaurant.rating).toBe(placeMockData[0].rating);
    expect(restaurant.location.formattedAddress).toBe(
      placeMockData[0].formattedAddress
    );
  });

  test('caso 2: erro (4XX ou 5XX)', async () => {
    const googleMapsSearchHandler = googleMapsInterceptor
      .post('/places:searchText')
      .respond({
        status: 400,
      });

    const response = await supertest(app.server)
      .get('/places/restaurants')
      .query({
        query: 'Campina Grande, PB',
      });

    expect(response.status).toBe(500);
    expect(googleMapsSearchHandler.requests()).toHaveLength(1);
  });
});
