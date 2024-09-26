import { runExample } from './utils';

const baseURL = 'https://places-googleapis-proxy-xkh80emjtn.vercel.app/new';

const request = new Request(`${baseURL}/places:autocomplete`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: 'pizza em l',
    includeQueryPredictions: true,
    languageCode: 'pt-BR',
  }),
});

const outputPath = 'example-new-success.json';

runExample({
  request,
  baseURL,
  outputPath,
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
