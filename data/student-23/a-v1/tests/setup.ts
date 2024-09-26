import { afterAll, afterEach, Awaitable, beforeAll, beforeEach } from 'vitest';
import app from '../src/server/app';
import { CitiesSchema, DistanceSchema, LocationCity } from './types';
import { httpInterceptor } from 'zimic/interceptor/http';

export const citySchemaInterceptor = httpInterceptor.create<CitiesSchema>({
  type: 'local',
  baseURL: process.env.LOCATION_API_URL,
  saveRequests: true,
});

export const distanceSchemaInterceptor = httpInterceptor.create<DistanceSchema>(
  {
    type: 'local',
    baseURL: process.env.LOCATION_API_URL,
    saveRequests: true,
  }
);

export let saoPaulo: LocationCity[];
export let recife: LocationCity[];
export let campinaGrande: LocationCity[];
export let cidadeInexistente: LocationCity[];

export const beforeAllSetup = async (): Promise<void> => {
  await app.ready();
  await citySchemaInterceptor.start();
  await distanceSchemaInterceptor.start();

  saoPaulo = [
    {
      id: '10',
      name: 'São Paulo',
      stateName: 'São Paulo',
      stateCode: 'SP',
      countryName: 'Brasil',
      countryCode: 'BRA',
    },
  ];

  recife = [
    {
      id: '16',
      name: 'Recife',
      stateName: 'Recife',
      stateCode: 'PE',
      countryName: 'Brasil',
      countryCode: 'BRA',
    },
  ];

  campinaGrande = [
    {
      id: '30',
      name: 'Campina Grande',
      stateName: 'Campina Grande',
      stateCode: 'PB',
      countryName: 'Brasil',
      countryCode: 'BRA',
    },
  ];

  cidadeInexistente = [
    {
      id: '-20',
      name: 'XX',
      stateName: 'XX',
      stateCode: 'XX',
      countryName: 'XX',
      countryCode: 'XX',
    },
  ];
};

export const beforeEachSetup = async (): Promise<any> => {};

export const afterEachSetup = (): Awaitable<any> => {
  citySchemaInterceptor.clear();
  distanceSchemaInterceptor.clear();
};

export const afterAllSetup = (): Awaitable<any> => {
  app.close();
  citySchemaInterceptor.stop();
  distanceSchemaInterceptor.stop();
};
