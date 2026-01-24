import axios from 'axios';
import { stringifyQueryParams } from '@/utils/stringifyQueryParams';
import { Endpoint } from '@/typings/Endpoint.enum';
import QueryParams from '@/typings/QueryParams';
import { BASE_URL } from '@/constants';

export class APIService {
  private _endpoint: Endpoint;

  constructor(endpoint: Endpoint) {
    this._endpoint = endpoint;
  }

  public async get<T>(params: QueryParams): Promise<T> {
    const url = `${BASE_URL}/${this._endpoint}${stringifyQueryParams(params)}`;

    // Detailed Logging
    console.group(`[TWIMP-FE] GET ${this._endpoint}`);
    console.log('URL:', url);
    console.groupEnd();

    try {
      const response = await axios.get(url);

      console.group(`[TWIMP-FE] GET ${this._endpoint} - SUCCESS`);
      console.log('Data:', response.data);
      console.groupEnd();

      return response.data?.body || response.data;
    } catch (error: any) {
      console.group(`[TWIMP-FE] GET ${this._endpoint} - ERROR`);
      console.error(error);
      if (error.response) console.error('Response:', error.response.data);
      console.groupEnd();
      throw error;
    }
  }

  public async post<T>(body: any, params: QueryParams): Promise<T> {
    const url = `${BASE_URL}/${this._endpoint}`;
    const payload = { ...body, ...params };

    // Detailed Logging
    console.group(`[TWIMP-FE] POST ${this._endpoint}`);
    console.log('URL:', url);
    console.log('Payload:', payload);
    console.groupEnd();

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.group(`[TWIMP-FE] POST ${this._endpoint} - SUCCESS`);
      console.log('Result:', response.data);
      console.groupEnd();

      return response.data?.body || response.data;
    } catch (error: any) {
      console.group(`[TWIMP-FE] POST ${this._endpoint} - ERROR`);
      console.error(error);
      if (error.response) console.error('Response:', error.response.data);
      console.groupEnd();
      throw error;
    }
  }
}
