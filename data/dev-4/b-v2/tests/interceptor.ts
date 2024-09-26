import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';
import { PlaceAutocompleteResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';

export type PlaceAutocompleteRequestSchema = HttpSchema<{
  '/places:autocomplete': {
    POST: {
      request: {
        body: {
          input: string;
          languageCode: string;
          includeQueryPredictions: boolean;
        };
      };
      response: {
        200: { body: PlaceAutocompleteResult };
        400: {
          body: {
            error: {
              code: number;
              message: string;
              status: string;
            };
          };
        };
      };
    };
  };
}>;

export const placeAutocompleteRequestInterceptor = httpInterceptor.create<PlaceAutocompleteRequestSchema>({
  type: 'local',
  baseURL: process.env.GOOGLE_MAPS_PLACES_API_URL,
  saveRequests: true, // Allow access to `handler.requests()`
});
