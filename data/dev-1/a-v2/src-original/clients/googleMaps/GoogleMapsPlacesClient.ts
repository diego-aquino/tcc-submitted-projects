import axios, { AxiosInstance } from 'axios';
import { createAxiosErrorFromResponse } from '../../utils/axios';

export type PlaceLocation = {
  latitude: number;
  longitude: number;
};

export type PlaceGeometry = {
  location: PlaceLocation;
  viewport: {
    northeast: PlaceLocation;
    southwest: PlaceLocation;
  };
};

export type Place = {
  id: string;
  formattedAddress: string;
  location: PlaceLocation;
  rating: number;
  displayName: {
    text: string;
    languageCode: string;
  };
};

type PlaceSearchStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'INVALID_REQUEST'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'UNKNOWN_ERROR';

export type PlaceTextSearchResult = {
  places: Place[];
};

export type SearchPlaceBody = {
  textQuery: string;
  includedType: string;
  language: string;
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

  async searchByText(query: string, options: { includedType: string }) {
    const body: SearchPlaceBody = {
      textQuery: query,
      includedType: options.includedType,
      language: 'pt-BR',
    };

    const response = await this.api.places.post<PlaceTextSearchResult>(
      '/places:searchText',
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Fieldmask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
        },
      }
    );

    if (response.status === 500 || response.status === 400) {
      throw createAxiosErrorFromResponse(response);
    }

    const { places } = response.data;
    return places;
  }
}

export default GoogleMapsPlacesClient;
