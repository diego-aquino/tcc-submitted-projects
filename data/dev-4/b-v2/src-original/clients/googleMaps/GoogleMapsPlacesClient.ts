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
  endOffset: number;
  startOffset?: number;
}

export interface PlaceAutocompleteTerm {
  offset: number;
  value: string;
}

export interface PlaceAutocompleteText {
  text: string;
  matches: PlaceAutocompleteMatch[];
}

export interface PlaceAutocompleteStructuredFormat {
  mainText: {
    text: string;
    matches: PlaceAutocompleteMatch[];
  };
  secondaryText: {
    text: string;
    matches: PlaceAutocompleteMatch[];
  };
}

export interface PlaceAutocompleteQueryPrediction {
  text: PlaceAutocompleteText;
  structuredFormat: PlaceAutocompleteStructuredFormat;
}

export interface Suggestion {
  queryPrediction: PlaceAutocompleteQueryPrediction;
}

/*export interface PlaceAutocompletePrediction {
  description: string;
  matched_substrings: PlaceAutocompleteMatch[];
  structured_formatting: {
    main_text: string;
    main_text_matched_substrings: PlaceAutocompleteMatch[];
    secondary_text: string;
    secondary_text_matched_substrings: PlaceAutocompleteMatch[];
  };
  terms: PlaceAutocompleteTerm[];
}*/

export interface PlaceAutocompletePrediction {
  suggestions: Suggestion[];
}

/*export interface PlaceAutocompleteResult {
  status: PlaceSearchStatus;
  predictions: PlaceAutocompletePrediction[];
}*/

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
    const response = await this.api.places.post<PlaceAutocompletePrediction>('/places:autocomplete', {
      input: partialQuery,
      languageCode: 'pt-BR',
      includeQueryPredictions: true,
    });

    if (!this.isSuccessSearchStatus(response.status)) {
      throw createAxiosErrorFromResponse(response);
    }

    const { suggestions } = response.data;
    return suggestions;
  }

  private isSuccessSearchStatus(status: number) {
    return status === 200;
  }
}

export default GoogleMapsPlacesClient;
