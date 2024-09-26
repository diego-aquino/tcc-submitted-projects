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
  query: z.string().min(1),
});

app.get('/places/restaurants', async (request, reply) => {
  const { query } = searchRestaurantsSchema.parse(request.query);

  const fullQuery = `restaurantes em ${query}`;

  const places = await api.googleMaps.places.searchByText(fullQuery, {
    type: 'restaurant',
  });

  const restaurants = places.map((place): Restaurant => {
    const location: RestaurantLocation = {
      latitude: place.geometry?.location.lat,
      longitude: place.geometry?.location.lng,
      formattedAddress: place.formatted_address,
    };

    return {
      id: place.place_id,
      name: place.name,
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
