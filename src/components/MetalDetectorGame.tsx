import { useEffect, useRef, useState } from 'react';
import { Position } from '@/hooks/useGeolocation';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { useDebugMode } from '@/hooks/useDebugMode';
import React from 'react';

const WAVE_DURATION = 60; // 60 seconds per treasure
const COLLISION_DISTANCE = 0.0001; // Increased distance in degrees (about 10 meters)
const MIN_ACCURACY = 25000000; // Increased minimum accuracy threshold to 25 meters
const TREASURE_RADIUS = 0.00045; // Maximum distance in degrees (50 meters)
const MOVEMENT_STEP = 0.00001; // Movement amount in degrees for keyboard controls

interface GameState {
  timeRemaining: number;
  isPlaying: boolean;
  playerPosition: Position | null;
  treasurePosition: Position | null;
  score: number;
  lastUpdateTime: number;
  distanceToTreasure: number;
}

interface GameProps {
  initialPosition: Position;
  onGameEnd: (score: number) => void;
}

const MetalDetectorGameMap = React.lazy(() => {
  if (typeof window === 'undefined') {
    return new Promise(() => {});
  }
  return import('./MetalDetectorGameMap');
});

function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.lat - pos2.lat;
  const dy = pos1.lng - pos2.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function MetalDetectorGame({ initialPosition, onGameEnd }: GameProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayRef = useRef<number>(4000); // Default delay of 4 seconds
  const [isClient, setIsClient] = useState(false);
  const { onKeyPress } = useKeyboardControls();
  const { isDebugMode } = useDebugMode();
  const latestGameState = useRef<GameState | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    timeRemaining: WAVE_DURATION,
    isPlaying: true,
    playerPosition: initialPosition,
    treasurePosition: null,
    score: 0,
    lastUpdateTime: Date.now(),
    distanceToTreasure: 0
  });

  const spawnTreasure = (playerPos: Position): Position => {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * TREASURE_RADIUS;

    return {
      lat: initialPosition.lat + Math.cos(angle) * distance,
      lng: initialPosition.lng + Math.sin(angle) * distance
    };
  };

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

  // Initialize audio and start beeping loop
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/beep.mp3');
      audioRef.current.loop = false;
    }

    const beep = () => {
      if (!audioRef.current || !gameState.isPlaying) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      timeoutRef.current = setTimeout(beep, delayRef.current);
    };

    beep();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [gameState.isPlaying]);

  // Update delay based on distance
  useEffect(() => {
    if (!gameState.treasurePosition || !gameState.isPlaying) return;

    const distanceInMeters = calculateDistance(gameState.playerPosition!, gameState.treasurePosition) * 111000;
    delayRef.current = Math.max(200, (distanceInMeters / 10) * 1000);
  }, [gameState.playerPosition, gameState.treasurePosition, gameState.isPlaying]);

  // Spawn initial treasure
  useEffect(() => {
    if (gameState.isPlaying && !gameState.treasurePosition) {
      setGameState(prev => ({
        ...prev!,
        treasurePosition: spawnTreasure(prev!.playerPosition!)
      }));
    }
  }, [gameState.isPlaying, gameState.treasurePosition]);

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
    if (!gameState.isPlaying || !gameState.playerPosition || !gameState.treasurePosition) return;

    const distance = calculateDistance(gameState.playerPosition, gameState.treasurePosition);
    if (distance < COLLISION_DISTANCE) {
      // Treasure collected! Spawn new treasure
      const newTreasurePosition = spawnTreasure(gameState.playerPosition);
      setGameState((prev) => {
        if (!prev) return prev;
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
        if (!prev) return prev;
        const newState = {
          ...prev,
          isPlaying: false
        };
        latestGameState.current = newState;
        return newState;
      });
      onGameEnd(gameState.score);
    }
  }, [gameState.isPlaying, gameState.timeRemaining, gameState.playerPosition, gameState.treasurePosition]);

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
      <MetalDetectorGameMap
        playerPosition={gameState.playerPosition!}
        treasurePosition={gameState.treasurePosition}
        isDebugMode={isDebugMode}
      />
    </React.Suspense>
  );
}