import axios, { AxiosInstance } from 'axios';
import { createAxiosErrorFromResponse } from '../../utils/axios';

export type PlaceLocation = {
  lat: number;
  lng: number;
};

export type PlaceGeometry = {
  location: PlaceLocation;
  viewport: {
    northeast: PlaceLocation;
    southwest: PlaceLocation;
  };
};

export type Place = {
  place_id: string;
  name?: string;
  rating?: number;
  geometry?: PlaceGeometry;
  formatted_address?: string;
};

type PlaceSearchStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'INVALID_REQUEST'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'UNKNOWN_ERROR';

export type PlaceTextSearchResult = {
  status: PlaceSearchStatus;
  html_attributions: string[];
  results: Place[];
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

  async searchByText(query: string, options: { type: string }) {
    const response = await this.api.places.get<PlaceTextSearchResult>(
      '/textsearch/json',
      {
        params: {
          query,
          type: options.type,
          language: 'pt-BR',
          radius: 10000,
        },
      }
    );

    if (!this.isSuccessSearchStatus(response.data.status)) {
      throw createAxiosErrorFromResponse(response);
    }

    const { results: places } = response.data;
    return places;
  }

  private isSuccessSearchStatus(status: PlaceSearchStatus) {
    return status === 'OK' || status === 'ZERO_RESULTS';
  }
}

export default GoogleMapsPlacesClient;
