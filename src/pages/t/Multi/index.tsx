import { useEffect, useState } from 'react';

import MultiQuestion from '../../../components/MultiQuestion';
import Loading from '../../../components/Loading';
import { Option, Outcome, QuestionMultiTask, TaskUnion } from '@/types/Task';
import { TaskHandlerService } from '@/services/TaskHandler';
import { Page } from '@/types/Page.enum';
import QueryParams from '@/types/QueryParams';
import { APIService } from '@/services/API';
import { Endpoint } from '@/types/Endpoint.enum';
import SentimentSnackbar from '@/components/SentimentSnackbar';
import Image from 'next/image';

interface NextResponse {
  ok: boolean;
  outcome?: Outcome;
  task?: TaskUnion;
}

const Multi = () => {
  const [task, setTask] = useState<QuestionMultiTask>();
  const [params, setParams] = useState<QueryParams>();
  const [outcome, setOutcome] = useState<Outcome>();

  const optionCallback = async (option: Option) => {
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
        new TaskHandlerService().goToTaskComponent(data.task, params as QueryParams);
      }

      if (data.outcome) {
        setOutcome(data.outcome);
      }
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
        <div className="flex justify-center">
          <Image src={task.image_url} alt="question-image" className="max-h-64 w-full" />
        </div>
      )}
      {task?.content ? (
        <>
          <MultiQuestion
            question={task.content}
            hint={task.hint}
            options={task.options}
            callback={optionCallback}
          />
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

Multi.displayName = Page.Multi;
export default Multi;
