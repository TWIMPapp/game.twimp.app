// Server-first resume. The phone keeps its own copy of the current card
// (sessionStorage 'task' + the localStorage BatchStore). If the server session
// has moved somewhere else (another device, an admin move, a restart), that
// local copy must lose: on every /task/* page load we ask /play for the
// server's current card and, if it isn't the local card (or one of the
// local batch cards still ahead of it), we overwrite the local copy and route
// to the server's card.
import QueryParams from '@/typings/QueryParams';
import { TaskUnion } from '@/typings/Task';
import { BatchStore, postWithTimeout } from '@/services/BatchStore';
import { TaskHandlerService } from '@/services/TaskHandler';

let inFlight: Promise<any | undefined> | null = null;

const fetchServerCurrent = (params: QueryParams) => {
  if (!inFlight) {
    inFlight = postWithTimeout('play', { game_ref: params.trail_ref, user_id: params.user_id }, 8000);
  }
  return inFlight;
};

/**
 * Returns the card the player should be on. If the local copy is stale it is
 * replaced with the server's card (sessionStorage + BatchStore). `null` means
 * the server couldn't be reached — keep using the local copy.
 */
export async function reconcileWithServer(
  params: QueryParams | undefined
): Promise<{ task: TaskUnion; changed: boolean } | null> {
  if (!params?.trail_ref || !params?.user_id) return null;
  const data = await fetchServerCurrent(params);
  if (!data?.ok || !data.task) return null;
  const server = data.task as TaskUnion;
  const sid = String((server as any).id);
  const local = BatchStore.current(params);
  const localIds = local ? [String((local as any).id), ...Array.from(BatchStore.aheadIds(params))] : [];
  const sessionTask = new TaskHandlerService().getTaskFromSession<TaskUnion>();
  const sessionOk = !sessionTask || localIds.includes(String((sessionTask as any).id));
  if (local && localIds.includes(sid) && sessionOk) {
    return { task: local as TaskUnion, changed: false };
  }
  console.debug('[TWIMP sync] local card stale — using server card', sid);
  BatchStore.saveFromResponse(params, data);
  try { sessionStorage.setItem('task', JSON.stringify(server)); } catch { /* ignore */ }
  return { task: server, changed: true };
}

/** For /task/* pages: if the server is elsewhere, navigate to its card. */
export async function syncTaskPageWithServer(params: QueryParams | undefined) {
  const r = await reconcileWithServer(params);
  if (r?.changed && params) new TaskHandlerService().goToTaskComponent(r.task, params);
  return r;
}
