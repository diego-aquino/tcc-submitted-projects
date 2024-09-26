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
  startOffset?: number;
  endOffset: number;
}

export interface PlaceAutocompleteTerm {
  offset: number;
  value: string;
}

export interface PlaceAutocompletePrediction {
  queryPrediction: {
    text: {
      text: string;
      matches: PlaceAutocompleteMatch[];
    };
  };
}

export interface PlaceAutocompleteResult {
  suggestions: PlaceAutocompletePrediction[];
}

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
    const response = await this.api.places.post<PlaceAutocompleteResult>(
      '/places:autocomplete',
      {
        input: partialQuery,
        languageCode: 'pt-BR',
        includeQueryPredictions: true,
      }
    );

    const { suggestions } = response.data;
    return suggestions;
  }
}

export default GoogleMapsPlacesClient;
