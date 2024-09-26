import axios, { AxiosInstance } from 'axios';
import { createAxiosErrorFromResponse } from '../../utils/axios';

type PlaceSearchStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'INVALID_REQUEST'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'UNKNOWN_ERROR';

export interface PlaceAutocompleteMatch {
  length: number;
  offset: number;
}

export interface PlaceAutocompleteTerm {
  offset: number;
  value: string;
}

export interface MatchOffset {
  startOffset?: number;
  endOffset: number;
}

export interface PlaceAutocompletePrediction {
  queryPrediction: {
    text: {
      text: string;
      matches: MatchOffset[];
    };
    structuredFormat: {
      mainText: {
        text: string;
        matches: MatchOffset[];
      };
      secondaryText: {
        text: string;
        matches: MatchOffset[];
      };
    };
  };
}

export interface PlaceAutocompleteResult {
  suggestions: PlaceAutocompletePrediction[];
}

export type SearchAutocompleteBody = {
  input: string;
  includeQueryPredictions: boolean;
  languageCode: string;
};

class GoogleMapsPlacesClient {
  private api: {
    places: AxiosInstance;
  };

  constructor() {
    this.api = {
      places: axios.create({
        baseURL: process.env.GOOGLE_MAPS_PLACES_API_URL,
      }),
    };
  }

  async autocomplete(partialQuery: string) {
    const body: SearchAutocompleteBody = {
      input: partialQuery,
      includeQueryPredictions: true,
      languageCode: 'pt-BR',
    };

    const response = await this.api.places.post<PlaceAutocompleteResult>(
      '/places:autocomplete',
      body
    );

    if (response.status !== 200) {
      throw createAxiosErrorFromResponse(response);
    }

    const { suggestions } = response.data;
    return suggestions;
  }
}

export default GoogleMapsPlacesClient;
