import { useEffect, useState } from 'react';
import Loading from '../../../components/Loading';
import { APIService } from '@/services/API';
import { Endpoint } from '@/types/Endpoint.enum';
import { Task, TaskUnion } from '@/types/Task';
import QueryParams from '@/types/QueryParams';
import { PlayResponse } from './PlayResponse.interface';
import ProgressDialog from '@/components/ProgressDialog';
import { TaskHandlerService } from '@/services/TaskHandler';

export default function Handler() {
  const [queryParams, setQueryParams] = useState<QueryParams>();
  const [startTask, setStartTask] = useState<TaskUnion>();
  const [continueTask, setContinueTask] = useState<TaskUnion>();
  const [openProgressDialog, setOpenProgressDialog] = useState(false);

  const PlayAPI = new APIService(Endpoint.Play);

  const handleProgressDialogClose = async (isRestarting: boolean) => {
    if (isRestarting && startTask) {
      const RestartAPI = new APIService(Endpoint.Restart);
      await RestartAPI.post({}, queryParams as QueryParams);
      goToTask(startTask, queryParams as QueryParams);
    } else if (continueTask) {
      goToTask(continueTask, queryParams as QueryParams);
    }
    setOpenProgressDialog(false);
  };

  const goToTask = (task: TaskUnion, params: QueryParams) => {
    new TaskHandlerService().goToTaskComponent(task, params);
  };

  useEffect(() => {
    const fetchData = async () => {
      const _queryParams = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      if (_queryParams) {
        setQueryParams(_queryParams);
        const data = await PlayAPI.get<PlayResponse>(_queryParams);

        if (data) {
          setStartTask(data.start);
          setContinueTask(data.continue);
          if (data?.continue) {
            setOpenProgressDialog(true);
          } else {
            goToTask(data.start, _queryParams);
          }
        } else {
          console.error('Error');
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ProgressDialog
        open={openProgressDialog}
        handleClose={handleProgressDialogClose}
      ></ProgressDialog>
      <Loading />
    </>
  );
}
