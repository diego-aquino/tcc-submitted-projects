import axios, { AxiosInstance } from 'axios';
import { AutocompleteServiceComponents } from '../../../schema2';

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

export interface PlaceAutocompletePrediction {
  description: string;
  matched_substrings: PlaceAutocompleteMatch[];
  structured_formatting: {
    main_text: string;
    main_text_matched_substrings: PlaceAutocompleteMatch[];
    secondary_text: string;
    secondary_text_matched_substrings: PlaceAutocompleteMatch[];
  };
  terms: PlaceAutocompleteTerm[];
}

export interface PlaceAutocompleteResult {
  status: PlaceSearchStatus;
  predictions: PlaceAutocompletePrediction[];
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
    const response = await this.api.places.post<
      AutocompleteServiceComponents['schemas']['AutocompletePlacesResponse']
    >('/places:autocomplete', {
      input: partialQuery,
      languageCode: 'pt-BR',
      includeQueryPredictions: true,
    });

    const { suggestions } = response.data;
    return suggestions;
  }
}

export default GoogleMapsPlacesClient;
