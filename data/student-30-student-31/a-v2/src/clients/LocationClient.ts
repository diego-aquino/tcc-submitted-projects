import axios, { AxiosInstance } from 'axios';

export interface LocationCity {
  id: string;
  name?: string;
  state: {
    name?: string;
    code?: string;
  };
  country: {
    name?: string;
    code?: string;
  };
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
    destinationCityId: string,
  ) {
    const response = await this.api.get<LocationDistance>(
      `/cities/${originCityId}/distances/cities/${destinationCityId}`,
    );

    const distance = response.data;
    return distance;
  }
}

export default LocationClient;
