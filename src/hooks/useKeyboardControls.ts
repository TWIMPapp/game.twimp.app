import { useEffect, useCallback, useRef } from 'react';

type KeyHandler = () => void;

interface KeyboardControls {
  onKeyDown: (key: string, handler: KeyHandler) => void;
  onKeyUp: (key: string, handler: KeyHandler) => void;
  onKeyPress: (key: string, handler: KeyHandler) => void;
}

export function useKeyboardControls(): KeyboardControls {
  const keyDownHandlers = useRef<Map<string, Set<KeyHandler>>>(new Map());
  const keyUpHandlers = useRef<Map<string, Set<KeyHandler>>>(new Map());
  const keyPressHandlers = useRef<Map<string, Set<KeyHandler>>>(new Map());

  const onKeyDown = useCallback((key: string, handler: KeyHandler) => {
    const handlers = keyDownHandlers.current.get(key) || new Set();
    handlers.add(handler);
    keyDownHandlers.current.set(key, handlers);
  }, []);

  const onKeyUp = useCallback((key: string, handler: KeyHandler) => {
    const handlers = keyUpHandlers.current.get(key) || new Set();
    handlers.add(handler);
    keyUpHandlers.current.set(key, handlers);
  }, []);

  const onKeyPress = useCallback((key: string, handler: KeyHandler) => {
    const handlers = keyPressHandlers.current.get(key) || new Set();
    handlers.add(handler);
    keyPressHandlers.current.set(key, handlers);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const handlers = keyDownHandlers.current.get(key);
      if (handlers) {
        handlers.forEach(handler => handler());
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const handlers = keyUpHandlers.current.get(key);
      if (handlers) {
        handlers.forEach(handler => handler());
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const handlers = keyPressHandlers.current.get(key);
      if (handlers) {
        handlers.forEach(handler => handler());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, []);

  return {
    onKeyDown,
    onKeyUp,
    onKeyPress
  };
}