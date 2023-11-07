import { MapTask, TaskUnion } from '@/typings/Task';

export interface PlayResponse {
  ok: boolean;
  start: MapTask;
  continue: TaskUnion;
}
