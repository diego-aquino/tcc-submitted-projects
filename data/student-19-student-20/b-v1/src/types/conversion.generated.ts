// Auto-generated by zimic.
// NOTE: Do not manually edit this file. Changes will be overridden.

import type {
  HttpSchema,
  HttpStatusCode,
  MergeHttpResponsesByStatusCode,
} from 'zimic/http';

export type ConversionSchema = HttpSchema.Paths<{
  '/conversions': {
    /** Criar uma conversão */
    POST: ConversionOperations['conversions/create'];
  };
  '/conversions/:conversionId': {
    /** Obter os detalhes de uma conversão */
    GET: ConversionOperations['conversions/getById'];
  };
}>;

export interface ConversionComponents {
  schemas: {
    Conversion: {
      /**
       * @description O identificador da conversão
       * @example pfh0haxfpzowht3oi213cqos
       */
      id: string;
      /**
       * @description O estado da conversão:
       *     - PENDING: conversão pendente;
       *     - COMPLETED: conversão concluída;
       *     - ERROR: conversão com erro.
       *
       * @example PENDING
       * @enum {string}
       */
      state: 'PENDING' | 'COMPLETED' | 'ERROR';
      /**
       * @description O nome do arquivo
       * @example file.docx
       */
      inputFileName: string;
      /**
       * @description O formato original do arquivo
       * @example docx
       */
      inputFileFormat: string;
      /**
       * @description O nome do arquivo convertido
       * @example file.pdf
       */
      outputFileName: string;
      /**
       * @description O formato do arquivo convertido
       * @example pdf
       */
      outputFileFormat: string;
      /**
       * Format: date-time
       * @description A data e hora de criação da conversão
       * @example 2021-08-01T12:00:00Z
       */
      createdAt: string;
      /**
       * Format: date-time
       * @description A data e hora da finalização da conversão
       * @example 2021-08-01T12:00:00Z
       */
      completedAt: string | null;
    };
    ValidationError: {
      /**
       * @description A mensagem de erro
       * @example Validation error
       */
      message: string;
      /** @description Os problemas de validação */
      issues?: {
        /**
         * @description A mensagem de erro
         * @example Invalid input: expected string, received number
         */
        message?: string;
        /**
         * @description O código do erro
         * @example invalid_type
         */
        code?: string;
        /**
         * @description O caminho do erro
         * @example [
         *       "names",
         *       1
         *     ]
         */
        path?: (string | number)[];
        [key: string]: any;
      }[];
    };
    NotFoundError: {
      /**
       * @description A mensagem de erro
       * @example Not found
       */
      message: string;
    };
    InternalServerError: {
      /**
       * @description A mensagem de erro
       * @example Internal server error
       */
      message: string;
    };
  };
}

export interface ConversionOperations {
  'conversions/create': HttpSchema.Method<{
    request: {
      body: {
        inputFile: {
          /**
           * @description O nome do arquivo
           * @example file.docx
           */
          name: string;
          /**
           * @description O formato original do arquivo; se não fornecido, será inferido a partir da extensão do nome do arquivo
           * @example docx
           */
          format?: string;
        };
        outputFile: {
          /**
           * @description O formato desejado do arquivo
           * @example pdf
           */
          format: string;
        };
      };
    };
    response: MergeHttpResponsesByStatusCode<
      [
        {
          /** @description Conversão aceita */
          202: {
            body: ConversionComponents['schemas']['Conversion'];
          };
          /** @description Erro de validação */
          400: {
            body: ConversionComponents['schemas']['ValidationError'];
          };
        },
        {
          /** @description Erro inesperado */
          [StatusCode in HttpStatusCode.ServerError]: {
            body: ConversionComponents['schemas']['InternalServerError'];
          };
        },
      ]
    >;
  }>;
  'conversions/getById': HttpSchema.Method<{
    response: MergeHttpResponsesByStatusCode<
      [
        {
          /** @description Conversão encontrada */
          200: {
            body: ConversionComponents['schemas']['Conversion'];
          };
          /** @description Não encontrado */
          404: {
            body: ConversionComponents['schemas']['NotFoundError'];
          };
        },
        {
          /** @description Erro inesperado */
          [StatusCode in HttpStatusCode.ServerError]: {
            body: ConversionComponents['schemas']['InternalServerError'];
          };
        },
      ]
    >;
  }>;
}
