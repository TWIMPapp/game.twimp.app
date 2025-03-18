import ItemsDialog from '@/components/ItemsDialog';
import JournalDialog from '@/components/JournalDialog';
import Loading from '@/components/Loading';
import { APIService } from '@/services/API';
import { TaskHandlerService } from '@/services/TaskHandler';
import { Endpoint } from '@/typings/Endpoint.enum';
import { NextResponse } from '@/typings/NextResponse';
import QueryParams from '@/typings/QueryParams';
import { EvadeTask, TaskUnion } from '@/typings/Task';
import { InventoryItem } from '@/typings/inventoryItem';
import { useEffect, useRef, useState } from 'react';
import InventoryDialog from '@/components/inventoryDialog';
import MapDialog from '@/components/mapDialog';
import { Position } from '@/hooks/useGeolocation';
import { useGeolocation } from '@/hooks/useGeolocation';
import EvadeGame, { SearchCircle } from '@/components/EvadeGame';
import { MapPin } from 'lucide-react';

export interface GameState {
  level: number;
  timeRemaining: number;
  isPlaying: boolean;
  playerPosition: Position | null;
  searchCircles: SearchCircle[];
}

const WAVE_DURATION = 60;
const CIRCLE_UPDATE_INTERVAL = 50;
const MAX_DISTANCE = 500; // Maximum distance in meters
const DIRECTION_CHANGE_PROBABILITY = 0.02; // 2% chance to change direction each update

function calculateDistance(pos1: Position, pos2: Position): number {
  return Math.sqrt(
    Math.pow((pos1.lat - pos2.lat) * 111000, 2) +
      Math.pow((pos1.lng - pos2.lng) * 111000 * Math.cos((pos1.lat * Math.PI) / 180), 2)
  );
}

export default function Evade({ testTask }: { testTask?: EvadeTask }) {
  const [task, setTask] = useState<EvadeTask>();
  const [nextTask, setNextTask] = useState<TaskUnion>();
  const [nextTaskLoading, setNextTaskLoading] = useState<boolean>(false);
  const [params, setParams] = useState<QueryParams>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [openItems, setOpenItems] = useState<boolean>(false);
  const [openJournal, setOpenJournal] = useState<boolean>(false);
  const [openInventory, setOpenInventory] = useState<boolean>(false);
  const [openMap, setOpenMap] = useState<boolean>(false);

  const { position, error } = useGeolocation();
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    timeRemaining: WAVE_DURATION,
    isPlaying: false,
    playerPosition: null,
    searchCircles: []
  });

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
        const data = new TaskHandlerService().getTaskFromSession<EvadeTask>();

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

  const startGame = () => {
    if (!position) return;

    setGameState({
      level: 1,
      timeRemaining: WAVE_DURATION,
      isPlaying: true,
      playerPosition: position,
      searchCircles: generateSearchCircles(1, position)
    });
  };

  const generateSearchCircles = (level: number, playerPos: Position): SearchCircle[] => {
    return Array.from({ length: level }, (_, i) => ({
      id: i,
      position: {
        lat: playerPos.lat + (Math.random() - 0.5) * 0.002,
        lng: playerPos.lng + (Math.random() - 0.5) * 0.002
      },
      radius: 5,
      direction: Math.random() * Math.PI * 2,
      speed: 0.000002,
      turnRate: (Math.random() - 0.5) * 0.1
    }));
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

    // Update player position in game state when it changes
    setGameState((prev) => ({
      ...prev,
      playerPosition: position
    }));

    const moveInterval = setInterval(() => {
      const currentPosition = latestPosition.current;
      if (!currentPosition) return;

      setGameState((prev) => ({
        ...prev,
        searchCircles: prev.searchCircles.map((circle) => {
          // Calculate new position
          let newLat = circle.position.lat + Math.cos(circle.direction) * circle.speed;
          let newLng = circle.position.lng + Math.sin(circle.direction) * circle.speed;
          let newDirection = circle.direction;

          // Check if new position would be too far from player
          const newDistance = calculateDistance({ lat: newLat, lng: newLng }, currentPosition);

          // If too far or random direction change
          if (newDistance > MAX_DISTANCE || Math.random() < DIRECTION_CHANGE_PROBABILITY) {
            // Calculate direction towards current player position
            const angleToPlayer = Math.atan2(
              currentPosition.lng - circle.position.lng,
              currentPosition.lat - circle.position.lat
            );

            // Add some randomness to the new direction
            newDirection = angleToPlayer + (Math.random() - 0.5) * Math.PI;

            // Update position with new direction
            newLat = circle.position.lat + Math.cos(newDirection) * circle.speed;
            newLng = circle.position.lng + Math.sin(newDirection) * circle.speed;
          } else {
            // Gradually turn based on turnRate
            newDirection += circle.turnRate;
          }

          return {
            ...circle,
            position: { lat: newLat, lng: newLng },
            direction: newDirection
          };
        })
      }));
    }, CIRCLE_UPDATE_INTERVAL);

    return () => clearInterval(moveInterval);
  }, [gameState.isPlaying, position]);

  useEffect(() => {
    if (!gameState.isPlaying || !position) return;

    // Check for collision with current position
    const isColliding = gameState.searchCircles.some((circle) => {
      const distance = calculateDistance(position, circle.position);
      return distance < circle.radius;
    });

    if (isColliding) {
      setGameState((prev) => ({ ...prev, isPlaying: false }));
      alert(`Game Over! You reached level ${gameState.level}`);
    }

    // Check for level completion
    if (gameState.timeRemaining <= 0) {
      const nextLevel = gameState.level + 1;
      setGameState((prev) => ({
        ...prev,
        level: nextLevel,
        timeRemaining: WAVE_DURATION,
        searchCircles: generateSearchCircles(nextLevel, position)
      }));
      alert(`Level ${gameState.level} completed! Starting level ${nextLevel}`);
    }
  }, [gameState.searchCircles, position, gameState.level, gameState.timeRemaining]);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Location Error</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin mb-4">
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-gray-700">Acquiring your location...</p>
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
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Fox Escape</h1>
              <p className="text-gray-600 mb-6">
                Avoid the search lights and survive as long as you can!
              </p>
              <p className="text-gray-600 mb-6">Use arrow keys or WASD to move the fox</p>
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
              <EvadeGame playerPosition={position} searchCircles={gameState.searchCircles} />
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
