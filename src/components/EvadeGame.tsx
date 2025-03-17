import { Position } from '@/hooks/useGeolocation';
import React from 'react';

export interface SearchCircle {
  id: number;
  position: Position;
  radius: number;
  direction: number;
  speed: number;
  turnRate: number;
}

interface GameMapProps {
  playerPosition: Position;
  searchCircles: SearchCircle[];
}

const EvadeGameMap = React.lazy(() => {
  if (typeof window === 'undefined') {
    return new Promise(() => {});
  }
  return import('./EvadeGameMap');
});

export default function GameMap(props: GameMapProps) {
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
      <EvadeGameMap {...props} />
    </React.Suspense>
  );
}
