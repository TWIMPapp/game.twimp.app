import Loading from '@/components/Loading';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import { FinishTask } from '@/typings/Task';
import { Button } from '@mui/material';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Finish() {
  const [task, setTask] = useState<FinishTask>();
  const [params, setParams] = useState<QueryParams>();
  const { isAuthenticated, isLoading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;

      if (_params) {
        setParams(_params);
        const data = new TaskHandlerService().getTaskFromSession<FinishTask>();
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
              <Button
                variant="contained"
                fullWidth
                className="cy-finish mt-6"
                onClick={() => window.location.assign('/')}
                sx={{ borderRadius: '16px', py: 1.5 }}
              >
                Finish
              </Button>
              {!isLoading && !isAuthenticated && (
                <Button
                  variant="outlined"
                  fullWidth
                  className="cy-finish-signin mt-3"
                  onClick={() => setShowSignIn(true)}
                  sx={{ borderRadius: '16px', py: 1.5, textTransform: 'none', fontWeight: 600 }}
                >
                  {/* PLACEHOLDER copy — Nadia to finalise */}
                  Save this adventure &amp; hear about new trails
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <LoginRequiredModal open={showSignIn} onClose={() => setShowSignIn(false)} action="finished" />
    </>
  );
}
