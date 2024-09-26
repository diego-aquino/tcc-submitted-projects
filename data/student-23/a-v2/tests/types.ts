import { type HttpSchema } from 'zimic/http';

export interface ErrorMessage {
  message: string;
}

export type LocationCity = {
  id: string;
  name: string;
  state: {
    name: string;
    code: string;
  };
  country: {
    name: string;
    code: string;
  };
};

export type LocationDistance = {
  kilometers: number;
};

export type CitiesSchema = HttpSchema<{
  '/cities': {
    GET: {
      request: {
        searchParams: { query: string };
      };
      response: {
        200: {
          body: Array<{
            id: string;
            name?: string;
            state?: {
              name: string;
              code: string;
            };
            country?: {
              name: string;
              code: string;
            };
          }>;
        };
        500: { body: ErrorMessage };
      };
    };
  };
}>;

export type DistanceSchema = HttpSchema<{
  '/cities/:originCityId/distances/cities/:destinationCityId': {
    GET: {
      request: {
        searchParams: {
          originCityId: string;
          destinationCityId: string;
        };
      };
      response: {
        200: { body: LocationDistance };
        500: { body: ErrorMessage };
      };
    };
  };
}>;
