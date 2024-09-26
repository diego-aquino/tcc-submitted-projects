import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

interface ConversionRequestBody {
  inputFile: { name: string };
  outputFile: { format: string };
}

const server = setupServer(
  http.post(
    `${process.env.CONVERSION_API_URL}/conversions`,
    async ({ request }) => {
      const body = (await request.json()) as ConversionRequestBody;
      const { inputFile, outputFile } = body;
      return HttpResponse.json({
        id: 'conversion-id-123',
        state: 'PENDING',
        inputFileName: inputFile.name,
        inputFileFormat: 'docx',
        outputFileName: 'converted-file.pdf',
        outputFileFormat: outputFile.format,
        createdAt: new Date().toISOString(),
        completedAt: null,
      });
    }
  ),

  http.get(
    `${process.env.CONVERSION_API_URL}/conversions/:conversionId`,
    ({ params }) => {
      const { conversionId } = params;

      if (conversionId === 'conversion-id-123') {
        return HttpResponse.json({
          id: conversionId,
          state: 'COMPLETED',
          inputFileName: 'example.docx',
          inputFileFormat: 'docx',
          outputFileName: 'converted-file.pdf',
          outputFileFormat: 'pdf',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        });
      }

      return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
    }
  )
);

export { server };

export const setupTests = () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
};