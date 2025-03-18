import ItemsDialog from '@/components/ItemsDialog';
import JournalDialog from '@/components/JournalDialog';
import Loading from '@/components/Loading';
import { APIService } from '@/services/API';
import { TaskHandlerService } from '@/services/TaskHandler';
import { Endpoint } from '@/typings/Endpoint.enum';
import { NextResponse } from '@/typings/NextResponse';
import QueryParams from '@/typings/QueryParams';
import { HuntTask, TaskUnion } from '@/typings/Task';
import { InventoryItem } from '@/typings/inventoryItem';
import { useEffect, useRef, useState } from 'react';

import InventoryDialog from '@/components/inventoryDialog';
import MapDialog from '@/components/mapDialog';
import { Position } from '@/hooks/useGeolocation';
import { useGeolocation } from '@/hooks/useGeolocation';
import HuntGame from '@/components/HuntGame';
import { MapPin } from 'lucide-react';

const WAVE_DURATION = 30; // 30 seconds per treasure
const COLLISION_DISTANCE = 0.0001; // Distance in degrees for collision detection
const MOVEMENT_SPEED = 0.00001; // Movement speed in degrees

export interface GameState {
  level: number;
  timeRemaining: number;
  isPlaying: boolean;
  playerPosition: Position | null;
  treasurePosition: Position | null;
}

function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.lat - pos2.lat;
  const dy = pos1.lng - pos2.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function Hunt({ testTask }: { testTask?: HuntTask }) {
  const [task, setTask] = useState<HuntTask>();
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [nextTaskLoading, setNextTaskLoading] = useState<boolean>(false);
  const [params, setParams] = useState<QueryParams>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [openItems, setOpenItems] = useState<boolean>(false);
  const [openJournal, setOpenJournal] = useState<boolean>(false);
  const [openInventory, setOpenInventory] = useState<boolean>(false);
  const [openMap, setOpenMap] = useState<boolean>(false);

  const { position, error, isLoading } = useGeolocation();
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    timeRemaining: WAVE_DURATION,
    isPlaying: false,
    playerPosition: null,
    treasurePosition: null
  });

  const [keyboardPosition, setKeyboardPosition] = useState<Position | null>(null);

  // Use refs to track the latest position and game state without triggering re-renders
  const latestPosition = useRef(position);
  const latestGameState = useRef(gameState);

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
        const data = new TaskHandlerService().getTaskFromSession<HuntTask>();

        console.log('###########', data);

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

  useEffect(() => {
    latestPosition.current = position;
  }, [position]);

  useEffect(() => {
    latestGameState.current = gameState;
  }, [gameState]);

  const spawnTreasure = (playerPos: Position): Position => {
    // Spawn treasure within a reasonable distance from the player
    const maxDistance = 0.002; // Maximum distance in degrees
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * maxDistance;

    return {
      lat: playerPos.lat + Math.cos(angle) * distance,
      lng: playerPos.lng + Math.sin(angle) * distance
    };
  };

  // Handle keyboard input
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!keyboardPosition) return;

      let newLat = keyboardPosition.lat;
      let newLng = keyboardPosition.lng;

      switch (e.key.toLowerCase()) {
        case 'w':
          newLat += MOVEMENT_SPEED;
          break;
        case 's':
          newLat -= MOVEMENT_SPEED;
          break;
        case 'a':
          newLng -= MOVEMENT_SPEED;
          break;
        case 'd':
          newLng += MOVEMENT_SPEED;
          break;
        default:
          return;
      }

      setKeyboardPosition({ lat: newLat, lng: newLng });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isPlaying, keyboardPosition]);

  // Update player position based on keyboard or GPS
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const currentPosition = keyboardPosition || position;
    if (!currentPosition) return;

    setGameState((prev) => ({
      ...prev,
      playerPosition: currentPosition
    }));
  }, [gameState.isPlaying, position, keyboardPosition]);

  const startGame = () => {
    if (!position) return;

    setGameState({
      level: 1,
      timeRemaining: WAVE_DURATION,
      isPlaying: true,
      playerPosition: position,
      treasurePosition: spawnTreasure(position)
    });
    setKeyboardPosition(position);
  };

  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameInterval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        timeRemaining: prev.timeRemaining - 1
      }));
    }, 1000);

    return () => clearInterval(gameInterval);
  }, [gameState.isPlaying]);

  useEffect(() => {
    if (!gameState.isPlaying || !position) return;

    // Check for collision with treasure
    if (gameState.treasurePosition) {
      const distance = calculateDistance(position, gameState.treasurePosition);
      if (distance < COLLISION_DISTANCE) {
        // Treasure collected! Spawn new treasure
        setGameState((prev) => ({
          ...prev,
          timeRemaining: WAVE_DURATION,
          treasurePosition: spawnTreasure(position)
        }));
        alert('Treasure collected! Find the next one!');
      }
    }

    // Check for time running out
    if (gameState.timeRemaining <= 0) {
      setGameState((prev) => ({
        ...prev,
        isPlaying: false
      }));
      alert('Time ran out! Game Over!');
    }
  }, [position, gameState.isPlaying, gameState.timeRemaining, gameState.treasurePosition]);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Location Error</h1>
          <p className="text-gray-700">{error}</p>
          <p className="text-gray-600 mt-4">Please make sure location services are enabled in your browser.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin mb-4">
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-gray-700">Acquiring your location...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!task && <Loading></Loading>}
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {!gameState.isPlaying ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Treasure Hunt</h1>
              <p className="text-gray-600 mb-6">
                Find the treasure before the timer runs out!
              </p>
              <p className="text-gray-600 mb-6">Use WASD keys to move the fox</p>
              <button
                onClick={startGame}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Start Game
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 shadow-md">
              <div className="flex justify-between items-center max-w-4xl mx-auto">
                <div className="text-lg font-semibold">Level: {gameState.level}</div>
                <div className="text-lg font-semibold">Time: {gameState.timeRemaining}s</div>
              </div>
            </div>
            <div className="flex-1 relative h-[calc(100vh-4rem)]">
              {gameState.playerPosition && (
                <HuntGame
                  playerPosition={gameState.playerPosition}
                  treasurePosition={gameState.treasurePosition}
                />
              )}
            </div>
          </>
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
