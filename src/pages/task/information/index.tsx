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
import { Box, Button, SpeedDial, SpeedDialAction, SpeedDialIcon, styled } from '@mui/material';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BackpackIcon from '@mui/icons-material/Backpack';
import MapIcon from '@mui/icons-material/Map';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import InventoryDialog from '@/components/inventoryDialog';
import MapDialog from '@/components/mapDialog';

export default function Information() {
  const [task, setTask] = useState<InformationTask>();
  const [nextTask, setNextTask] = useState<TaskUnion>();
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
          className="bg-cover bg-center bg-no-repeat absolute h-80"
          style={{ backgroundImage: 'url(' + task.image_url + ')' }}
        >
          <SpeedDial
            ariaLabel={''}
            sx={{ position: 'absolute', top: 260, right: 16 }}
            icon={<SpeedDialIcon />}
            direction="down"
          >
            <SpeedDialAction
              icon={<MenuBookIcon />}
              tooltipTitle="Journal"
              tooltipOpen
              onClick={() => setOpenJournal(true)}
            />
            <SpeedDialAction
              icon={<BackpackIcon />}
              tooltipTitle="Inventory"
              tooltipOpen
              onClick={() => setOpenInventory(true)}
            />
            <SpeedDialAction
              icon={<MapIcon />}
              tooltipTitle="Map"
              tooltipOpen
              onClick={() => setOpenMap(true)}
            />
            <SpeedDialAction
              icon={<ContactSupportIcon />}
              tooltipTitle="Support"
              tooltipOpen
              onClick={() => handleOpenSupport()}
            />
          </SpeedDial>
          <Box
            className="fixed rounded-3xl bg-white shadow-md m-auto top-4 right-4"
            sx={{ zIndex: 999 }}
          >
            <div className="flex justify-between p-2">
              <Button className="px-4 py-2" onClick={goToNextTask} variant="text">
                Next →
              </Button>
            </div>
          </Box>

          {task?.content && (
            <div className="markdown-body mt-72 p-8 pb-52 rounded-tl-3xl rounded-tr-3xl relative">
              <Markdown remarkPlugins={[remarkGfm]}>{task.content}</Markdown>
            </div>
          )}
        </div>
      )}
      <ItemsDialog items={items} open={openItems} handleClose={handleClose}></ItemsDialog>
      <JournalDialog open={openJournal} handleClose={handleJournalClose} />
      <InventoryDialog open={openInventory} handleClose={handleInventoryClose} />
      <MapDialog open={openMap} handleClose={handleMapClose} />
    </>
  );
}
