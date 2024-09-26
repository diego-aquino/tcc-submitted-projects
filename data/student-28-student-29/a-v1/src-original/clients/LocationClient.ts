import axios, { AxiosInstance } from 'axios';

export interface LocationCity {
  id: string;
  name?: string;
  stateName?: string;
  stateCode?: string;
  countryName?: string;
  countryCode?: string;
}

export interface Res {
  distanceInKilometers: number;
  costInCents: number;
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
    //console.log(query);
    const response = await this.api.get<LocationCity[]>('/cities', {
      params: {
        query,
      },
    });

    const cities = response.data;
    //console.log(response.data);
    return cities;
  }

  async calculateDistanceBetweenCities(
    originCityId: string,
    destinationCityId: string
  ) {
    console.log(originCityId);
    console.log(destinationCityId);
    const response = await this.api.get<LocationDistance>('/cities/distances', {
      params: {
        originCityId,
        destinationCityId,
      },
    });

    const distance = response.data;
    return distance;
  }
}

export default LocationClient;
