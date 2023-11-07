import { TaskType } from '@/typings/TaskType.enum';

export const TaskTypeRouteMap: Record<TaskType, string> = {
  [TaskType.Question_multi]: '/task/multi',
  [TaskType.Question_single]: '/task/single',
  [TaskType.Map]: '/task/map',
  [TaskType.Information]: '/task/information',
  [TaskType.Instruction]: '/task/instruction',
  [TaskType.Chat]: '/task/chat'
};
