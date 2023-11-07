import axios from 'axios';

import { stringifyQueryParams } from '@/utils/stringifyQueryParams';
import { Endpoint } from '@/types/Endpoint.enum';
import { QueryParams } from '@/types/QueryParams';

const baseUrl =
  'https://script.google.com/macros/s/AKfycbx2Hnd9zQqpuO8dyP4ZouhmbpvO1S1cvO47tfhaXHRBCs_KxZHfkQGsFYdzJkFeWgiAJA/exec?q=trails';

export class APIService {
  private _endpoint: Endpoint;

  constructor(endpoint: Endpoint) {
    this._endpoint = endpoint;
  }

  public async get<T>(params: QueryParams): Promise<T> {
    const response = await axios
      .get(`${baseUrl}/${this._endpoint}${stringifyQueryParams(params)}`)
      .catch((error) => {
        console.error(error);
      });
    return response?.data?.body;
  }

  public async post<T>(body: any, params: QueryParams): Promise<T> {
    const response = await axios
      .post(
        `${baseUrl}/${this._endpoint}`,
        { ...body, ...params },
        {
          headers: {
            'Content-Type': 'text/plain'
          }
        }
      )
      .catch((error) => {
        console.error(error);
      });

    return response?.data?.body;
  }
}
