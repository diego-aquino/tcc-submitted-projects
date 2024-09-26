import axios, { AxiosInstance } from 'axios';
import { createAxiosErrorFromResponse } from '../../utils/axios';

export interface PlaceLocation {
  latitude: number;
  longitude: number;
}

export interface PlaceGeometry {
  location: PlaceLocation;
  viewport: {
    northeast: PlaceLocation;
    southwest: PlaceLocation;
  };
}

export interface Place {
  id: string;
  formattedAddress: string;
  location: PlaceLocation;
  rating?: number;
  displayName: {
    text: string;
    languageCode: string;
  };
}

type PlaceSearchStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'INVALID_REQUEST'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'UNKNOWN_ERROR';

export interface PlaceTextSearchResult {
  places: Place[];
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
    const response = await this.api.places.post<PlaceTextSearchResult>(
      '/places:searchText',
      {
        textQuery: query,
        includedType: options.type,
        languageCode: 'pt-BR',
      },
      {
        headers: {
          'X-Goog-Fieldmask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
        },
      }
    );

    const { places } = response.data;
    return places;
  }

  private isSuccessSearchStatus(status: PlaceSearchStatus) {
    return status === 'OK' || status === 'ZERO_RESULTS';
  }
}

export default GoogleMapsPlacesClient;
