import 'whatwg-fetch';

import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import interceptor from './interceptor/shareInterceptor';

// https://bit.ly/zimic-guides-testing
beforeAll(async () => {
  // Start intercepting requests
  // https://bit.ly/zimic-interceptor-http#http-interceptorstart
  await interceptor.start();
});

afterEach(() => {
  // Clear interceptors so that no tests affect each other
  // https://bit.ly/zimic-interceptor-http#http-interceptorclear
  interceptor.clear();
});

afterAll(async () => {
  // Stop intercepting requests
  // https://bit.ly/zimic-interceptor-http#http-interceptorstop
  await interceptor.stop();
});
