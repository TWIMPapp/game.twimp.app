import { Outcome, TaskUnion } from '@/typings/Task';
import { BatchCard } from '@/services/BatchStore';

export interface NextResponse {
  ok: boolean;
  outcome?: Outcome;
  task?: TaskUnion;
  // batch-next (request sent with batch: true)
  position?: number;
  upcoming?: BatchCard[];
}
