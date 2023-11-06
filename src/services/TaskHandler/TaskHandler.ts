import { Endpoint } from '@/types/Endpoint.enum';
import { APIService } from '../API';
import { QueryParams } from '@/types/QueryParams';
import { TaskType } from '@/types/TaskType.enum';
import { Task } from '@/types/Task';

export class TaskHandlerService {
  private _API = new APIService(Endpoint.Next);

  public getTaskFromParams<T>(): T {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search)
    ) as unknown as QueryParams;
    return params?.task ? JSON.parse(params.task as any) : null;
  }

  public goToTaskComponent(task: Task): void {
    if (!task) return;
    switch (task?.type) {
      case TaskType.Question_multi:
        this.goToQuestionMulti(task);
        break;
      case TaskType.Question_single:
        this.goToQuestionSingle(task);
        break;
      case TaskType.Marker:
        this.goToMarker(task);
        break;
      case TaskType.Message:
        this.goToMessage(task);
        break;
      case TaskType.Character:
        this.goToCharacter(task);
        break;
      default:
        break;
    }
  }

  private _routeToComponent(task: Task, component: string): void {
    // TODO: nextjs routing
  }
}
