import fastify from 'fastify';
import { z } from 'zod';

import { handleServerError } from './errors';
import GoogleMapsPlacesClient from '../clients/googleMaps/GoogleMapsPlacesClient';

const app = fastify({
  logger: process.env.NODE_ENV !== 'test',
  disableRequestLogging: process.env.NODE_ENV !== 'development',
});

const api = {
  googleMaps: {
    places: new GoogleMapsPlacesClient(),
  },
};

export interface RestaurantLocation {
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
}

export interface Restaurant {
  id: string;
  name?: string;
  rating?: number;
  location: RestaurantLocation;
}

const searchRestaurantsSchema = z.object({
  query: z.string(),
});

app.get('/places/restaurants', async (request, reply) => {
  const { query } = searchRestaurantsSchema.parse(request.query);

  const fullQuery = query ? `restaurantes em ${query}` : '';

  const places = await api.googleMaps.places.searchByText({
    textQuery: fullQuery,
    includedType: query ? 'restaurant' : '',
    languageCode: 'pt-BR',
  });

  const restaurants = places.map((place): Restaurant => {
    const location: RestaurantLocation = {
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      formattedAddress: place.formattedAddress,
    };

    return {
      id: place.id,
      name: place.displayName.text,
      rating: place.rating,
      location,
    };
  });

  restaurants.sort((restaurant, otherRestaurant) => {
    const rating = restaurant.rating ?? 0;
    const otherRating = otherRestaurant.rating ?? 0;
    return otherRating - rating;
  });

  return reply.status(200).send(restaurants);
});

app.setErrorHandler(handleServerError);

export default app;
