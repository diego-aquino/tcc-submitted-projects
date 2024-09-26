import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { PlaceAutocompleteResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';

export const server = setupServer(
  http.get(
    `${process.env.GOOGLE_MAPS_PLACES_API_URL}/queryautocomplete/json`,
    ({ request, params, cookies }) => {
      return HttpResponse.json<PlaceAutocompleteResult>({
        status: 'OK',
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
        ],
      });
    }
  )
);

beforeAll(() => {
  server.listen();
});

beforeEach(() => {});

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
