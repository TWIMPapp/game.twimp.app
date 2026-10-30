import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import { useBatchTask } from '@/hooks/useBatchTask';
import { BatchStore } from '@/services/BatchStore';

import { IconButton } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import GamePage from '@/components/GamePage';
import { useGamePage } from '@/hooks/useGamePage';
import { MapTask, Outcome, TaskUnion } from '@/typings/Task';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import { InventoryItem } from '@/typings/inventoryItem';
import ItemsDialog from '@/components/ItemsDialog';
import Loading from '@/components/Loading';
import { useGeolocation } from '@/hooks/useGeolocation';

const RotatingTaskMap = dynamic(() => import('@/components/RotatingTaskMap'), {
  ssr: false
});

const AWTY_INTERVAL = 5000;
const MAX_GPS_ACCURACY_M = 25;

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
): Promise<AwtyResponse | undefined> => {
  const prevTaskId = new TaskHandlerService().getPrevTaskIdFromSession();

  const body = {
    lat: position?.coords?.latitude,
    lng: position?.coords?.longitude,
    accuracy: position?.coords?.accuracy,
    task_id: prevTaskId ?? null,
    user_id: params?.user_id,
    trail_ref: params?.trail_ref,
    batch: true
  };

  return await new APIService(Endpoint.Awty).post<AwtyResponse>(body, {
    user_id: params?.user_id,
    trail_ref: params?.trail_ref
  });
};

// Dev-only convenience: when on localhost or visited with ?testMode=1, the
// blue dot becomes a draggable marker. Drag it to a pin to
// simulate walking there — fires AWTY exactly as a real GPS update would.
const detectTestMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return true;
  return new URLSearchParams(window.location.search).get('testMode') === '1';
};

export default function Map({ testTask }: { testTask?: MapTask }) {
  const { task, params } = useBatchTask<MapTask>(testTask);
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [awtyResponse, setAwtyResponse] = useState<AwtyResponse>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [recenterSignal, setRecenterSignal] = useState<number>(0);
  const isAwtyRequestPending = useRef<boolean>(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  // Live GPS — feeds the blue dot, the recenter button, and the AWTY pings
  // that progress the game.
  const { position: userPosition } = useGeolocation();
  const recentAccuraciesRef = useRef<number[]>([]);

  // Test mode: the user-location marker is draggable. testLocation overrides
  // the real GPS reading once the player drags.
  const [isTestMode] = useState<boolean>(detectTestMode);
  const [testLocation, setTestLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { gamePageOpen, openGamePage, closeGamePage } = useGamePage();
  const bannerSwipeStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!userPosition) return;
    const acc =
      typeof userPosition.accuracy === 'number' && Number.isFinite(userPosition.accuracy)
        ? userPosition.accuracy
        : 10;
    const history = recentAccuraciesRef.current;
    const isFirstFix = history.length === 0;
    const avgAcc = isFirstFix
      ? acc
      : history.reduce((sum, a) => sum + a, 0) / history.length;

    history.push(Math.min(acc, MAX_GPS_ACCURACY_M));
    if (history.length > 10) {
      history.shift();
    }

    if (!isFirstFix && (acc > MAX_GPS_ACCURACY_M || acc > avgAcc * 2)) {
      return;
    }

    if (!isTestMode && params) {
      handleOnPlayerMove(userPosition.lat, userPosition.lng, acc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPosition, params, isTestMode]);

  useEffect(() => {
    if (!isTestMode || testLocation) return;
    if (userPosition) {
      setTestLocation({ lat: userPosition.lat, lng: userPosition.lng });
      return;
    }
    const firstMarker = task?.markers?.[0];
    if (firstMarker && typeof firstMarker === 'object' && 'lat' in firstMarker) {
      setTestLocation({ lat: firstMarker.lat - 0.0003, lng: firstMarker.lng - 0.0003 });
    }
  }, [isTestMode, testLocation, userPosition, task]);

  const handleClose = () => {
    setOpen(false);
    if (nextTask) {
      new TaskHandlerService().goToTaskComponent(nextTask, params as QueryParams);
    }
  };

  const handleOnPlayerMove = async (lat: number, lng: number, accuracy: number = 10) => {
    if (isTestMode) setTestLocation({ lat, lng });

    if (isAwtyRequestPending.current) {
      return;
    }

    isAwtyRequestPending.current = true;

    const position = {
      coords: { latitude: lat, longitude: lng, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
      timestamp: Date.now()
    } as GeolocationPosition;

    try {
      const data = await AWTYPost(position, params as QueryParams);

      if (data) {
        if (data.task) {
          BatchStore.saveFromResponse(params, data);
          setNextTask(data.task);

          if ((data.outcome?.items ?? [])?.length > 0) {
            setItems(data?.outcome?.items ?? []);
            setOpen(true);
          } else {
            new TaskHandlerService().goToTaskComponent(data.task, params as QueryParams);
          }
        } else {
          setAwtyResponse(data);
        }
      }
    } catch (error) {
      console.error('Error during AWTY post:', error);
    } finally {
      timeoutIdRef.current = setTimeout(() => {
        isAwtyRequestPending.current = false;
      }, AWTY_INTERVAL);
    }
  };

  const handleCenterOnLocation = () => {
    setRecenterSignal((s) => s + 1);
  };

  // Matches the API's AWTY rejection threshold (GameEngineService: accuracy > 30m)
  const weakGps = !isTestMode && typeof userPosition?.accuracy === 'number' && userPosition.accuracy > 30;

  const activeUserLocation = isTestMode
    ? testLocation
    : userPosition
      ? { lat: userPosition.lat, lng: userPosition.lng }
      : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Top section: Full rotating map */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, width: '100%' }}>
        {task ? (
          <RotatingTaskMap
            taskMarkers={task?.markers ?? []}
            userLocation={activeUserLocation}
            userAccuracy={userPosition?.accuracy ?? 10}
            onPlayerMove={handleOnPlayerMove}
            testMode={isTestMode}
            showMarkerLabels
            recenterSignal={recenterSignal}
          />
        ) : (
          <Loading />
        )}
      </div>

      {/* Bottom section: White panel with Journal button (left), Message (middle), Centre on location button (right) */}
      <div
        data-testid="map-bottom-panel"
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.12)',
          paddingTop: '12px',
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          touchAction: 'pan-y'
        }}
        onPointerDown={(e) => {
          bannerSwipeStart.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const s = bannerSwipeStart.current;
          bannerSwipeStart.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (dx > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) openGamePage();
        }}
      >
        <IconButton
          onClick={openGamePage}
          aria-label="open journal"
          data-testid="open-journal"
          sx={{
            flexShrink: 0,
            color: '#1e293b',
            bgcolor: 'rgba(15, 23, 42, 0.06)',
            '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.12)' },
            width: 44,
            height: 44
          }}
        >
          <MenuBookIcon />
        </IconButton>

        <div
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '0 4px',
            minWidth: 0
          }}
        >
          {task?.content && (
            <h2
              className="text-base font-semibold leading-snug m-0"
              style={{ color: '#0f172a', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: task.content }}
            />
          )}
          {awtyResponse?.message && (
            <p
              className="text-sm leading-snug m-0 mt-1"
              style={{ color: '#475569', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: awtyResponse.message }}
            />
          )}
        </div>

        <IconButton
          onClick={handleCenterOnLocation}
          aria-label={weakGps ? 'weak GPS signal, center map on my location' : 'center map on my location'}
          data-testid="center-location"
          data-weak-gps={weakGps ? 'true' : 'false'}
          sx={{
            flexShrink: 0,
            color: weakGps ? '#ffffff' : '#1e293b',
            bgcolor: weakGps ? '#dc2626' : 'rgba(15, 23, 42, 0.06)',
            '&:hover': { bgcolor: weakGps ? '#b91c1c' : 'rgba(15, 23, 42, 0.12)' },
            width: 44,
            height: 44,
            animation: weakGps ? 'twimpWeakGpsPulse 1.2s ease-in-out infinite' : 'none',
            '@keyframes twimpWeakGpsPulse': {
              '0%, 100%': { opacity: 1, boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.6)' },
              '50%': { opacity: 0.55, boxShadow: '0 0 0 8px rgba(220, 38, 38, 0)' }
            }
          }}
        >
          <MyLocationIcon />
        </IconButton>
      </div>

      <ItemsDialog items={items} open={open} handleClose={handleClose} />
      {gamePageOpen && <GamePage open={gamePageOpen} handleClose={closeGamePage} />}
    </div>
  );
}
