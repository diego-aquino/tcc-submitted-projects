import axios, { AxiosInstance } from 'axios';
import { createAxiosErrorFromResponse } from '../../utils/axios';

// export interface PlaceGeometry {
//   location: PlaceLocation;
//   viewport: {
//     northeast: PlaceLocation;
//     southwest: PlaceLocation;
//   };
// }

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
  formattedAddress: string;
  location: PlaceLocation;
  rating: number;
  displayName: DisplayName;
}

// type PlaceSearchStatus =
//   | 'OK'
//   | 'ZERO_RESULTS'
//   | 'INVALID_REQUEST'
//   | 'OVER_QUERY_LIMIT'
//   | 'REQUEST_DENIED'
//   | 'UNKNOWN_ERROR';

export interface PlaceTextSearchResult {
  places: Place[];
}

export interface GetRestaurantsQuery {
  textQuery: string;
  includedType: string;
  languageCode: string;
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

  async searchByText({
    textQuery,
    includedType,
    languageCode,
  }: GetRestaurantsQuery) {
    const response = await this.api.places.post<PlaceTextSearchResult>(
      'places:searchText',
      {
        textQuery,
        includedType,
        languageCode,
      }
    );

    const { places } = response.data;
    return places;
  }

  // private isSuccessSearchStatus(status: PlaceSearchStatus) {
  //   return status === 'OK' || status === 'ZERO_RESULTS';
  // }
}

export default GoogleMapsPlacesClient;
