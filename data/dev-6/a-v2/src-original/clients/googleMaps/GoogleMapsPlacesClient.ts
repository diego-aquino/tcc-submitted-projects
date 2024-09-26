import axios, { AxiosInstance } from 'axios';
import { createAxiosErrorFromResponse } from '../../utils/axios';

export interface PlaceLocation {
  latitude: number;
  longitude: number;
}

export interface PlaceName {
  text: string;
  languageCode: string;
}

export interface Place {
  id: string;
  displayName?: PlaceName;
  rating?: number;
  location?: PlaceLocation;
  formattedAddress?: string;
}

export interface PlaceTextSearchResultError {
  error: Error;
}

export interface RequestBody {
  textQuery: string;
  includedType: string;
  languageCode: string;
}

export interface Error {
  message?: string;
  status?: string;
  code?: number;
}

export interface PlaceTextSearchResultSuccess {
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
    const response = await this.api.places.post<PlaceTextSearchResultSuccess>(
      '/places:searchText',
      {
        textQuery: query,
        includedType: 'restaurant',
        languageCode: 'pt-BR',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Fieldmask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
        },
      }
    );

    const { places } = response.data;
    return places;
  }
}

export default GoogleMapsPlacesClient;
