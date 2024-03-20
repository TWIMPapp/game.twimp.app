import QueryParams from '@/typings/QueryParams';
import { TaskUnion } from '@/typings/Task';
import { TaskTypeRouteMap } from './TaskTypeRouteMap';
import { stringifyQueryParams } from '@/utils/stringifyQueryParams';
import { TaskType } from '@/typings/TaskType.enum';

export class TaskHandlerService {
  public setTaskInSession<T>(task: T): void {
    sessionStorage.setItem('task', JSON.stringify(task));
  }

  public getTaskFromSession<T>(): T | null {
    const task = sessionStorage.getItem('task');
    return task ? (JSON.parse(task) as T) : null;
  }

  public setPrevTaskIdInSession(taskId: string): void {
    sessionStorage.setItem('prev_task_id', taskId);
  }

  public getPrevTaskIdFromSession(): string | null {
    const prevTaskId = sessionStorage.getItem('prev_task_id');
    return prevTaskId ? JSON.parse(prevTaskId) : null;
  }

  public clearSession(): void {
    sessionStorage.removeItem('task');
    sessionStorage.removeItem('prev_task_id');
  }

  public goToTaskComponent(task: TaskUnion, params: QueryParams): void {
    console.debug('[### TWIMP ###] goToTaskComponent', task, params);
    if (!task) return;
    const route = TaskTypeRouteMap[task.type];

    if (route) {
      this.setTaskInSession(task);

      if (task.id && task.type !== TaskType.Map) {
        this.setPrevTaskIdInSession(task.id);
      }

      window.location.assign(
        `${route}?${stringifyQueryParams(params, { includeStartAmp: false })}`
      );
    } else {
      console.error(`Invalid task type: ${task.type}`);
    }
  }
}
