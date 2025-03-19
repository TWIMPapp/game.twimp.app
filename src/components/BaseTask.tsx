import { ReactNode } from 'react';
import { TaskUnion } from '@/typings/Task';
import { InventoryItem } from '@/typings/inventoryItem';
import { APIService } from '@/services/API';
import { TaskHandlerService } from '@/services/TaskHandler';
import { Endpoint } from '@/typings/Endpoint.enum';
import { NextResponse } from '@/typings/NextResponse';
import QueryParams from '@/typings/QueryParams';
import ItemsDialog from '@/components/ItemsDialog';
import JournalDialog from '@/components/JournalDialog';
import InventoryDialog from '@/components/inventoryDialog';
import MapDialog from '@/components/mapDialog';
import { useState } from 'react';

interface BaseTaskProps {
  params?: QueryParams;
  testTask?: TaskUnion;
  children: ReactNode;
}

export function BaseTask({ params, testTask, children }: BaseTaskProps) {
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [nextTaskLoading, setNextTaskLoading] = useState<boolean>(false);
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

  return (
    <>
      {children}
      {openItems && (
        <ItemsDialog items={items} open={openItems} handleClose={handleClose} />
      )}
      {openJournal && <JournalDialog open={openJournal} handleClose={handleJournalClose} />}
      {openInventory && <InventoryDialog open={openInventory} handleClose={handleInventoryClose} />}
      {openMap && <MapDialog open={openMap} handleClose={handleMapClose} />}
    </>
  );
}