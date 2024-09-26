import { http, HttpResponse } from 'msw';

type RequestBody = {
  inputFile: {
    name: string;
  };
  outputFile: {
    format: string;
  };
};

function isValidFormat(input: string): boolean {
  const formatRegex = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?$/;
  return formatRegex.test(input);
}

export const conversionHandlers = [
  http.post(
    `https://v1-conversion-bd636ba3.vercel.app/conversions`,
    async ({ request }) => {
      const body = (await request.json()) as RequestBody;

      const extension = `${body.inputFile.name.split('.')[1]}`;
      const newFormat = `${body.outputFile.format}`;
      const newFileName = `${body.inputFile.name.split('.')[0]}.${newFormat}`;

      if (!isValidFormat(body.inputFile.name)) {
        return HttpResponse.json({
          id: 'pfh0haxfpzowht3oi213cqos',
          state: 'ERROR',
          inputFileName: body.inputFile.name,
          inputFileFormat: extension,
          outputFileName: newFileName,
          createdAt: '2021-08-01T12:00:00Z',
          completedAt: '2021-08-01T12:00:00Z',
        });
      }

      return HttpResponse.json({
        id: 'pfh0haxfpzowht3oi213cqos',
        state: 'COMPLETED',
        inputFileName: body.inputFile.name,
        inputFileFormat: extension,
        outputFileName: newFileName,
        createdAt: '2021-08-01T12:00:00Z',
        completedAt: '2021-08-01T12:00:00Z',
      });
    }
  ),
];
