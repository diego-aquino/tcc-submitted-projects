import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { PlaceAutocompleteResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';

export const server = setupServer(
  http.post(
    `${process.env.GOOGLE_MAPS_PLACES_API_URL}/places:autocomplete`,
    ({ request, params, cookies }) => {
      return HttpResponse.json<PlaceAutocompleteResult>({
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

beforeAll(() => {
  server.listen();
});

beforeEach(() => {});

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
