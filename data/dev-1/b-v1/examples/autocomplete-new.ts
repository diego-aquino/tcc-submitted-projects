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

const outputFilePath = 'example-autocomplete-new.json';

runExample(request, baseURL, outputFilePath).catch((error) => {
  console.error(error);
  process.exit(1);
});
