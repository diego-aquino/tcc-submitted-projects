import axios, { AxiosInstance } from 'axios';
import { GooglePlacesOperations, GooglePlacesSchema } from './types.generated';
import { HttpSchemaPath } from 'zimic/http';

export interface PlaceLocation {
  latitude: number;
  longitude: number;
}

interface PlaceDisplayName {
  text: string;
  languageCode: string;
}

export interface Place {
  id: string;
  displayName: PlaceDisplayName;
  rating: number;
  location: PlaceLocation;
  formattedAddress: string;
}

export interface PlaceTextSearchResult {
  places: Place[];
}

export interface PlaceAutocompleteMatch {
  startOffset?: number;
  endOffset: number;
}

export interface PlaceAutocompleteTerm {
  text: string;
  matches: PlaceAutocompleteMatch[];
}

export interface PlaceAutocompletePrediction {
  text: PlaceAutocompleteTerm;
  structuredFormat: {
    mainText: PlaceAutocompleteTerm;
    secondaryText: PlaceAutocompleteTerm;
  };
}

export interface PlaceAutocompleteSuggestion {
  queryPrediction: PlaceAutocompletePrediction;
}

export interface PlaceAutocompleteResult {
  suggestions: PlaceAutocompleteSuggestion[];
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

  async searchByText(query: string, options: { type: string }) {
    const response = await this.api.places.post<PlaceTextSearchResult>(
      '/places:searchText' satisfies HttpSchemaPath<GooglePlacesSchema>,
      {
        textQuery: query,
        includedType: options.type,
        languageCode: 'pt-BR',
      } satisfies GooglePlacesOperations['Places_SearchText']['request']['body'],
      {
        headers: {
          'X-Goog-Fieldmask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
        },
      },
    );

    const { places } = response.data;
    return places;
  }

  async autocomplete(partialQuery: string) {
    const response = await this.api.places.post<PlaceAutocompleteResult>(
      '/places:autocomplete' satisfies HttpSchemaPath<GooglePlacesSchema>,
      {
        input: partialQuery,
        includeQueryPredictions: true,
        languageCode: 'pt-BR',
      } satisfies GooglePlacesOperations['Places_AutocompletePlaces']['request']['body'],
    );

    const { suggestions } = response.data;
    return suggestions;
  }
}

export default GoogleMapsPlacesClient;
