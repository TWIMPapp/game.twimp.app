import ItemsDialog from '@/components/ItemsDialog';
import Loading from '@/components/Loading';
import { APIService } from '@/services/API';
import { TaskHandlerService } from '@/services/TaskHandler';
import { Endpoint } from '@/typings/Endpoint.enum';
import { NextResponse } from '@/typings/NextResponse';
import QueryParams from '@/typings/QueryParams';
import { InformationTask, TaskUnion } from '@/typings/Task';
import { InventoryItem } from '@/typings/inventoryItem';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Information() {
  const [task, setTask] = useState<InformationTask>();
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [params, setParams] = useState<QueryParams>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  const goToNextTask = async () => {
    const body = {
      user_id: params?.user_id,
      trail_ref: params?.trail_ref,
      debug: true
    };
    const data = await new APIService(Endpoint.Next).post<NextResponse>(
      { body },
      {
        user_id: params?.user_id ?? '',
        trail_ref: params?.trail_ref ?? ''
      }
    );

    if (data) {
      if (data.task) {
        setNextTask(data.task);

        if ((data.outcome?.items ?? [])?.length > 0) {
          setItems(data?.outcome?.items ?? []);
          setOpen(true);
        } else {
          new TaskHandlerService().goToTaskComponent(data.task as TaskUnion, params as QueryParams);
        }
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (nextTask) {
      new TaskHandlerService().goToTaskComponent(nextTask, params as QueryParams);
    }
  };

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;

      if (_params?.task) {
        setParams(_params);
        const data = new TaskHandlerService().getTaskFromParams<InformationTask>();

        if (data) {
          setTask(data);
        }
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {!task && <Loading></Loading>}
      {task?.image_url && (
        <div
          className="flex justify-center h-48 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(' + task.image_url + ')' }}
        ></div>
      )}
      {task?.content && (
        <div className="markdown-body p-4">
          <Markdown remarkPlugins={[remarkGfm]}>{task.content}</Markdown>
        </div>
      )}
      <div className="flex justify-end p-4 pb-16">
        <Button className="px-4 py-2" onClick={goToNextTask} variant="contained">
          Next
        </Button>
      </div>
      <ItemsDialog items={items} open={open} handleClose={handleClose}></ItemsDialog>
    </>
  );
}
