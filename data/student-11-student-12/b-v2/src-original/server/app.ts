import fastify from 'fastify';
import crypto from 'crypto';
import { z } from 'zod';
import ConversionClient, { Conversion } from '../clients/ConversionClient';
import { handleServerError } from './errors';
import { waitForDelay } from '../utils/time';

const app = fastify({
  logger: process.env.NODE_ENV !== 'test',
  disableRequestLogging: process.env.NODE_ENV !== 'development',
});

const api = {
  conversion: new ConversionClient(),
};

const CONVERSION_POOLING_INTERVAL = 100;

const shareFileSchema = z.object({
  name: z.string().min(1),
  format: z.string().min(1),
  mode: z.enum(['public', 'private']).default('public'),
  convertTo: z.string().optional(),
});

export type ShareFileQuery = z.infer<typeof shareFileSchema>;

app.post('/shares/files', async (request, reply) => {
  const { name, format, mode, convertTo } = shareFileSchema.parse(request.body);

  let conversion: Conversion | undefined;

  if (convertTo) {
    conversion = await api.conversion.createConversion(name, format, convertTo);

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
    conversion === undefined ? name : conversion.outputFile.name;

  const originalFile =
    conversion === undefined
      ? undefined
      : {
          name: conversion.inputFile.name,
          format: conversion.inputFile.format,
        };

  return reply.status(200).send({
    id: sharedFileId,
    name: sharedFileName,
    mode,
    originalFile,
  });
});

app.setErrorHandler(handleServerError);

export default app;
