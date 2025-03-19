import Loading from '@/components/Loading';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import { HuntTask, TaskUnion } from '@/typings/Task';
import { useEffect, useRef, useState } from 'react';
import { Position } from '@/hooks/useGeolocation';
import { useGeolocation } from '@/hooks/useGeolocation';
import HuntGame from '@/components/HuntGame';
import { MapPin } from 'lucide-react';
import { BaseTask } from '@/components/BaseTask';

const WAVE_DURATION = 30; // 30 seconds per treasure
const COLLISION_DISTANCE = 0.00002; // Distance in degrees for collision detection (about 2 meters)
const MIN_ACCURACY = 10; // Minimum accuracy in meters (10 meters is a good balance for outdoor GPS)

export interface GameState {
  timeRemaining: number;
  isPlaying: boolean;
  playerPosition: Position | null;
  treasurePosition: Position | null;
  score: number;
}

function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.lat - pos2.lat;
  const dy = pos1.lng - pos2.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function Hunt({ testTask }: { testTask?: HuntTask }) {
  const [task, setTask] = useState<HuntTask>();
  const [params, setParams] = useState<QueryParams>();

  const { position, error, isLoading } = useGeolocation();
  const [gameState, setGameState] = useState<GameState>({
    timeRemaining: WAVE_DURATION,
    isPlaying: false,
    playerPosition: null,
    treasurePosition: null,
    score: 0
  });

  console.log("POSITION",position);

  // Use ref to track the latest game state without triggering re-renders
  const latestGameState = useRef(gameState);

  const [startingPosition, setStartingPosition] = useState<Position | null>(null);

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

  const spawnTreasure = (playerPos: Position): Position => {
    const maxDistance = 0.0009; // Maximum distance in degrees (100 meters)
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * maxDistance;

    return {
      lat: startingPosition!.lat + Math.cos(angle) * distance,
      lng: startingPosition!.lng + Math.sin(angle) * distance
    };
  };

  const startGame = () => {
    if (!position) return;

    // Only start if we have an accurate position
    if (position.accuracy && position.accuracy > MIN_ACCURACY) {
      alert('Please wait for better GPS accuracy before starting the game.');
      return;
    }

    // Set starting position first
    setStartingPosition(position);

    // Then start the game with initial state
    setGameState({
      timeRemaining: WAVE_DURATION,
      isPlaying: true,
      playerPosition: position,
      treasurePosition: null, // We'll set this in the effect
      score: 0
    });
  };

  // Spawn initial treasure when startingPosition is set
  useEffect(() => {
    if (startingPosition && gameState.isPlaying && !gameState.treasurePosition) {
      setGameState(prev => ({
        ...prev,
        treasurePosition: spawnTreasure(startingPosition)
      }));
    }
  }, [startingPosition, gameState.isPlaying]);

  // Update player position based on GPS
  useEffect(() => {
    if (!gameState.isPlaying || !position) return;

    // Only update position if accuracy is good enough or not provided
    if (!position.accuracy || position.accuracy <= MIN_ACCURACY) {
      setGameState(prev => ({
        ...prev,
        playerPosition: position
      }));
    }
  }, [gameState.isPlaying, position]);

  // Update time remaining
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameInterval = setInterval(() => {
      setGameState((prev) => {
        latestGameState.current = {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        };
        return latestGameState.current;
      });
    }, 1000);

    return () => clearInterval(gameInterval);
  }, [gameState.isPlaying]);

  // Check for collisions and update game state
  useEffect(() => {
    if (!gameState.isPlaying || !gameState.playerPosition || !gameState.treasurePosition) return;

    // Check for collision with treasure
    const distance = calculateDistance(gameState.playerPosition, gameState.treasurePosition);
    if (distance < COLLISION_DISTANCE) {
      // Treasure collected! Spawn new treasure
      const newTreasurePosition = spawnTreasure(gameState.playerPosition);
      setGameState((prev) => {
        const newState = {
          ...prev,
          timeRemaining: WAVE_DURATION,
          treasurePosition: newTreasurePosition,
          score: prev.score + 1
        };
        latestGameState.current = newState;
        return newState;
      });
    }

    // Check for time running out
    if (gameState.timeRemaining <= 0) {
      setGameState((prev) => {
        const newState = {
          ...prev,
          isPlaying: false
        };
        latestGameState.current = newState;
        return newState;
      });
      alert(`Game Over! Final Score: ${gameState.score}`);
    }
  }, [gameState.isPlaying, gameState.timeRemaining, gameState.playerPosition]);

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
    <BaseTask params={params} testTask={testTask}>
      {!task && <Loading />}
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {!gameState.isPlaying ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Treasure Hunt</h1>
              <p className="text-gray-600 mb-6">
                Find the treasure before the timer runs out!
              </p>
              <p className="text-gray-600 mb-6">Move around to find the treasure</p>
              {position && position.accuracy && position.accuracy > MIN_ACCURACY && (
                <p className="text-yellow-600 mb-4">
                  Waiting for better GPS accuracy... ({Math.round(position.accuracy)}m)
                </p>
              )}
              <button
                onClick={startGame}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={Boolean(position?.accuracy && position.accuracy > MIN_ACCURACY)}
              >
                Start Game
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 shadow-md">
              <div className="flex justify-between items-center max-w-4xl mx-auto">
                <div className="text-lg font-semibold">Score: {gameState.score}</div>
                <div className="text-lg font-semibold">Time: {gameState.timeRemaining}s</div>
                <div className="text-sm text-gray-600">
                  GPS Accuracy: {gameState.playerPosition?.accuracy ? Math.round(gameState.playerPosition.accuracy) + 'm' : 'N/A'}
                </div>
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
    </BaseTask>
  );
}
