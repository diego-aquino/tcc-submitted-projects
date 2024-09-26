import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const baseUrl = process.env.LOCATION_API_URL;
const cities = [
  {
    id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDMwNjEy',
    name: 'São Paulo',
    state: {
      name: 'São Paulo',
      code: 'SP',
    },
    country: {
      name: 'Brasil',
      code: 'BRA',
    },
  },
  {
    id: 'aGVyZTpjbTpuYW1lZHBsYWNlOjIzMDMwNjEB',
    name: 'Campina Grande',
    state: {
      name: 'Paraíba',
      code: 'PB',
    },
    country: {
      name: 'Brasil',
      code: 'BRA',
    },
  },
];

export const LocationApiMock = setupServer(
  http.get(`${baseUrl}/cities`, ({ request }) => {
    const url = new URL(request.url);
    const queryParts = url.searchParams.get('query')?.split(', ');
    if (!queryParts) return HttpResponse.json([]);
    const cityName = queryParts[0];
    const cityState = queryParts[1];
    const result = cities.filter(
      (city) => city.name === cityName && city.state.code === cityState
    );
    return HttpResponse.json(result);
  }),
  http.get(
    `${baseUrl}/cities/:originCityId/distances/cities/:destinationCityId`,
    () => {
      return HttpResponse.json({
        kilometers: 145.3,
      });
    }
  )
);
