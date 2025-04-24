import { useEffect, useRef, useState } from 'react';
import { Position } from '@/hooks/useGeolocation';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { useDebugMode } from '@/hooks/useDebugMode';
import React from 'react';

const GAME_DURATION = 120; // 2 minutes to reach colony
const COLLISION_DISTANCE = 0.0001; // Distance in degrees (about 10 meters)
const MOVEMENT_STEP = 0.00001; // Movement amount in degrees for keyboard controls

interface GameState {
  timeRemaining: number;
  isPlaying: boolean;
  playerPosition: Position | null;
  colonyPosition: Position;
  obstacles: Position[];
  score: number;
  lastUpdateTime: number;
  distanceToColony: number;
}

interface GameProps {
  initialPosition: Position;
  colonyPosition: Position;
  obstacles: Position[];
  onGameEnd: (score: number) => void;
}

function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.lat - pos2.lat;
  const dy = pos1.lng - pos2.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

const AdventureAntsGameMap = React.lazy(() => {
  if (typeof window === 'undefined') {
    return new Promise(() => {});
  }
  return import('./AdventureAntsGameMap');
});

export default function AdventureAntsGame({ initialPosition, colonyPosition, obstacles, onGameEnd }: GameProps) {
  const [gameState, setGameState] = useState<GameState>({
    timeRemaining: GAME_DURATION,
    isPlaying: true,
    playerPosition: initialPosition,
    colonyPosition,
    obstacles,
    score: 0,
    lastUpdateTime: Date.now(),
    distanceToColony: calculateDistance(initialPosition, colonyPosition)
  });

  const { onKeyPress } = useKeyboardControls();
  const { isDebugMode } = useDebugMode();
  const latestGameState = useRef<GameState | null>(null);

  // Handle keyboard controls
  useEffect(() => {
    if (!isDebugMode || !gameState.playerPosition) return;

    const handleMovement = (key: string) => {
      const newPosition = { ...gameState.playerPosition! };

      switch (key) {
        case 'w': newPosition.lat += MOVEMENT_STEP; break;
        case 'a': newPosition.lng -= MOVEMENT_STEP; break;
        case 's': newPosition.lat -= MOVEMENT_STEP; break;
        case 'd': newPosition.lng += MOVEMENT_STEP; break;
      }

      setGameState(prev => ({ ...prev!, playerPosition: newPosition }));
    };

    ['w', 'a', 's', 'd'].forEach(key => {
      onKeyPress(key, () => handleMovement(key));
    });
  }, [onKeyPress, isDebugMode, gameState.playerPosition]);

  // Update time remaining
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameInterval = setInterval(() => {
      setGameState((prev) => {
        if (!prev) return prev;
        const newState = {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        };
        latestGameState.current = newState;
        return newState;
      });
    }, 1000);

    return () => clearInterval(gameInterval);
  }, [gameState.isPlaying]);

  // Check for collisions and update game state
  useEffect(() => {
    if (!gameState.isPlaying || !gameState.playerPosition) return;

    // Check for collision with colony
    const distanceToColony = calculateDistance(gameState.playerPosition, gameState.colonyPosition);
    if (distanceToColony < COLLISION_DISTANCE) {
      // Reached colony! End game with success
      setGameState((prev) => {
        if (!prev) return prev;
        const newState = {
          ...prev,
          isPlaying: false,
          score: 1 // Success!
        };
        latestGameState.current = newState;
        return newState;
      });
      onGameEnd(1);
      return;
    }

    // Check for collision with obstacles
    const hitObstacle = gameState.obstacles.some(obstacle =>
      calculateDistance(gameState.playerPosition!, obstacle) < COLLISION_DISTANCE
    );

    if (hitObstacle) {
      // Hit obstacle! End game with failure
      setGameState((prev) => {
        if (!prev) return prev;
        const newState = {
          ...prev,
          isPlaying: false,
          score: 0 // Failure
        };
        latestGameState.current = newState;
        return newState;
      });
      onGameEnd(0);
      return;
    }

    // Check for time running out
    if (gameState.timeRemaining <= 0) {
      setGameState((prev) => {
        if (!prev) return prev;
        const newState = {
          ...prev,
          isPlaying: false,
          score: 0 // Time's up
        };
        latestGameState.current = newState;
        return newState;
      });
      onGameEnd(0);
    }
  }, [gameState.isPlaying, gameState.timeRemaining, gameState.playerPosition]);

  if (typeof window === 'undefined') {
    return (
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
        <div className="animate-spin text-blue-500">
          <svg
            className="w-8 h-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="animate-spin text-blue-500">
            <svg
              className="w-8 h-8"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      }
    >
      <AdventureAntsGameMap
        playerPosition={gameState.playerPosition!}
        colonyPosition={gameState.colonyPosition}
        obstacles={gameState.obstacles}
        isDebugMode={isDebugMode}
      />
    </React.Suspense>
  );
}