import { FastifyRequest, FastifyReply, fastify } from 'fastify';
import crypto from 'crypto';
import { z } from 'zod';
import ConversionClient, { Conversion } from '../clients/ConversionClient';
import { handleServerError } from './errors';
import { waitForDelay } from '../utils/time';

const app = fastify({
  logger: process.env.NODE_ENV !== 'test',
  disableRequestLogging: process.env.NODE_ENV !== 'development',
});

interface ConversionRequest {
  inputFile: {
    name: string;
    format?: string;
  };
  outputFile: {
    format: string;
  };
}

interface ValidationError {
  message: string;
  issues: [
    {
      message: string;
      code: string;
      path: [string, number];
      additionalProp1?: any;
    }
  ];
}

const api = {
  conversion: new ConversionClient(),
};

const CONVERSION_POOLING_INTERVAL = 100;

const shareFileSchema = z.object({
  name: z.string().min(1),
  mode: z.enum(['public', 'private']).default('public'),
  convertTo: z.string().optional(),
});

export type ShareFileQuery = z.infer<typeof shareFileSchema>;

app.post('/shares/files', async (request, reply) => {
  const { name, mode, convertTo } = shareFileSchema.parse(request.body);

  let conversion: Conversion | undefined;

  if (convertTo) {
    conversion = await api.conversion.createConversion(name, convertTo);

    while (conversion.state !== 'COMPLETED') {
      if (conversion.state === 'ERROR') {
        return reply.status(500).send({
          message: 'Error converting file',
        });
      }

      await waitForDelay(CONVERSION_POOLING_INTERVAL);
      conversion = await api.conversion.getConversionById(conversion.id);
    }
  }

  const sharedFileId = crypto.randomUUID();

  const sharedFileName =
    conversion === undefined ? name : conversion.outputFileName;

  const originalFile =
    conversion === undefined ? undefined : { name: conversion.inputFileName };

  return reply.status(200).send({
    id: sharedFileId,
    name: sharedFileName,
    mode,
    originalFile,
  });
});

app.get('/conversions/:conversionId', async (request, reply) => {
  const { conversionId } = request.params as { conversionId: string };

  try {
    const conversion = await api.conversion.getConversionById(conversionId);
    return reply.status(200).send(conversion);
  } catch (error) {
    return reply.status(500).send({
      message: 'Internal server error',
    });
  }
});

app.post(
  '/conversions',
  async (
    request: FastifyRequest<{ Body: ConversionRequest }>,
    reply: FastifyReply
  ) => {
    const { inputFile, outputFile } = request.body;

    try {
      const conversion = await api.conversion.createConversion(
        inputFile.name,
        outputFile.format
      );
      return reply.status(202).send(conversion);
    } catch (error) {
      const formattedError: ValidationError = {
        message: 'Validation error',
        issues: [
          {
            message: 'Invalid input: expected string, received number',
            code: 'invalid_type',
            path: ['names', 1],
            additionalProp1: {},
          },
        ],
      };

      return reply.status(400).send(formattedError);
    }
  }
);

app.setErrorHandler(handleServerError);

export default app;
