import Loading from '@/components/Loading';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import { FinishTask } from '@/typings/Task';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Finish() {
  const [task, setTask] = useState<FinishTask>();
  const [params, setParams] = useState<QueryParams>();

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;

      if (_params?.task) {
        setParams(_params);
        const data = new TaskHandlerService().getTaskFromParams<FinishTask>();
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
          className="bg-cover bg-center bg-no-repeat absolute h-80 w-full"
          style={{ backgroundImage: 'url(' + task.image_url + ')' }}
        >
          {task?.content && (
            <div className="markdown-body mt-72 p-8 pb-52 rounded-tl-3xl rounded-tr-3xl relative">
              <Markdown remarkPlugins={[remarkGfm]}>{task.content}</Markdown>
            </div>
          )}
        </div>
      )}
    </>
  );
}
