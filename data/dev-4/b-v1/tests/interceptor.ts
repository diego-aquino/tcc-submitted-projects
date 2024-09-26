import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';
import { PlaceAutocompleteResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';

export type PlaceAutocompleteRequestSchema = HttpSchema<{
  '/queryautocomplete/json': {
    GET: {
      request: {
        searchParams: { input?: string; language?: string; radius?: number };
      };
      response: {
        200: { body: PlaceAutocompleteResult };
      };
    };
  };
}>;

export const placeAutocompleteRequestInterceptor = httpInterceptor.create<PlaceAutocompleteRequestSchema>({
  type: 'local',
  baseURL: process.env.GOOGLE_MAPS_PLACES_API_URL,
  saveRequests: true, // Allow access to `handler.requests()`
});
