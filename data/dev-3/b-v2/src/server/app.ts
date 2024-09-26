import fastify from 'fastify';
import { z } from 'zod';

import { handleServerError } from './errors';
import GoogleMapsPlacesClient, {
  PlaceAutocompleteMatch,
} from '../clients/googleMaps/GoogleMapsPlacesClient';

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

  const places = await api.googleMaps.places.searchByText(fullQuery, {
    type: query ? 'restaurant' : '',
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

export interface AutocompleteSuggestion {
  text: string;
  formattedText: string;
}

const autocompleteSchema = z.object({
  query: z.string(),
});

/**
 * Esta função formata um texto acrescentando '**' em volta das correspondências.
 *
 * @example
 *  formatAutocompleteText(
 *    'Museu de Arte',
 *    [{ offset: 0, length: 3 }, { offset: 9, length: 1 }]
 *  ); // '**Mus**eu de **A**rte'
 */
function formatAutocompleteText(
  text: string,
  matches: PlaceAutocompleteMatch[],
) {
  const textAsArray = text.split('');

  for (const match of matches) {
    const startOffset = match.startOffset ?? 0;
    const endOffset = match.endOffset;

    const startIndex = startOffset;
    textAsArray[startIndex] = `**${textAsArray[startIndex]}`;

    const endIndex = endOffset - 1;
    textAsArray[endIndex] = `${textAsArray[endIndex]}**`;
  }

  return textAsArray.join('');
}

app.get('/places/autocomplete', async (request, reply) => {
  const { query } = autocompleteSchema.parse(request.query);

  const rawSuggestions = await api.googleMaps.places.autocomplete(query);

  const suggestions = rawSuggestions.map(
    (suggestion): AutocompleteSuggestion => {
      const formattedText = formatAutocompleteText(
        suggestion.queryPrediction.text.text,
        suggestion.queryPrediction.text.matches,
      );

      return {
        text: suggestion.queryPrediction.text.text,
        formattedText,
      };
    },
  );

  return reply.status(200).send(suggestions);
});

app.setErrorHandler(handleServerError);

export default app;
