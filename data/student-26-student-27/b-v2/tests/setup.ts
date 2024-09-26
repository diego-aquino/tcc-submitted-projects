import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { type HttpSchema } from 'zimic/http';
import { httpInterceptor } from 'zimic/interceptor/http';

const CONVERSION_API_URL = process.env.CONVERSION_API_URL;

export interface ConversionRequest {
  inputFile: {
    name: string;
    format: string;
  };
  outputFile: {
    format: string;
  };
}

export interface ConversionResponse {
  id: string;
  state: 'PENDING' | 'COMPLETED' | 'ERROR';
  inputFile: {
    name: string;
    format: string;
  };
  outputFile: {
    name: string;
    format: string;
  };
  createdAt: string;
  completedAt: string | null;
}

export interface ValidationError {
  message: string;
  issues: [
    {
      message: string;
      code: string;
      path: [string, number];
      additionalProp1: {};
    }
  ];
}

interface RequestError {
  message: string;
}

interface RequestIdError {
  message: string;
}

type ConversionSchema = HttpSchema<{
  '/conversions': {
    POST: {
      request: { body: ConversionRequest };
      response: {
        202: { body: ConversionResponse };
        400: { body: ValidationError };
        500: { body: RequestError };
      };
    };
  };
  '/conversions/{conversionId}': {
    GET: {
      request: {
        searchParams: { conversionId: string };
      };
      response: {
        200: { body: ConversionResponse };
        404: { body: RequestIdError };
        500: { body: RequestError };
      };
    };
  };
}>;

export const myInterceptor = httpInterceptor.create<ConversionSchema>({
  type: 'local',
  baseURL: CONVERSION_API_URL,
  saveRequests: true,
});

beforeAll(async () => {
  await myInterceptor.start();
});

afterEach(() => {
  myInterceptor.clear();
});

afterAll(async () => {
  await myInterceptor.stop();
});
