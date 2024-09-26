import axios, { AxiosInstance } from 'axios';

type InputFile = {
  name: string;
  format: string;
};

type OutputFile = {
  name: string;
  format: string;
};

export interface Conversion {
  id: string;
  state: 'PENDING' | 'COMPLETED' | 'ERROR';
  inputFile: InputFile;
  outputFile: OutputFile;
  createdAt: string;
  completedAt: string | null;
}

class ConversionClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.CONVERSION_API_URL,
    });
  }

  async createConversion(
    fileName: string,
    format: string,
    outputFormat: string
  ) {
    const response = await this.api.post<Conversion>('/conversions', {
      inputFile: {
        name: fileName,
        format: format,
      },
      outputFile: {
        format: outputFormat,
      },
    });
    const conversion = response.data;
    return conversion;
  }

  async getConversionById(conversionId: string) {
    const response = await this.api.get<Conversion>(
      `/conversions/${conversionId}`
    );
    const conversion = response.data;
    return conversion;
  }
}

export default ConversionClient;
