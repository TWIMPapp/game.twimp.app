import QueryParams from '@/typings/QueryParams';
import { TaskUnion } from '@/typings/Task';
import { TaskTypeRouteMap } from './TaskTypeRouteMap';
import { stringifyQueryParams } from '@/utils/stringifyQueryParams';

export class TaskHandlerService {
  public setTaskInSession<T>(task: T): void {
    sessionStorage.setItem('task', JSON.stringify(task));
  }

  public getTaskFromSession<T>(): T | null {
    const task = sessionStorage.getItem('task');
    return task ? (JSON.parse(task) as T) : null;
  }

  public goToTaskComponent(task: TaskUnion, params: QueryParams): void {
    console.debug('[### TWIMP ###] goToTaskComponent', task, params);
    if (!task) return;
    const route = TaskTypeRouteMap[task.type];

    if (route) {
      this.setTaskInSession(task);

      window.location.assign(
        `${route}?${stringifyQueryParams(params, { includeStartAmp: false })}`
      );
    } else {
      console.error(`Invalid task type: ${task.type}`);
    }
  }
}
