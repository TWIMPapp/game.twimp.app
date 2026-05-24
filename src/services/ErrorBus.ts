// Tiny pub/sub so APIService (and anyone else) can surface user-facing error
// messages without dragging a React context through every consumer. The
// ErrorSnackbar component subscribes; everyone else just calls emit().

export type ErrorSeverity = 'error' | 'warning';

export interface ErrorEvent {
  message: string;
  severity?: ErrorSeverity;
}

type Listener = (e: ErrorEvent) => void;

const listeners = new Set<Listener>();

export const ErrorBus = {
  emit(message: string, severity: ErrorSeverity = 'error'): void {
    listeners.forEach(l => l({ message, severity }));
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
