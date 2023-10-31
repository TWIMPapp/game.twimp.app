import { useEffect, useState } from 'react';

import MultiQuestion from '../../../components/MultiQuestion';
import Loading from '../../../components/Loading';
import { Option, QuestionMultiTask } from '@/types/Task';
import { TaskHandlerService } from '@/services/TaskHandler';
import { Page } from '@/types/Page.enum';

const Multi = () => {
  const [task, setTask] = useState<QuestionMultiTask>();

  const optionCallback = async (option: Option) => {
    console.log('######### option', option);
    // const data = await API.post<MultiQuestionResponse>(answer, params as QueryParams);
    // if (data) {
    //   if (data.message) {
    //     setMessage(data.message);
    //     setOpen(true);
    //   }
    //   if (data.items.length > 0) {
    //     setItems(data.items);
    //     setOpen(true);
    //   }
    // }
  };

  useEffect(() => {
    const data = new TaskHandlerService().getTaskFromParams<QuestionMultiTask>();
    console.log('############ data', data);
    if (data) {
      setTask(data);
    }
  }, []);

  return (
    <>
      {task?.image_url && (
        <div className="flex justify-center">
          <img src={task.image_url} className="max-h-64 w-full" />
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
        </>
      ) : (
        <Loading />
      )}
    </>
  );
};

Multi.displayName = Page.Multi;
export default Multi;
