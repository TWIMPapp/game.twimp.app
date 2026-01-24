import { useEffect, useState, useRef } from 'react';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import { Box } from '@mui/material';
import { MapTask, Outcome, TaskUnion } from '@/typings/Task';
import { Colour } from '@/typings/Colour.enum';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import MapComponent from '@/components/Map';
import { InventoryItem } from '@/typings/inventoryItem';
import ItemsDialog from '@/components/ItemsDialog';
import { TaskType } from '@/typings/TaskType.enum';

const AWTY_INTERVAL = 5000;

const MarkerColourMap: Record<Colour, string> = {
  [Colour.Green]: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  [Colour.Red]: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  [Colour.Yellow]: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  [Colour.Blue]: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  [Colour.Purple]: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  [Colour.Pink]: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
  [Colour.Orange]: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
};

interface AwtyResponse {
  ok: boolean;
  message?: string;
  distance?: number;
  direction?: string;
  task?: TaskUnion;
  outcome?: Outcome;
}

const AWTYPost = async (
  position: GeolocationPosition,
  params: QueryParams
): Promise<AwtyResponse> => {
  const prevTaskId = new TaskHandlerService().getPrevTaskIdFromSession();

  const body = {
    lat: position?.coords?.latitude,
    lng: position?.coords?.longitude,
    accuracy: position?.coords?.accuracy,
    task_id: prevTaskId ?? null,
    user_id: params?.user_id,
    trail_ref: params?.trail_ref
  };

  return await new APIService(Endpoint.Awty).post<AwtyResponse>(body, {
    user_id: params?.user_id,
    trail_ref: params?.trail_ref
  });
};

export default function Map({ testTask }: { testTask?: MapTask }) {
  const [task, setTask] = useState<MapTask>();
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [awtyResponse, setAwtyResponse] = useState<AwtyResponse>();
  const [params, setParams] = useState<QueryParams>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const isAwtyRequestPending = useRef<boolean>(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;

      if (_params) {
        setParams(_params);
        const mapTask = new TaskHandlerService().getTaskFromSession<MapTask>();

        if (mapTask) {
          setTask(mapTask);
        }
      }
    };

    if (testTask?.id) {
      setTask(testTask);
    } else {
      fetchData();
    }

    // Cleanup function to clear the timeout when the component unmounts
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [testTask]);

  const handleClose = () => {
    setOpen(false);
    if (nextTask) {
      new TaskHandlerService().goToTaskComponent(nextTask, params as QueryParams);
    }
  };

  const handleOnPlayerMove = async (lat: number, lng: number) => {
    // Check if a request is already pending or in cooldown
    if (isAwtyRequestPending.current) {
      return;
    }

    // Mark as pending
    isAwtyRequestPending.current = true;

    // Create a position-like object for the API
    const position = {
      coords: { latitude: lat, longitude: lng, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
      timestamp: Date.now()
    } as GeolocationPosition;

    try {
      const data = await AWTYPost(position, params as QueryParams);

      if (data) {
        if (data.task) {
          setNextTask(data.task);

          if ((data.outcome?.items ?? [])?.length > 0) {
            setItems(data?.outcome?.items ?? []);
            setOpen(true);
          } else {
            new TaskHandlerService().goToTaskComponent(data.task, params as QueryParams);
          }
        } else {
          // Update awtyResponse immediately if no task
          setAwtyResponse(data);
        }
      }
    } catch (error) {
        console.error("Error during AWTY post:", error);
        // Optional: handle error state if needed
    } finally {
        // Start cooldown timer and store its ID
        timeoutIdRef.current = setTimeout(() => {
          isAwtyRequestPending.current = false;
        }, AWTY_INTERVAL);
    }
  };

  return (
    <>
      {task?.content ? (
        <Box
          className="animate__animated animate__bounce rounded-3xl bg-white shadow-md p-8 dark:bg-gray-800 dark:text-white"
          sx={{
            position: 'absolute',
            width: 'calc(100% - 32px)',
            margin: '0 16px',
            top: '80px',
            zIndex: 999
          }}
        >
          <div className="text-center">
            <h2 className="text-2xl" dangerouslySetInnerHTML={{ __html: task?.content }}></h2>
            {awtyResponse?.message && (
              <p
                className="pt-2 block bg-white dark:bg-gray-800 dark:text-white"
                dangerouslySetInnerHTML={{ __html: awtyResponse?.message ?? '' }}
              ></p>
            )}
          </div>
        </Box>
      ) : null}
      {task && <MapComponent taskMarkers={task?.markers ?? []} onPlayerMove={handleOnPlayerMove} />}
      <ItemsDialog items={items} open={open} handleClose={handleClose}></ItemsDialog>
    </>
  );
}
