import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';

interface RequestSuccess {
  distanceInKilometers: number;
  costInCents: number;
}

interface RequestError {
  message: string;
}

type ShippingSchema = HttpSchema<{
  '/cities/:originCityId/distances/cities/:destinationCityId': {
    GET: {
      response: {
        200: { body: RequestSuccess };
        400: { body: RequestError };
        404: { body: RequestError };
      };
    };
  };
}>;

const shippingInterceptor = httpInterceptor.create<ShippingSchema>({
  type: 'local',
  baseURL: 'https://v2-location-d8b1dd3.vercel.app',
  saveRequests: true,
});

beforeAll(async () => {
  await shippingInterceptor.start();
});

beforeEach(() => {});

afterEach(() => {
  shippingInterceptor.clear();
});

afterAll(async () => {
  await shippingInterceptor.stop();
});