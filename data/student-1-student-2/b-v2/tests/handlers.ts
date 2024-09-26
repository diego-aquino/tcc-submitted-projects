import { http, HttpResponse } from 'msw';
import { Conversion } from '../src/clients/ConversionClient';

const handlers = [
  http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
    return HttpResponse.json<Conversion>({
      id: 'conversion-id',
      state: 'PENDING',
      input: {
        inputFileName: 'file.txt',
        inputFileFormat: 'txt',
      },
      output: {
        outputFileName: 'file.pdf',
        outputFileFormat: 'pdf',
      },
      createdAt: new Date().toISOString(),
      completedAt: null,
    });
  }),

  http.get(
    `${process.env.CONVERSION_API_URL}/conversions/conversion-id`,
    () => {
      return HttpResponse.json<Conversion>({
        id: 'conversion-id',
        state: 'COMPLETED',
        input: {
          inputFileName: 'file.txt',
          inputFileFormat: 'txt',
        },
        output: {
          outputFileName: 'file.pdf',
          outputFileFormat: 'pdf',
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }
  ),
];

export { handlers };
