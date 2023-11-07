import { Endpoint } from '@/types/Endpoint.enum';
import { APIService } from '../API';
import { QueryParams } from '@/types/QueryParams';
import { Task, TaskUnion } from '@/types/Task';
import { TaskTypeRouteMap } from './TaskTypeRouteMap';
import { stringifyQueryParams } from '@/utils/stringifyQueryParams';

export class TaskHandlerService {
  private _API = new APIService(Endpoint.Next);

  public getTaskFromParams<T>(): T {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search)
    ) as unknown as QueryParams;
    return params?.task ? JSON.parse(params.task as any) : null;
  }

  public goToTaskComponent(task: TaskUnion, params: QueryParams): void {
    if (!task) return;
    const route = TaskTypeRouteMap[task.type];

    if (route) {
      const taskParams = new URLSearchParams({
        task: JSON.stringify(task)
      });
      window.location.assign(
        `${route}?${stringifyQueryParams(params, { includeStartAmp: false })}&${taskParams}`
      );
    } else {
      console.error(`Invalid task type: ${task.type}`);
    }
  }
}
