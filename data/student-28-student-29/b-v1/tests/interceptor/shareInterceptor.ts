import { httpInterceptor } from 'zimic/interceptor/http';
import { type HttpSchema } from 'zimic/http';

import ConversionClient from '../../src/clients/ConversionClient';

export interface Parametros {
  name: String;
  mode: String;
  convertTo?: String;
}

interface RequestError {
  message: String;
}

type MeuSchema = HttpSchema<{
  '/shares/files': {
    POST: {
      request: { body: Parametros };
      response: {
        200: { body: ConversionClient }; // User create
        400: { body: RequestError }; // Bad request
        409: { body: RequestError }; // Conflict
      };
    };
  };
}>;

const interceptor = httpInterceptor.create<MeuSchema>({
  type: 'local',
  baseURL:
    'https://githubtvzyan-stbj--3000--c4712070.local-corp.webcontainer.io',
  saveRequests: true,
});

export default interceptor;
