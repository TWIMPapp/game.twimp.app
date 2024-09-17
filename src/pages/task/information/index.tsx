import ItemsDialog from '@/components/ItemsDialog';
import JournalDialog from '@/components/JournalDialog';
import Loading from '@/components/Loading';
import { APIService } from '@/services/API';
import { TaskHandlerService } from '@/services/TaskHandler';
import { Endpoint } from '@/typings/Endpoint.enum';
import { NextResponse } from '@/typings/NextResponse';
import QueryParams from '@/typings/QueryParams';
import { InformationTask, TaskUnion } from '@/typings/Task';
import { InventoryItem } from '@/typings/inventoryItem';
import { Box, Button, SpeedDial, SpeedDialAction } from '@mui/material';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BackpackIcon from '@mui/icons-material/Backpack';
import MapIcon from '@mui/icons-material/Map';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MenuIcon from '@mui/icons-material/Menu';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import InventoryDialog from '@/components/inventoryDialog';
import MapDialog from '@/components/mapDialog';

export default function Information({ testTask }: { testTask?: InformationTask }) {
  const [task, setTask] = useState<InformationTask>();
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [nextTaskLoading, setNextTaskLoading] = useState<boolean>(false);
  const [params, setParams] = useState<QueryParams>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [openItems, setOpenItems] = useState<boolean>(false);
  const [openJournal, setOpenJournal] = useState<boolean>(false);
  const [openInventory, setOpenInventory] = useState<boolean>(false);
  const [openMap, setOpenMap] = useState<boolean>(false);

  const handleJournalClose = () => {
    setOpenJournal(false);
  };

  const handleInventoryClose = () => {
    setOpenInventory(false);
  };

  const handleMapClose = () => {
    setOpenMap(false);
  };

  const handleOpenSupport = () => {
    if ((window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:open']);
    }
  };

  const goToNextTask = async () => {
    setNextTaskLoading(true);

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
          setOpenItems(true);
        } else {
          new TaskHandlerService().goToTaskComponent(data.task as TaskUnion, params as QueryParams);
        }
      }
    }
  };

  const handleClose = () => {
    setOpenItems(false);
    if (nextTask) {
      new TaskHandlerService().goToTaskComponent(nextTask, params as QueryParams);
    }
  };

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;

      if (_params) {
        setParams(_params);
        const data = new TaskHandlerService().getTaskFromSession<InformationTask>();

        if (data) {
          setTask(data);
        }
      }
    };

    if (testTask?.id) {
      setTask(testTask);
    } else {
      fetchData();
    }
  }, [testTask]);

  return (
    <>
      {!task && <Loading></Loading>}
      <div
        className={task?.image_url ? 'bg-cover bg-center bg-no-repeat absolute h-80 w-full' : ''}
        style={{ backgroundImage: task?.image_url ? 'url(' + task.image_url + ')' : undefined }}
      >
        {/* video tag to play a video by url */}
        {task?.video_url && (
          <video
            className="absolute w-full top-0"
            autoPlay
            loop
            muted
            controls
            controlsList="nodownload"
            width="220"
            height="auto"
          >
            <source src={task?.video_url} type="video/mp4" />
          </video>
        )}
        <SpeedDial
          className="cy-speeddial"
          ariaLabel={''}
          sx={{ position: 'absolute', top: 260, right: 16, zIndex: 99 }}
          icon={<MenuIcon />}
          direction="down"
        >
          <SpeedDialAction
            className="cy-speeddial-journal"
            icon={<MenuBookIcon />}
            tooltipTitle="Journal"
            tooltipOpen
            onClick={() => setOpenJournal(true)}
          />
          <SpeedDialAction
            className="cy-speeddial-inventory"
            icon={<BackpackIcon />}
            tooltipTitle="Inventory"
            tooltipOpen
            onClick={() => setOpenInventory(true)}
          />
          <SpeedDialAction
            className="cy-speeddial-map"
            icon={<MapIcon />}
            tooltipTitle="Map"
            tooltipOpen
            onClick={() => setOpenMap(true)}
          />
          <SpeedDialAction
            className="cy-speeddial-support"
            icon={<ContactSupportIcon />}
            tooltipTitle="Support"
            tooltipOpen
            onClick={() => handleOpenSupport()}
          />
        </SpeedDial>
        <Box
          className="fixed rounded-3xl bg-white dark:bg-gray-800 dark:text-white shadow-md m-auto top-12 right-4"
          sx={{ zIndex: 999 }}
        >
          <div className="flex justify-between p-2">
            <Button className="cy-next px-4 py-2" onClick={goToNextTask} variant="text">
              {/* show loader or text */}
              {nextTaskLoading ? <Loading /> : 'Next →'}
            </Button>
          </div>
        </Box>

        {task?.content && (
          <div className="markdown-body mt-72 p-8 pb-80 bg-white dark:bg-gray-800 dark:text-white rounded-tl-3xl rounded-tr-3xl relative">
            {task.audio_url && (
              <audio
                controls
                controlsList="nodownload nofullscreen"
                className="cy-audio-player w-full mb-4"
                src={task.audio_url}
                autoPlay={task.audio_autoplay}
                onEnded={() => {
                  if (task.audio_autonext) {
                    setTimeout(() => goToNextTask(), 1000);
                  }
                }}
              ></audio>
            )}
            <Markdown remarkPlugins={[remarkGfm]}>{task.content}</Markdown>
          </div>
        )}
      </div>
      {openItems && (
        <ItemsDialog items={items} open={openItems} handleClose={handleClose}></ItemsDialog>
      )}
      {openJournal && <JournalDialog open={openJournal} handleClose={handleJournalClose} />}
      {openInventory && <InventoryDialog open={openInventory} handleClose={handleInventoryClose} />}
      {openMap && <MapDialog open={openMap} handleClose={handleMapClose} />}
    </>
  );
}
