import axios, { AxiosInstance } from 'axios';

export interface LocationState {
  name: string;
  code: string;
}

export interface LocationCountry {
  name: string;
  code: string;
}

export interface LocationCity {
  id: string;
  name?: string;
  state?: LocationState;
  country?: LocationCountry;
}

export interface LocationDistance {
  kilometers: number;
}

class LocationClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.LOCATION_API_URL,
    });
  }

  async searchCities(query: string) {
    const response = await this.api.get<LocationCity[]>('/cities', {
      params: {
        query,
      },
    });

    const cities = response.data;
    return cities;
  }

  async calculateDistanceBetweenCities(
    originCityId: string,
    destinationCityId: string
  ) {
    const response = await this.api.get<LocationDistance>(
      `/cities/${originCityId}/distances/cities/${destinationCityId}`,
      {
        params: {
          originCityId,
          destinationCityId,
        },
      }
    );

    const distance = response.data;
    return distance;
  }
}

export default LocationClient;
