import { type HttpSchema } from 'zimic/http';

export interface ErrorMessage {
  message: string;
}

export type LocationCity = {
  id: string;
  name: string;
  stateName: string;
  stateCode: string;
  countryName: string;
  countryCode: string;
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
        200: { body: LocationCity[] };
        500: { body: ErrorMessage };
      };
    };
  };
}>;

export type DistanceSchema = HttpSchema<{
  '/cities/distances': {
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
