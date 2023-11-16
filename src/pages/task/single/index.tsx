import { useEffect, useState } from 'react';

import Loading from '../../../components/Loading';
import { Option, Outcome, QuestionSingleTask, TaskUnion } from '@/typings/Task';
import { TaskHandlerService } from '@/services/TaskHandler';
import { Page } from '@/typings/Page.enum';
import QueryParams from '@/typings/QueryParams';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import SentimentSnackbar from '@/components/SentimentSnackbar';
import Question from '@/components/Question';
import Hint from '@/components/Hint';
import { TextField } from '@mui/material';
import { NextResponse } from '../../../typings/NextResponse';

const Single = () => {
  const [task, setTask] = useState<QuestionSingleTask>();
  const [params, setParams] = useState<QueryParams>();
  const [outcome, setOutcome] = useState<Outcome>();
  const [input, setInput] = useState<string>('');
  const [timer, setTimer] = useState<any>(null);

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

  useEffect(() => {
    const onValidate = async (answer: string) => {
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
          setTimeout(
            () =>
              new TaskHandlerService().goToTaskComponent(
                data.task as TaskUnion,
                params as QueryParams
              ),
            1200
          );
        }

        if (data.outcome) {
          setOutcome(data.outcome);
        }
      }
    };

    if (timer) {
      clearTimeout(timer);
    }

    setTimer(
      setTimeout(() => {
        onValidate(input);
      }, 1000)
    );

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

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
              <div className="pt-6">
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
            </div>
          </div>
          {outcome ? (
            <SentimentSnackbar
              outcome={outcome}
              open={outcome !== undefined}
              autoHideDuration={6000}
              handleClose={() => {
                setOutcome(undefined);
              }}
            ></SentimentSnackbar>
          ) : (
            ''
          )}
        </>
      ) : (
        <Loading />
      )}
    </>
  );
};

export default Single;
