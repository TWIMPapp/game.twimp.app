import Loading from '@/components/Loading';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import { InformationTask } from '@/typings/Task';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Information() {
  const [task, setTask] = useState<InformationTask>();
  const [params, setParams] = useState<QueryParams>();

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
      <div className="flex justify-end p-4">
        <Button className="px-4 py-2" onClick={() => ''}>
          Next
        </Button>
      </div>
    </>
  );
}
