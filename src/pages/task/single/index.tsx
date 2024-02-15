import { useEffect, useState } from 'react';
import Loading from '../../../components/Loading';
import { Outcome, QuestionSingleTask, TaskUnion } from '@/typings/Task';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import SentimentSnackbar from '@/components/SentimentSnackbar';
import Question from '@/components/Question';
import Hint from '@/components/Hint';
import { Button, CircularProgress, TextField } from '@mui/material';
import { NextResponse } from '../../../typings/NextResponse';
import { NEVIGATION_DELAY } from '@/constants';
import ItemsDialog from '@/components/ItemsDialog';
import { InventoryItem } from '@/typings/inventoryItem';

const Single = () => {
  const [task, setTask] = useState<QuestionSingleTask>();
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [params, setParams] = useState<QueryParams>();
  const [outcome, setOutcome] = useState<Outcome>();
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState<boolean>(false);

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
        const data = new TaskHandlerService().getTaskFromParams<QuestionSingleTask>();
        if (data) {
          setTask(data);
        }
      }
    };

    fetchData();
  }, []);

  const onValidate = async (answer: string) => {
    setLoading(true);

    const body = {
      answer,
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

      setLoading(false);
    }
  };

  return (
    <>
      {task?.image_url && (
        <div
          className="flex justify-center h-48 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(' + task.image_url + ')' }}
        ></div>
      )}
      {task?.content ? (
        <>
          <div className="p-6">
            <div className="max-h-64">
              <Question question={task.content} />
              {task?.hint && <Hint hint={task.hint} />}
              <div className="pt-6 pb-6">
                <TextField
                  autoFocus
                  label="Answer"
                  variant="outlined"
                  className="w-full"
                  value={input}
                  error={outcome?.sentiment && outcome.sentiment !== 'positive'}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              <Button
                disabled={input.length === 0}
                variant="contained"
                color="primary"
                className="w-full"
                onClick={() => onValidate(input)}
              >
                {loading ? <CircularProgress /> : 'submit'}
              </Button>
            </div>
          </div>
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
        </>
      ) : (
        <Loading />
      )}
    </>
  );
};

export default Single;
