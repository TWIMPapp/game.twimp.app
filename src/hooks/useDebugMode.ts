import { useState, useEffect } from 'react';

export function useDebugMode() {
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled in localStorage
    const debugMode = localStorage.getItem('debug_mode') === 'true';
    setIsDebugMode(debugMode);

    // Listen for changes to debug mode
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'debug_mode') {
        setIsDebugMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleDebugMode = () => {
    const newValue = !isDebugMode;
    setIsDebugMode(newValue);
    localStorage.setItem('debug_mode', String(newValue));
  };

  return {
    isDebugMode,
    toggleDebugMode
  };
}
