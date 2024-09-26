import { runExample } from './utils';

const baseURL = 'https://places-googleapis-proxy-xkh80emjtn.vercel.app/current';

const searchParams = new URLSearchParams({
  query: 'restaurantes em Londres',
  type: 'restaurant',
  language: 'pt-BR',
  radius: '10000',
});

const request = new Request(`${baseURL}/textsearch/json?${searchParams}`, {
  method: 'GET',
});

const outputPath = 'example-current-success.json';

runExample({
  request,
  baseURL,
  outputPath,
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
