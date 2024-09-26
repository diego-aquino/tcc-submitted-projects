import { runExample } from './utils';

const baseURL = 'https://places-googleapis-proxy-xkh80emjtn.vercel.app/new';

const request = new Request(`${baseURL}/places:searchText`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Fieldmask':
      'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
  },
  body: JSON.stringify({
    textQuery: 'restaurantes em Lisboa',
    includedType: 'restaurant',
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
