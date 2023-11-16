import { Outcome, TaskUnion } from '@/typings/Task';

export interface NextResponse {
  ok: boolean;
  outcome?: Outcome;
  task?: TaskUnion;
}
