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
    const response = await axios
      .get(`${BASE_URL}/${this._endpoint}${stringifyQueryParams(params)}`)
      .catch((error) => {
        console.error(error);
      });
    return response?.data?.body;
  }

  public async post<T>(body: any, params: QueryParams): Promise<T> {
    const response = await axios
      .post(
        `${BASE_URL}/${this._endpoint}`,
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
