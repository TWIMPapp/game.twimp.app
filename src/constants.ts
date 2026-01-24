// API URL - auto-detects based on environment
// Priority: 1) Environment variable, 2) Auto-detect from hostname
const getBaseUrl = (): string => {
    // Explicit env var takes precedence
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    // In browser: use localhost for local dev, live API for production
    if (typeof window !== 'undefined') {
        return window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : 'https://api.twimp.app';
    }
    // Server-side rendering fallback
    return 'https://api.twimp.app';
};

export const BASE_URL = getBaseUrl();
export const NEVIGATION_DELAY = 3000;
