import { Endpoint } from '@/types/Endpoint.enum';
import { APIService } from '../API';
import { QueryParams } from '@/types/QueryParams';

export class TaskHandlerService {
  private _API = new APIService(Endpoint.Next);

  public getTaskFromParams<T>(): T {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search)
    ) as unknown as QueryParams;
    return params?.task ? JSON.parse(params.task as any) : null;
  }
}
