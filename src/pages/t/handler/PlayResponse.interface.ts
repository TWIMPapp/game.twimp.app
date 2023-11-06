import { MapTask, TaskUnion } from '@/types/Task';

export interface PlayResponse {
  ok: boolean;
  start: MapTask;
  continue: TaskUnion;
}
