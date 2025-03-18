import { TaskType } from '@/typings/TaskType.enum';

export const TaskTypeRouteMap: Record<TaskType, string> = {
  [TaskType.Question_multi]: '/task/multi',
  [TaskType.Question_single]: '/task/single',
  [TaskType.Map]: '/task/map',
  [TaskType.Information]: '/task/information',
  [TaskType.Chat]: '/task/chat',
  [TaskType.Finish]: '/task/finish',
  [TaskType.Evade]: '/task/evade',
  [TaskType.Hunt]: '/task/hunt'
};
