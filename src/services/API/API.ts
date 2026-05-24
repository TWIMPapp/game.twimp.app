import axios from 'axios';
import { stringifyQueryParams } from '@/utils/stringifyQueryParams';
import { Endpoint } from '@/typings/Endpoint.enum';
import QueryParams from '@/typings/QueryParams';
import { BASE_URL } from '@/constants';
import { ErrorBus } from '@/services/ErrorBus';

// Turn an axios error into something a player can read. We've already logged
// the full error to the console for ourselves above.
function describeAxiosError(error: any, endpoint: string): string {
  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || error?.code === 'ECONNABORTED') {
    return "Can't reach the server. Check your connection and try again.";
  }
  const status = error?.response?.status;
  if (status === 404) return `Not found (${endpoint}).`;
  if (status === 429) return 'Slow down — too many requests in a row.';
  if (typeof status === 'number' && status >= 500) return 'Something went wrong on our end. Please try again in a moment.';
  if (typeof status === 'number' && status >= 400) return `Request rejected (${status}).`;
  return error?.message || 'Something went wrong.';
}

export class APIService {
  private _endpoint: Endpoint;

  constructor(endpoint: Endpoint) {
    this._endpoint = endpoint;
  }

  // Resolves with the response body, or undefined on failure. We *don't*
  // re-throw: callers that don't have try/catch wrapping every API call
  // would otherwise leak unhandled promise rejections (the red Next.js dev
  // overlay, silent UI breakage in prod). Instead errors fan out via the
  // ErrorBus → ErrorSnackbar so the player sees what's going on, and the
  // caller sees `undefined` and can null-check.
  public async get<T>(params: QueryParams): Promise<T | undefined> {
    const cacheBustedParams = { ...params, _t: Date.now() };
    const url = `${BASE_URL}/${this._endpoint}${stringifyQueryParams(cacheBustedParams)}`;

    console.group(`[TWIMP-FE] GET ${this._endpoint}`);
    console.log('URL:', url);
    console.groupEnd();

    try {
      const response = await axios.get(url, { headers: { 'Cache-Control': 'no-cache' } });

      console.group(`[TWIMP-FE] GET ${this._endpoint} - SUCCESS`);
      console.log('Data:', response.data);
      console.groupEnd();

      return response.data?.body || response.data;
    } catch (error: any) {
      console.group(`[TWIMP-FE] GET ${this._endpoint} - ERROR`);
      console.error(error);
      if (error.response) console.error('Response:', error.response.data);
      console.groupEnd();
      ErrorBus.emit(describeAxiosError(error, this._endpoint));
      return undefined;
    }
  }

  public async post<T>(body: any, params: QueryParams): Promise<T | undefined> {
    const url = `${BASE_URL}/${this._endpoint}`;
    const payload = { ...body, ...params };

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
      ErrorBus.emit(describeAxiosError(error, this._endpoint));
      return undefined;
    }
  }
}
