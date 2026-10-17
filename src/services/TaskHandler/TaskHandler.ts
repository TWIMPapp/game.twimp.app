import QueryParams from '@/typings/QueryParams';
import { TaskUnion } from '@/typings/Task';
import { TaskTypeRouteMap } from './TaskTypeRouteMap';
import { stringifyQueryParams } from '@/utils/stringifyQueryParams';
import { TaskType } from '@/typings/TaskType.enum';
import { ThemeStyle } from '@/typings/ThemeStyle.enum';
import { BatchStore } from '@/services/BatchStore';

export class TaskHandlerService {
  public setTaskInSession<T>(task: T): void {
    sessionStorage.setItem('task', JSON.stringify(task));
  }

  public getTaskFromSession<T>(): T | null {
    const task = sessionStorage.getItem('task');
    return task ? (JSON.parse(task) as T) : null;
  }

  public setPrevTaskIdInSession(taskId: number): void {
    sessionStorage.setItem('prev_task_id', String(taskId));
  }

  public getPrevTaskIdFromSession(): number | null {
    const prevTaskId = sessionStorage.getItem('prev_task_id');
    return prevTaskId ? Number(prevTaskId) : null;
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
      // Keep the localStorage batch in step: if we're navigating to a card
      // that isn't the stored current one (non-batch source), it becomes a
      // one-card batch so a reload/force-close lands on it.
      const current = BatchStore.current(params);
      if (!current || !BatchStore.sameCard(current, task)) {
        BatchStore.saveFromResponse(params, { task });
      }

      if (task?.id >= 0 && task?.type !== TaskType.Map) {
        this.setPrevTaskIdInSession(task.id);
      }

      window.location.assign(
        `${route}?${stringifyQueryParams(params, { includeStartAmp: false })}`
      );

      // set dark theme
      if (task.theme === ThemeStyle.Dark) {
        document.documentElement.classList.add('dark');
      } else if (task.theme === ThemeStyle.Light) {
        document.documentElement.classList.remove('dark');
      }
    } else {
      console.error(`Invalid task type: ${task.type}`);
    }
  }
}
