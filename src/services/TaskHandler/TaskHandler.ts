import QueryParams from '@/typings/QueryParams';
import { InformationTask, TaskUnion } from '@/typings/Task';
import { TaskTypeRouteMap } from './TaskTypeRouteMap';
import { stringifyQueryParams } from '@/utils/stringifyQueryParams';
import ErrorImage from '../../assets/images/error.jpeg';

export class TaskHandlerService {
  public getTaskFromParams<T>(): T {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search)
    ) as unknown as QueryParams;
    console.debug('[### TWIMP ###] getTaskFromParams', params, params?.task);

    // try catch json parse and flag error on catch by returning the task error
    if (!params?.task)
      return {
        ok: false,
        image_url: ErrorImage.src,
        type: 'information',
        content: `I'm sorry we've encounted an error while trying to render this step. Please chat with us on support or click next to move on.`
      } as T;

    let parsedTask: T;
    try {
      parsedTask = JSON.parse(params.task as any) as T;
    } catch (error) {
      console.debug('[### TWIMP ###] Error parsing task from params', error);
      return {
        ok: false,
        image_url: ErrorImage.src,
        type: 'information',
        content: `I'm sorry we've encounted an error while trying to render this step. Please chat with us on support or click next to move on.`
      } as T;
    }
    return parsedTask;
  }

  public goToTaskComponent(task: TaskUnion, params: QueryParams): void {
    console.debug('[### TWIMP ###] goToTaskComponent', task, params);
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
