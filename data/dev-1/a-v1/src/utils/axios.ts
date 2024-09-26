import { AxiosError, AxiosResponse } from 'axios';

export function createAxiosErrorFromResponse(response: AxiosResponse) {
  return new AxiosError(
    `Request failed with status code ${response.status}`,
    response.statusText,
    response.config,
    response.request,
    response,
  );
}
