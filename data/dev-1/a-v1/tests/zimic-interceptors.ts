import { type JSONValue } from 'zimic';
import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';

import { PlaceTextSearchResult } from '../src/clients/googleMaps/GoogleMapsPlacesClient';

type MyServiceSchema = HttpSchema.Paths<{
  '/textsearch/json': {
    GET: {
      response: {
        200: { body: PlaceTextSearchResult };
      };
    };
  };
}>;

export const googleMapsInterceptor = httpInterceptor.create<MyServiceSchema>({
  type: 'local',
  baseURL: process.env.GOOGLE_MAPS_PLACES_API_URL,
  saveRequests: true,
});
