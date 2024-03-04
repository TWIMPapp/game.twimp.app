import { Outcome, TaskUnion } from '@/typings/Task';

export interface PreviousResponse {
  ok: boolean;
  task?: TaskUnion;
}
