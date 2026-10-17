import { useEffect, useState } from 'react';

import MultiQuestion from '../../../components/MultiQuestion';
import Loading from '../../../components/Loading';
import { Option, Outcome, QuestionMultiTask, TaskUnion } from '@/typings/Task';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import SentimentSnackbar from '@/components/SentimentSnackbar';
import { NextResponse } from '@/typings/NextResponse';
import { NEVIGATION_DELAY } from '@/constants';
import ItemsDialog from '@/components/ItemsDialog';
import { InventoryItem } from '@/typings/inventoryItem';
import GamePage from '@/components/GamePage';
import SwipeCard from '@/components/SwipeCard';
import { useGamePage } from '@/hooks/useGamePage';
import { useBatchTask } from '@/hooks/useBatchTask';
import { BatchStore } from '@/services/BatchStore';
import { LocalJournal } from '@/services/LocalJournal';


const Multi = ({ testTask }: { testTask?: QuestionMultiTask }) => {
  const { task, params } = useBatchTask<QuestionMultiTask>(testTask);
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [outcome, setOutcome] = useState<Outcome>();
  const [loadingOption, setLoadingOption] = useState<Option>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  const optionCallback = async (option: Option) => {
    setLoadingOption(option);

    const body = {
      answer: option.content,
      user_id: params?.user_id,
      trail_ref: params?.trail_ref,
      batch: true
    };

    const data = await new APIService(Endpoint.Next).post<NextResponse>(body, {
      user_id: params?.user_id ?? '',
      trail_ref: params?.trail_ref ?? ''
    });

    if (data) {
      // A matched-but-negative option comes back with the SAME question as
      // `task` — stay put and just show the outcome. (Navigating to it would
      // race a quick follow-up answer and could strand the player behind the
      // server.)
      const sameQuestion = !!data.task && String(data.task.id) === String(task?.id);
      if (data.task && !sameQuestion) {
        // Correct answer: the new batch replaces the stored one.
        LocalJournal.setAnswer(params, BatchStore.current(params) || task, body.answer);
        BatchStore.saveFromResponse(params, data);
        setNextTask(data.task);

        if ((data.outcome?.items ?? [])?.length > 0) {
          setItems(data?.outcome?.items ?? []);
          setOpen(true);
        } else {
          setTimeout(
            () =>
              new TaskHandlerService().goToTaskComponent(
                data.task as TaskUnion,
                params as QueryParams
              ),
            NEVIGATION_DELAY
          );
        }
      }

      if (data.outcome) {
        setOutcome(data.outcome);
      }

      setLoadingOption(undefined);
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (nextTask) {
      setTimeout(
        () => new TaskHandlerService().goToTaskComponent(nextTask, params as QueryParams),
        NEVIGATION_DELAY
      );
    }
  };

  const { gamePageOpen, openGamePage, closeGamePage } = useGamePage();


  return (
    <>
      {/* Question cards: swipe right opens the game page; no swipe-left (answer to progress). */}
      <SwipeCard onSwipeRight={openGamePage}>
      {task?.image_url && (
        <div
          className="bg-cover bg-center bg-no-repeat absolute h-60 w-full"
          style={{ backgroundImage: 'url(' + task.image_url + ')' }}
        >
          {task?.content ? (
            <>
              <div className="markdown-body mt-52 pb-60 bg-white dark:bg-gray-800 dark:text-white rounded-tl-3xl rounded-tr-3xl relative">
                <MultiQuestion
                  question={task.content}
                  hint={task.hint}
                  options={task.options}
                  loadingOption={loadingOption}
                  callback={optionCallback}
                />
              </div>
              <div>
                {outcome ? (
                  <SentimentSnackbar
                    outcome={outcome}
                    open={outcome !== undefined}
                    autoHideDuration={10000}
                    handleClose={() => {
                      setOutcome(undefined);
                    }}
                  ></SentimentSnackbar>
                ) : (
                  ''
                )}
                <ItemsDialog items={items} open={open} handleClose={handleClose}></ItemsDialog>
              </div>
            </>
          ) : (
            <Loading />
          )}
        </div>
      )}
      </SwipeCard>
      {gamePageOpen && <GamePage open={gamePageOpen} handleClose={closeGamePage} />}
    </>
  );
};

export default Multi;
