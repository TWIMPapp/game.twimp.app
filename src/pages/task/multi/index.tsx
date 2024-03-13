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

const Multi = () => {
  const [task, setTask] = useState<QuestionMultiTask>();
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [params, setParams] = useState<QueryParams>();
  const [outcome, setOutcome] = useState<Outcome>();
  const [loadingOption, setLoadingOption] = useState<Option>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  const optionCallback = async (option: Option) => {
    setLoadingOption(option);

    const body = {
      answer: option.content,
      user_id: params?.user_id,
      trail_ref: params?.trail_ref
    };

    const data = await new APIService(Endpoint.Next).post<NextResponse>(body, {
      user_id: params?.user_id ?? '',
      trail_ref: params?.trail_ref ?? ''
    });

    if (data) {
      if (data.task) {
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

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;

      if (_params?.task) {
        setParams(_params);
        const data = new TaskHandlerService().getTaskFromParams<QuestionMultiTask>();
        if (data) {
          setTask(data);
        }
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {task?.image_url && (
        <div
          className="bg-cover bg-center bg-no-repeat absolute h-60 w-full"
          style={{ backgroundImage: 'url(' + task.image_url + ')' }}
        >
          {task?.content ? (
            <>
              <div className="markdown-body mt-52 rounded-tl-3xl rounded-tr-3xl relative">
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
    </>
  );
};

export default Multi;
