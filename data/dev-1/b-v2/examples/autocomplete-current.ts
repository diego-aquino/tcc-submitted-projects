import { runExample } from './utils';

const baseURL = 'https://places-googleapis-proxy-xkh80emjtn.vercel.app/current';

const searchParams = new URLSearchParams({
  input: 'pizza em l',
  language: 'pt-BR',
  radius: '10000',
});

const request = new Request(
  `${baseURL}/queryautocomplete/json?${searchParams}`,
  { method: 'GET' },
);

const outputFilePath = 'example-autocomplete-current.json';

runExample(request, baseURL, outputFilePath).catch((error) => {
  console.error(error);
  process.exit(1);
});
