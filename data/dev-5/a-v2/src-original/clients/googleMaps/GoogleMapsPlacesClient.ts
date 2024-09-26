import axios, { AxiosInstance } from 'axios';
import { createAxiosErrorFromResponse } from '../../utils/axios';

export interface PlaceLocation {
  latitude: number;
  longitude: number;
}

export interface DisplayName {
  text: string;
  languageCode: string;
}

export interface Place {
  id: string;
  formattedAddress?: string;
  location: PlaceLocation;
  rating?: number;
  displayName?: DisplayName;
}

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
      }
    );

    const { places } = response.data;
    return places;
  }
}

export default GoogleMapsPlacesClient;
