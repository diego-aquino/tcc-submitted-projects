import axios, { AxiosInstance } from 'axios';
import { createAxiosErrorFromResponse } from '../../utils/axios';

export interface PlaceLocation {
  lat: number;
  lng: number;
}

export interface PlaceGeometry {
  location: PlaceLocation;
  viewport: {
    northeast: PlaceLocation;
    southwest: PlaceLocation;
  };
}

export interface Place {
  place_id: string;
  name?: string;
  rating?: number;
  geometry?: PlaceGeometry;
  formatted_address?: string;
}

type PlaceSearchStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'INVALID_REQUEST'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'UNKNOWN_ERROR';

export interface PlaceTextSearchResult {
  status: PlaceSearchStatus;
  results: Place[];
  html_attributions: string[];
  error_message?: string;
}

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

  async searchByText(query: string, options: { type?: string }) {
    const response = await this.api.places.get<PlaceTextSearchResult>(
      '/textsearch/json',
      {
        params: {
          query,
          type: options.type,
          language: 'pt-BR',
          radius: 10000,
        },
      },
    );

    if (!this.isSuccessSearchStatus(response.data.status)) {
      throw createAxiosErrorFromResponse(response);
    }

    const { results: places } = response.data;
    return places;
  }

  async autocomplete(partialQuery: string) {
    const response = await this.api.places.get<PlaceAutocompleteResult>(
      '/queryautocomplete/json',
      {
        params: {
          input: partialQuery,
          language: 'pt-BR',
          radius: 10000,
        },
      },
    );

    if (!this.isSuccessSearchStatus(response.data.status)) {
      throw createAxiosErrorFromResponse(response);
    }

    const { predictions } = response.data;
    return predictions;
  }

  private isSuccessSearchStatus(status: PlaceSearchStatus) {
    return status === 'OK' || status === 'ZERO_RESULTS';
  }
}

export default GoogleMapsPlacesClient;
