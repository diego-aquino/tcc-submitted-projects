import { type JSONValue } from 'zimic';
import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';

import {
  PlaceTextSearchResult,
  SearchPlaceBody,
} from '../src/clients/googleMaps/GoogleMapsPlacesClient';

type MyServiceSchema = HttpSchema.Paths<{
  '/places:searchText': {
    POST: {
      response: {
        200: { body: PlaceTextSearchResult };
        400: {};
        500: {};
      };
      request: {
        body: SearchPlaceBody;
        headers: {
          'Content-Type': 'application/json';
          'X-Goog-Fieldmask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating';
        };
      };
    };
  };
}>;

export const googleMapsInterceptor = httpInterceptor.create<MyServiceSchema>({
  type: 'local',
  baseURL: process.env.GOOGLE_MAPS_PLACES_API_URL,
  saveRequests: true,
});
