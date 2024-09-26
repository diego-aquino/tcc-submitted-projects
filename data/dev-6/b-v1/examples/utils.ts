import filesystem from 'fs';
import util from 'util';

async function logRequest(request: Request, baseURL: string) {
  console.log(`Requesting:\n\n${request.method} ${request.url}`);

  const url = new URL(request.url);

  interface RequestLogContent {
    method: string;
    url: {
      base: string;
      path: string;
      query?: string;
    };
    headers?: Record<string, string>;
    body?: unknown;
  }

  const content: RequestLogContent = {
    method: request.method,
    url: {
      base: baseURL,
      path: url.href.replace(baseURL, '').replace(url.search, ''),
    },
  };

  const headersAsObject = Object.fromEntries(request.headers.entries());

  if (Object.keys(headersAsObject).length > 0) {
    content.headers = {};

    for (const [key, value] of request.headers.entries()) {
      const capitalizedKey = key.replace(
        /(^|-)([a-z])/g,
        (_match, prefix, letter) => `${prefix}${letter.toUpperCase()}`,
      );
      content.headers[capitalizedKey] = value;
    }
  }

  if (url.search) {
    content.url.query = url.search;
  }

  if (request.body !== null) {
    content.body = await request.clone().json();
  }

  console.log(
    util.formatWithOptions({ breakLength: 1, colors: true }, content),
  );
}

interface ExampleInput {
  request: Request;
  baseURL: string;
  outputPath: string;
}

export async function runExample({
  request,
  baseURL,
  outputPath,
}: ExampleInput) {
  await logRequest(request, baseURL);

  const response = await fetch(request);
  const responseBody = await response.json();

  await filesystem.promises.writeFile(
    outputPath,
    JSON.stringify(responseBody, null, 2),
  );

  console.log('\nResponse:');
  console.log(
    util.formatWithOptions(
      { breakLength: 1, colors: true },
      {
        status: response.status,
        bodySavedTo: `./${outputPath}`,
      },
    ),
  );
}
