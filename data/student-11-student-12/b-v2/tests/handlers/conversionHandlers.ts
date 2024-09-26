import { http, HttpResponse } from 'msw';

type RequestBody = {
  inputFile: {
    name: string;
    format: string;
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
    `https://v2-conversion-bd636ba3.vercel.app/conversions`,
    async ({ request }) => {
      const body = (await request.json()) as RequestBody;

      const newFileName = `${body.inputFile.name.split('.')[0]}.${
        body.outputFile.format
      }`;

      if (!isValidFormat(body.inputFile.name)) {
        return HttpResponse.json({
          id: 'pfh0haxfpzowht3oi213cqos',
          state: 'ERROR',
          inputFile: {
            name: body.inputFile.name,
            format: body.inputFile.format,
          },
          outputFile: {
            name: newFileName,
            format: body.outputFile.format,
          },
          createdAt: '2021-08-01T12:00:00Z',
          completedAt: '2021-08-01T12:00:00Z',
        });
      }
      return HttpResponse.json({
        id: 'pfh0haxfpzowht3oi213cqos',
        state: 'COMPLETED',
        inputFile: {
          name: body.inputFile.name,
          format: body.inputFile.format,
        },
        outputFile: {
          name: newFileName,
          format: body.outputFile.format,
        },
        createdAt: '2021-08-01T12:00:00Z',
        completedAt: '2021-08-01T12:00:00Z',
      });
    }
  ),
];
