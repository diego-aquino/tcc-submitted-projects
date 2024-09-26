import { type HttpSchema } from 'zimic/http';

interface User {
  username: string;
}

interface RequestError {
  message: string;
}

interface ConversionJob {
  id: string;
  state: string;
  inputFileName: string;
  inputFileFormat: string;
  outputFileName: string;
  outputFileFormat: string;
  createdAt: string;
  completedAt: string | null;
}

export type v1Schema = HttpSchema<{
  '/conversions': {
    POST: {
      request: {
        body: {
          inputFile: {
            name: string;
            format: string;
          };
          outputFile: {
            format: string;
          };
        };
      };
      response: {
        201: { body: ConversionJob };
        400: { body: RequestError }; // Bad request
        409: { body: RequestError }; // Conflict
      };
    };
  };
  '/conversions/:conversionId': {
    GET: {
      request: {};
      response: {
        200: { body: ConversionJob };
        400: { body: RequestError }; // Bad request
        401: { body: RequestError }; // Unauthorized
      };
    };
  };
}>;
