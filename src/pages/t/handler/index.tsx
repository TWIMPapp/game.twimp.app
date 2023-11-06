import { useEffect, useState } from 'react';
import Loading from '../../../components/Loading';
import { APIService } from '@/services/API';
import { Endpoint } from '@/types/Endpoint.enum';
import { Task } from '@/types/Task';
import { QueryParams } from '@/types/QueryParams';
import { PlayResponse } from './PlayResponse.interface';
import ProgressDialog from '@/components/ProgressDialog';

export default function Handler() {
  const [params, setParams] = useState<QueryParams>();
  const [startTask, setStartTask] = useState<Task>();
  const [continueTask, setContinueTask] = useState<Task>();
  const [openProgressDialog, setOpenProgressDialog] = useState(false);

  const PlayAPI = new APIService(Endpoint.Play);

  const handleProgressDialogClose = (isRestarting: boolean) => {
    if (isRestarting) {
      const RestartAPI = new APIService(Endpoint.Restart);
      RestartAPI.post({}, params as QueryParams);
    } else {
      goToStartTask();
    }
    setOpenProgressDialog(false);
  };

  const goToStartTask = () => {};

  useEffect(() => {
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      if (_params) {
        setParams(_params);
        const data = await PlayAPI.get<PlayResponse>(_params);
        if (data?.continue) {
          setContinueTask(data.continue);
          setOpenProgressDialog(true);
        } else if (data?.start) {
          setStartTask(data.start);
          goToStartTask();
        }
      }
    };

    fetchData();
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
