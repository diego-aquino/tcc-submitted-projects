# Autocomplete de Locais - Aplicando Mocks de API

Esta aplicação permite autocompletar textos de busca de locais, fornecendo
sugestões com a
[Places API do Google Maps](https://developers.google.com/maps/documentation/places/web-service).

## 1. Acesso

[![Abrir no Stackblitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/diego-aquino/api-mocking-app-autocomplete?startScript=dev&file=README.md)

## 2. Projeto

Arquivos importantes:

- [`src/server/app.ts`](./src/server/app.ts): arquivo principal da aplicação,
  onde o servidor está implementado.
- [`src/clients/GoogleMapsPlacesClient.ts`](./src/clients/googleMaps/GoogleMapsPlacesClient.ts):
  classe que faz as chamadas HTTP para a Places API.
- [`tests/autocomplete.test.ts`](./tests/autocomplete.test.ts): arquivo para os
  testes do autocomplete de locais.

Comandos úteis:

- `npm install`: instala as **dependências** do projeto.
- `npm run dev`: inicia o **servidor** em modo de desenvolvimento.
- `npm run test`: executa os **testes** da aplicação em modo watch.
- `npm run types:check`: verifica se há **erros de tipo** no código.

Ferramentas de mock:

- **MSW**: https://github.com/mswjs/msw
- **Zimic**: https://github.com/zimicjs/zimic/wiki

## 3. Places API do Google Maps

- Documentação OpenAPI:
  - Versão atual:
    [`openapi.yaml`](https://gist.githubusercontent.com/diego-aquino/21b772332f2455a827166ac3b64db052/raw/b9aed7f76a91bf216cee5fb37fe2fd1e0d959c80/google-maps-places-api-current.openapi.yaml)
    ([Visualizar no Swagger UI](https://editor-next.swagger.io/?url=https://gist.githubusercontent.com/diego-aquino/21b772332f2455a827166ac3b64db052/raw/b9aed7f76a91bf216cee5fb37fe2fd1e0d959c80/google-maps-places-api-current.openapi.yaml))
  - Versão nova:
    [`openapi.yaml`](https://gist.githubusercontent.com/diego-aquino/a0554434e8ac73ece2f5d787727b227f/raw/b9a8cac11b2f186130ba72379d52ba142ba4a2f7/google-maps-places-api-new.openapi.yaml)
    ([Visualizar no Swagger UI](https://editor-next.swagger.io/?url=https://gist.githubusercontent.com/diego-aquino/a0554434e8ac73ece2f5d787727b227f/raw/b9a8cac11b2f186130ba72379d52ba142ba4a2f7/google-maps-places-api-new.openapi.yaml))

### 3.1. Query Autocomplete

- [Documentação](https://developers.google.com/maps/documentation/places/web-service/query)
  - [Códigos de status](https://developers.google.com/maps/documentation/places/web-service/query#PlacesAutocompleteStatus)

Exemplos de requisição:

- Sucesso
  ```bash
  npm run example current success
  ```
- Erro
  ```bash
  npm run example current error
  ```

### 3.2. Autocomplete (New)

- [Documentação](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete)
- [Guia de migração](https://developers.google.com/maps/documentation/places/web-service/migrate-autocomplete)

Exemplos de requisição:

- Sucesso
  ```bash
  npm run example new success
  ```
- Erro
  ```bash
  npm run example new error
  ```
