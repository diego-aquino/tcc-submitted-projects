import supertest from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import ConversionClient from '../src/clients/ConversionClient';
import { conversionHandlers } from './handlers/conversionHandlers';
import app, { ShareFileQuery } from '../src/server/app';
import { setupServer } from 'msw/node';

interface ConversionResponse {
  id: string;
  name: string;
  mode: string;
  originalFile: {
    name: string;
    format: string;
  };
}

const server = setupServer(...conversionHandlers);

const api = {
  conversion: new ConversionClient(),
};

server.events.on('request:start', ({ request }) => {
  console.log('Outgoing:', request.method, request.url);
});

describe('Shares', () => {
  beforeAll(async () => {
    server.listen();
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    server.resetHandlers();
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        format: 'docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 1: Envia um arquivo normal com conversão', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        format: 'docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    const resp = response.body as ConversionResponse;

    expect(response.status).toBe(200);
    expect(resp.mode).toBe('public');
    expect(resp.name).toBe('example.pdf');
    expect(resp.originalFile.format).toBe('docx');
    expect(resp.originalFile.name).toBe('example.docx');
    console.log(response.body);
  });

  test('caso 2: Envia formato do input errado', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: '123',
        format: 'unknow',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    const resp = response.body;

    expect(response.status).toBe(200);
    expect(resp.mode).toBe('public');
    expect(resp.name).toBe('123.pdf');
    expect(resp.originalFile.format).toBe('unknow');
    expect(resp.originalFile.name).toBe('123');

    console.log(resp);
  });

  test('caso 3: Envia formato do output errado', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        format: 'docx',
        mode: 'public',
        convertTo: '123',
      } satisfies ShareFileQuery);

    const resp = response.body;

    expect(response.status).toBe(200);
    expect(resp.mode).toBe('public');
    expect(resp.name).toBe('example.123');
    expect(resp.originalFile.format).toBe('docx');
    expect(resp.originalFile.name).toBe('example.docx');

    console.log(response.body);
  });

  test('caso 4: Envia nome do arquivo com caracter nulo', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: '\0',
        format: 'unknow',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    const resp = response.body;

    expect(response.status).toBe(500);

    console.log(response.body);
  });
});
