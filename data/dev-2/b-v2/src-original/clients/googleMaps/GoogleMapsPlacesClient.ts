import axios, { AxiosInstance } from 'axios';
import { createAxiosErrorFromResponse } from '../../utils/axios';

type PlaceSearchStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'INVALID_REQUEST'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'UNKNOWN_ERROR';

export interface GetQueryParams {
  input: string;
  languageCode: string;
  includeQueryPredictions: boolean;
}

export interface PlaceAutocompleteMatch {
  endOffset: number;
  startOffset?: number;
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
    structuredFormat: {
      mainText: {
        text: string;
        matches: PlaceAutocompleteMatch[];
      };
      secondaryText: {
        text: string;
        matches: PlaceAutocompleteMatch[];
      };
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

  async autocomplete({
    includeQueryPredictions,
    input,
    languageCode,
  }: GetQueryParams) {
    const response = await this.api.places.post<PlaceAutocompleteResult>(
      '/places:autocomplete',
      {
        includeQueryPredictions,
        input,
        languageCode,
      }
    );

    const { suggestions } = response.data;
    return suggestions;
  }
}

export default GoogleMapsPlacesClient;
