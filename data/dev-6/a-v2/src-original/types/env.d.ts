declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: 'development' | 'test' | 'production';
        PORT: `${number}`;
        GOOGLE_MAPS_PLACES_API_URL: string;
        GOOGLE_MAPS_PLACES_OPENAPI_URL: string;
      }
    }
  }
}
