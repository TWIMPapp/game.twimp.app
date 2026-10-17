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
import { SpeedDial, SpeedDialAction } from '@mui/material';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MenuIcon from '@mui/icons-material/Menu';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import GamePage from '@/components/GamePage';
import SwipeCard from '@/components/SwipeCard';
import { useGamePage, useSwipeTutorial } from '@/hooks/useGamePage';
import { useBatchTask } from '@/hooks/useBatchTask';
import { BatchCard, BatchStore } from '@/services/BatchStore';
import { GamePageBody } from '@/components/GamePage';
// MapDialog is broken (calls a non-existent /map endpoint) — hidden for now;
// it can come back as a third tab on the game page.

export default function Information({ testTask }: { testTask?: InformationTask }) {
  const { task, params, swapTo } = useBatchTask<InformationTask>(testTask);
  // Next card from the local batch, pre-rendered under the top card.
  const [peekCard, setPeekCard] = useState<BatchCard | null>(null);
  useEffect(() => {
    if (!task || !params) return;
    const next = BatchStore.peek(params);
    setPeekCard(next);
    if (next?.image_url) {
      const img = new Image();
      img.src = next.image_url;
    }
  }, [task, params]);
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [nextTaskLoading, setNextTaskLoading] = useState<boolean>(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [openItems, setOpenItems] = useState<boolean>(false);
  const { gamePageOpen, openGamePage, closeGamePage } = useGamePage();
  const { showTutorial, dismissTutorial } = useSwipeTutorial(task?.content);

  const handleOpenSupport = () => {
    if ((window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:open']);
    }
  };

  // Sync for local cards (so SwipeCard can reset instantly on 'swapped');
  // falls through to fetchNext() when the batch is exhausted.
  const goToNextTask = (): boolean | 'swapped' | Promise<boolean | 'swapped'> => {
    if (nextTaskLoading) return true;

    // Batch-next: the next card is already stored locally — no round-trip.
    // Cards flagged server_call_required are cross-checked in the background
    // by the page that renders them (useBatchTask), never blocking the swipe.
    const local = BatchStore.advance(params);
    if (local) {
      // Next story card with nothing to announce: swap in place — it is
      // already rendered underneath, so this is instant (no navigation).
      if (local.type === 'information' && !(local.items ?? []).length) {
        swapTo(local);
        window.scrollTo(0, 0);
        return 'swapped';
      }
      if ((local.items ?? []).length > 0) {
        setNextTask(local as TaskUnion);
        setItems(local.items ?? []);
        setOpenItems(true);
      } else {
        new TaskHandlerService().goToTaskComponent(local as TaskUnion, params as QueryParams);
      }
      return true;
    }

    return fetchNext();
  };

  const fetchNext = async (): Promise<boolean | 'swapped'> => {
    setNextTaskLoading(true);

    const body = {
      user_id: params?.user_id,
      trail_ref: params?.trail_ref,
      batch: true,
      debug: true
    };
    const data = await new APIService(Endpoint.Next).post<NextResponse>(
      { body, batch: true },
      {
        user_id: params?.user_id ?? '',
        trail_ref: params?.trail_ref ?? ''
      }
    );

    if (data?.task) {
      BatchStore.saveFromResponse(params, data);
      if (data.task.type === 'information' && !(data.outcome?.items ?? []).length) {
        const first = BatchStore.current(params);
        if (first) {
          swapTo(first);
          window.scrollTo(0, 0);
          setNextTaskLoading(false);
          return 'swapped';
        }
      }
      setNextTask(data.task);

      if ((data.outcome?.items ?? [])?.length > 0) {
        setItems(data?.outcome?.items ?? []);
        setOpenItems(true);
        setNextTaskLoading(false); // dialog shown, we're not navigating yet
      } else {
        new TaskHandlerService().goToTaskComponent(data.task as TaskUnion, params as QueryParams);
        // navigating away — spinner goes with the page
      }
      return true;
    } else {
      // Server didn't return a next task (e.g. we're sitting on an unanswered
      // question) — clear the spinner so the button can't get stuck.
      setNextTaskLoading(false);
      return false;
    }
  };

  const handleClose = () => {
    setOpenItems(false);
    if (nextTask) {
      new TaskHandlerService().goToTaskComponent(nextTask, params as QueryParams);
    }
  };


  // Android Back can restore this page from the bfcache with stale React state
  // (notably nextTaskLoading=true), leaving the Next button stuck spinning.
  // Reset it whenever the page is shown from the cache.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setNextTaskLoading(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  return (
    <>
      {!task && <Loading></Loading>}
      {nextTaskLoading && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
          <Loading />
        </div>
      )}
      <SwipeCard
        underLeft={peekCard ? <CardPreview card={peekCard} /> : undefined}
        underRight={task ? <GamePageBody tab="journal" key={String(task.id)} /> : undefined}
        onSwipeLeft={goToNextTask} onSwipeRight={openGamePage} onAnySwipe={dismissTutorial} demo={showTutorial && !!task} onDemoTap={dismissTutorial}>
      <div
        className={task?.image_url ? 'bg-cover bg-center bg-no-repeat absolute h-80 w-full' : ''}
        style={{ backgroundImage: task?.image_url ? 'url(' + task.image_url + ')' : undefined }}
      >
        {task?.video_url && (
          <video
            key={task.video_url}
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
            tooltipTitle="Journal & Items"
            tooltipOpen
            onClick={openGamePage}
          />
          <SpeedDialAction
            className="cy-speeddial-support"
            icon={<ContactSupportIcon />}
            tooltipTitle="Support"
            tooltipOpen
            onClick={() => handleOpenSupport()}
          />
        </SpeedDial>

        {task?.content && (
          <div className="markdown-body mt-72 p-8 pb-80 bg-white dark:bg-gray-800 dark:text-white rounded-tl-3xl rounded-tr-3xl relative">
            {task.audio_url && (
              <audio
                key={task.audio_url}
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
      </SwipeCard>
      {openItems && (
        <ItemsDialog items={items} open={openItems} handleClose={handleClose}></ItemsDialog>
      )}
      {gamePageOpen && (
        <GamePage open={gamePageOpen} handleClose={closeGamePage} underCard={task ? <CardPreview card={task as any} /> : undefined} />
      )}
    </>
  );
}

// Static look-alike of the next card, shown underneath while dragging left.
// Same layout as the live information card (image band, rounded content
// sheet); for map/question cards it shows their image + text as a preview.
function CardPreview({ card }: { card: BatchCard }) {
  const c: any = card;
  return (
    <div className="relative w-full min-h-screen" data-testid="card-preview" data-card-id={String(c.id)}>
      <div
        className={c.image_url ? 'bg-cover bg-center bg-no-repeat absolute h-80 w-full' : ''}
        style={{ backgroundImage: c.image_url ? 'url(' + c.image_url + ')' : undefined }}
      >
        {c.content && (
          <div className="markdown-body mt-72 p-8 pb-80 bg-white dark:bg-gray-800 dark:text-white rounded-tl-3xl rounded-tr-3xl relative">
            <Markdown remarkPlugins={[remarkGfm]}>{c.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
