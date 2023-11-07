import { TaskType } from '@/typings/TaskType.enum';

export const TaskTypeRouteMap: Record<TaskType, string> = {
  [TaskType.Question_multi]: '/t/multi',
  [TaskType.Question_single]: '/t/single',
  [TaskType.Map]: '/t/map',
  [TaskType.Information]: '/t/information',
  [TaskType.Instruction]: '/t/instruction',
  [TaskType.Chat]: '/t/chat'
};
