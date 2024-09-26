import fastify from 'fastify';
import { z } from 'zod';

import { handleServerError } from './errors';
import GoogleMapsPlacesClient from '../clients/googleMaps/GoogleMapsPlacesClient';
import { AutocompleteServiceComponents } from '../../schema2';

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
  matches: AutocompleteServiceComponents['schemas']['Suggestion_StringRange'][]
) {
  const textAsArray = text.split('');

  for (const match of matches) {
    const startOffset = match.startOffset ?? 0;
    const endOffset = match.endOffset ?? 0;

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

  const suggestions = rawSuggestions?.map(
    (suggestion): PlaceAutocompleteSuggestion => {
      const formattedText = formatAutocompleteText(
        suggestion.queryPrediction?.text?.text ?? '',
        suggestion.queryPrediction?.text?.matches ?? []
      );

      return {
        text: suggestion.queryPrediction?.text?.text ?? '',
        formattedText,
      };
    }
  );

  return reply.status(200).send(suggestions);
});

app.setErrorHandler(handleServerError);

export default app;
