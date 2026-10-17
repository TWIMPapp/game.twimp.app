import { useEffect, useState } from 'react';
import { LocalItems } from '@/services/LocalItems';

// A batch card's `items` were granted by its on_arrival: record them once,
// when the player actually reaches that card.
const grantCardItems = (p: any, card: any) => {
  if (Array.isArray(card?.items) && card.items.length) LocalItems.apply(p, `c:${card.position ?? card.id}`, card.items);
};
import QueryParams from '@/typings/QueryParams';
import { TaskUnion } from '@/typings/Task';
import { TaskHandlerService } from '@/services/TaskHandler';
import { TaskTypeRouteMap } from '@/services/TaskHandler/TaskTypeRouteMap';
import { LocalJournal } from '@/services/LocalJournal';
import { BatchCard, BatchStore, postWithTimeout, syncCardInBackground } from '@/services/BatchStore';

const RECOVERY_TIMEOUT_MS = 8000;

/**
 * Loads the card for a task page:
 *   1. the batch in localStorage (survives force-close), else
 *   2. sessionStorage (old single-card hand-off), else
 *   3. ask the server where the player is (/play), else
 *   4. go home.
 * Never spins forever: /play has a hard timeout. If the stored card belongs on
 * a different page (e.g. we reloaded on the wrong route), navigates there.
 * Cards flagged server_call_required get a background cross-check.
 */
export function useBatchTask<T extends TaskUnion>(testTask?: T) {
  const [task, setTask] = useState<T>();
  const [params, setParams] = useState<QueryParams>();

  useEffect(() => {
    if (testTask?.id !== undefined && testTask?.id !== null && (testTask as any).id !== '') {
      setTask(testTask);
      return;
    }
    const _params = Object.fromEntries(new URLSearchParams(window.location.search)) as unknown as QueryParams;
    setParams(_params);
    const handler = new TaskHandlerService();

    const show = (card: BatchCard) => {
      const route = TaskTypeRouteMap[card.type as keyof typeof TaskTypeRouteMap];
      if (route && route !== window.location.pathname) {
        handler.goToTaskComponent(card as TaskUnion, _params);
        return;
      }
      handler.setTaskInSession(card);
      setTask(card as unknown as T);
      LocalJournal.add(_params, card);
      grantCardItems(_params, card);
      syncCardInBackground(_params, card, replaced => {
        handler.setTaskInSession(replaced);
        setTask(replaced as unknown as T);
      });
    };

    const local = BatchStore.current(_params);
    if (local) return show(local);

    const session = handler.getTaskFromSession<T>();
    if (session) {
      setTask(session);
      LocalJournal.add(_params, session);
      return;
    }

    if (!_params?.trail_ref || !_params?.user_id) {
      window.location.assign('/');
      return;
    }
    postWithTimeout('play', { game_ref: _params.trail_ref, user_id: _params.user_id }, RECOVERY_TIMEOUT_MS)
      .then(data => {
        if (data?.ok && data.task) {
          BatchStore.saveFromResponse(_params, data);
          show(BatchStore.current(_params) || data.task);
        } else {
          window.location.assign('/');
        }
      });
  }, [testTask]);

  // Swap to another card in place (no navigation). Same bookkeeping as show().
  const swapTo = (card: BatchCard) => {
    const handler = new TaskHandlerService();
    handler.setTaskInSession(card);
    setTask(card as unknown as T);
    LocalJournal.add(params, card);
    grantCardItems(params, card);
    syncCardInBackground(params, card, replaced => {
      handler.setTaskInSession(replaced);
      setTask(replaced as unknown as T);
    });
  };

  return { task, setTask, params, swapTo };
}
