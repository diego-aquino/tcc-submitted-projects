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

export interface PlaceAutocompleteSuggestion {
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
    const startOffset = match.offset;
    const endOffset = startOffset + match.length;

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
    (suggestion): PlaceAutocompleteSuggestion => {
      const formattedText = formatAutocompleteText(
        suggestion.description,
        suggestion.matched_substrings,
      );

      return {
        text: suggestion.description,
        formattedText,
      };
    },
  );

  return reply.status(200).send(suggestions);
});

app.setErrorHandler(handleServerError);

export default app;
