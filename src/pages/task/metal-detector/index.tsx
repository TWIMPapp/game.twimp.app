import Loading from '@/components/Loading';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import { MetalDetectorTask } from '@/typings/Task';
import { useEffect, useState } from 'react';
import { Position } from '@/hooks/useGeolocation';
import { useGeolocation } from '@/hooks/useGeolocation';
import MetalDetectorGame from '@/components/MetalDetectorGame';
import { MapPin } from 'lucide-react';
import { BaseTask } from '@/components/BaseTask';
import { useDebugMode } from '@/hooks/useDebugMode';

const MIN_ACCURACY = 25000000; // Increased minimum accuracy threshold to 25 meters

export default function MetalDetector({ testTask }: { testTask?: MetalDetectorTask }) {
  const [task, setTask] = useState<MetalDetectorTask>();
  const [params, setParams] = useState<QueryParams>();
  const { isDebugMode } = useDebugMode();
  const [score, setScore] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const { position, error, isLoading } = useGeolocation();

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;

      if (_params) {
        setParams(_params);
        const data = new TaskHandlerService().getTaskFromSession<MetalDetectorTask>();

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

  const startGame = () => {
    console.log('startGame', position);
    if (!position) return;
    setIsPlaying(true);
    setScore(0);
  };

  const handleGameEnd = (finalScore: number) => {
    setScore(finalScore);
    setIsPlaying(false);
  };

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
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {!isPlaying ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                {score > -1 ? `You Found ${score} Treasures!` : 'Metal Detector'}
              </h1>
              <p className="text-gray-600 mb-6">
                Listen for the beeping sound - it gets faster as you get closer to the treasure!
              </p>
              <p className="text-gray-600 mb-6">Move around to find the hidden treasure</p>
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
                {score > -1 ? 'Play Again' : 'Start Game'}
              </button>

            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 relative h-[calc(100vh-4rem)]">
              {position && (
                <MetalDetectorGame
                  initialPosition={position}
                  onGameEnd={handleGameEnd}
                />
              )}
            </div>
          </>
        )}
      </div>
    </BaseTask>
  );
}