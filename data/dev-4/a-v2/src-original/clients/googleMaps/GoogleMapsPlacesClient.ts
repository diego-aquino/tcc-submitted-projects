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

export interface Display {
  text: string;
  languageCode: string;
}

export interface Place {
  id: string;
  formattedAddress: string;
  location: PlaceLocation;
  rating: number;
  displayName: Display;
}

/*export interface PlaceTextSearchResult {
  status: PlaceSearchStatus;
  results: Place[];
  html_attributions: string[];
  error_message?: string;
}*/

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

    if (!this.isSuccessSearchStatus(response.status)) {
      throw createAxiosErrorFromResponse(response);
    }

    const { places: places } = response.data;
    return places;
  }

  private isSuccessSearchStatus(status: number) {
    return status === 200;
  }
}

export default GoogleMapsPlacesClient;
