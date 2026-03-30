import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { EasterEventAPI } from '@/services/API';
import Map, { SpawnRadius, MapRef } from '@/components/Map';
import SafetyDialog from '@/components/SafetyDialog';
import TrailModeSelector from '@/components/TrailModeSelector';
import TrailDesigner from '@/components/easter-event/TrailDesigner';
import styles from '@/styles/egg-hunt.module.css';
import { Colour } from '@/typings/Colour.enum';
import { Marker } from '@/typings/Task';
import { getDistanceInMeters } from '@/utils/geo';

type TrailMode = 'mode_select' | 'designing' | 'playing';

// ===== THEME CONFIGURATION =====
// Single source of truth for subject-to-theme mapping
// To change Science from green to purple, just change 'green' to 'purple' here
const SUBJECT_THEME: Record<string, string> = {
    MATH: 'blue',
    ENGLISH: 'orange',
    SCIENCE: 'pink',  // Change this to any theme: 'purple', 'pink', etc.
};

// Theme to Colour enum mapping (for Map component markers)
const THEME_TO_COLOUR: Record<string, Colour> = {
    blue: Colour.Blue,
    orange: Colour.Orange,
    green: Colour.Green,
    gold: Colour.Yellow,
    pink: Colour.Pink,
    purple: Colour.Purple,
};

// Get the theme name for a subject
const getThemeForSubject = (subject: string, isGoldenEgg: boolean): string => {
    if (isGoldenEgg) return 'gold';
    return SUBJECT_THEME[subject] || 'pink';
};

// Get the SVG path for an egg (pink uses red since no pink SVG exists)
const getEggSvgPath = (theme: string): string => {
    const svgColor = theme === 'pink' ? 'red' : theme;
    return `/icons/egg-${svgColor}.svg`;
};

// Get the Colour enum for Map markers
const getColourEnum = (theme: string): Colour => {
    return THEME_TO_COLOUR[theme] || Colour.Pink;
};

const EASTER_EVENT_LIVE = true;

export default function EasterEventMap() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [testMode, setTestMode] = useState(process.env.NODE_ENV !== 'production');
    const [celebrationPopup, setCelebrationPopup] = useState<{ subject: string; isGoldenEgg: boolean; isBonusEgg?: boolean; task?: any } | null>(null);
    const [collecting, setCollecting] = useState(false);
    const [questionPopup, setQuestionPopup] = useState<any>(null);
    const [goldenEggPopup, setGoldenEggPopup] = useState(false);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [letterPopup, setLetterPopup] = useState<{ letter: string; symbol: string; isDuplicate: boolean } | null>(null);
    const [letterRevealed, setLetterRevealed] = useState(false);
    const [goldenEggResult, setGoldenEggResult] = useState<any>(null);
    const [spawnRadius, setSpawnRadius] = useState<SpawnRadius | null>(null);
    const [safetyDialogOpen, setSafetyDialogOpen] = useState(false);
    const [dailyProgress, setDailyProgress] = useState<{ collected: number; max: number } | null>(null);
    // Persist trailMode in sessionStorage so it survives component remounts
    const [trailMode, _setTrailMode] = useState<TrailMode>(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('easter_playing') === 'true') {
            return 'playing';
        }
        return 'mode_select';
    });
    const setTrailMode = (mode: TrailMode) => {
        if (mode === 'playing') {
            sessionStorage.setItem('easter_playing', 'true');
        }
        _setTrailMode(mode);
    };
    const [isCustomTrail, setIsCustomTrail] = useState(false);
    const [isBonusMode, setIsBonusMode] = useState(false);
    const [showBonusPopup, setShowBonusPopup] = useState(false);
    const [exitDialogOpen, setExitDialogOpen] = useState(false);
    const bonusPopupShownRef = useRef(false);
    const mapRef = useRef<MapRef>(null);
    const router = useRouter();

    // Auto-recenter: follow user unless they're interacting with the map
    const userInteractingRef = useRef(false);
    const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const DEFAULT_ZOOM = 18;

    const handleMapInteractionStart = useCallback(() => {
        userInteractingRef.current = true;
        if (interactionTimerRef.current) {
            clearTimeout(interactionTimerRef.current);
        }
    }, []);

    const handleMapInteractionEnd = useCallback(() => {
        if (interactionTimerRef.current) {
            clearTimeout(interactionTimerRef.current);
        }
        interactionTimerRef.current = setTimeout(() => {
            userInteractingRef.current = false;
            // Gently pan and zoom back to user
            if (mapRef.current && userLocationRef.current) {
                mapRef.current.smoothRecenter(userLocationRef.current, DEFAULT_ZOOM);
            }
        }, 10000);
    }, []);

    // Follow user location when not interacting
    useEffect(() => {
        if (!userInteractingRef.current && userLocation && mapRef.current && trailMode === 'playing') {
            mapRef.current.panTo(userLocation);
        }
    }, [userLocation, trailMode]);

    // Cleanup interaction timer
    useEffect(() => {
        return () => {
            if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
        };
    }, []);

    // Update spawn radius from any response that includes it
    const updateSpawnRadius = (res: any) => {
        if (res?.spawnRadius?.center) {
            setSpawnRadius({
                center: res.spawnRadius.center,
                radiusMeters: res.spawnRadius.radiusMeters
            });
        }
    };

    const handleSafetyAcknowledge = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await EasterEventAPI.acknowledgeSafety(userId);
            if (res.ok && res.session) {
                setSession(res.session);
                setIsCustomTrail(!!res.session.customTrail);
            }
            setSafetyDialogOpen(false);
        } catch (err) {
            console.error('Failed to acknowledge safety:', err);
        }
    };

    const handleReportHazard = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await EasterEventAPI.reportHazard(userId);
            if (res.ok && res.session) {
                setSession(res.session);
                setIsCustomTrail(!!res.session.customTrail);
            }
            if (res.dailyProgress) {
                setDailyProgress(res.dailyProgress);
            }
        } catch (err) {
            console.error('Failed to report hazard:', err);
        }
    };

    // Trail mode handlers
    const handleSelectNearMe = async () => {
        setTrailMode('playing');
        setIsCustomTrail(false);

        // Show spawn radius immediately using current location
        const center = userLocation || session?.startPosition;
        console.log('[NearMe] Setting spawn radius:', { center, radiusMeters: spawnRadius?.radiusMeters, userLocation, startPos: session?.startPosition });
        if (center && (center.lat !== 0 || center.lng !== 0)) {
            setSpawnRadius({
                center,
                radiusMeters: spawnRadius?.radiusMeters || 200
            });
        }

        // Then reset on server (which will also spawn an egg)
        const userId = localStorage.getItem('twimp_user_id');
        if (userId && userLocation) {
            try {
                const res: any = await EasterEventAPI.resetSpawnLocation(userId, userLocation.lat, userLocation.lng);
                if (res?.session) {
                    setSession(res.session);
                }
            } catch (err) {
                console.error('Failed to reset spawn location:', err);
            }
        }

        if (session && !session.safetyVerified) {
            setSafetyDialogOpen(true);
        }
    };

    const handleSelectAlongPath = () => {
        setTrailMode('designing');
    };

    const handleTrailDesignComplete = async (locations: Array<{ lat: number; lng: number }>) => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await EasterEventAPI.setCustomTrail(userId, locations);
            if (res.ok) {
                setSession(res.session);
                setIsCustomTrail(true);
                setTrailMode('playing');
                updateSpawnRadius(res);

                if (res.dailyProgress) {
                    setDailyProgress(res.dailyProgress);
                }

                if (!res.session?.safetyVerified) {
                    setSafetyDialogOpen(true);
                }
            }
        } catch (err) {
            console.error('Failed to set custom trail:', err);
        }
    };

    const handleTrailDesignCancel = () => {
        setTrailMode('mode_select');
    };

    // Initial load
    useEffect(() => {
        const isTesting = typeof window !== 'undefined' && sessionStorage.getItem('easter_testing') === 'true';
        if (!EASTER_EVENT_LIVE && !isTesting) {
            router.replace('/easter-event/coming-soon');
            return;
        }

        // Restore test day context from testing page
        const storedTestDay = typeof window !== 'undefined' ? sessionStorage.getItem('easter_test_day') : null;
        if (storedTestDay !== null) {
            EasterEventAPI.setTestDay(parseInt(storedTestDay));
        }

        let visitorId = localStorage.getItem('twimp_user_id');
        if (!visitorId) {
            visitorId = crypto.randomUUID();
            localStorage.setItem('twimp_user_id', visitorId);
        }
        const userId = visitorId;

        const fetchInitialData = async (lat: number, lng: number) => {
            try {
                const res: any = await EasterEventAPI.start(userId, lat, lng);
                console.log('[DEBUG] /play response:', { isBonusEgg: res.isBonusEgg, currentEgg_isBonusEgg: res.currentEgg?.isBonusEgg, dailyProgress: res.dailyProgress });
                setSession(res);
                updateSpawnRadius(res);

                // Use server-provided daily progress
                if (res.dailyProgress) {
                    setDailyProgress(res.dailyProgress);
                }

                // Check if user already has progress today or is using custom trail
                const eggsCollectedToday = res.dailyProgress?.collected || 0;
                const usingCustomTrail = !!res.customTrail;

                if (eggsCollectedToday > 0 || usingCustomTrail) {
                    // Skip mode selector, go directly to playing
                    setTrailMode('playing');
                    setIsCustomTrail(usingCustomTrail);
                    if (!res.safetyVerified) {
                        setSafetyDialogOpen(true);
                    }
                }
                // Otherwise stay in mode_select mode (show trail selector)
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        navigator.geolocation.getCurrentPosition((pos) => {
            const initialLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(initialLoc);
            fetchInitialData(initialLoc.lat, initialLoc.lng);
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Geolocation watching
    useEffect(() => {
        if (testMode) return;

        const watchId = navigator.geolocation.watchPosition((pos) => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }, (err) => console.error("WatchPosition error:", err), {
            enableHighAccuracy: true,
            maximumAge: 1000
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, [testMode]);

    const userLocationRef = useRef(userLocation);

    const sessionRef = useRef(session);
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    useEffect(() => {
        userLocationRef.current = userLocation;
    }, [userLocation]);

    // Track whether a popup is open to pause AWTY polling
    const popupOpenRef = useRef(false);
    const isPollingRef = useRef(false);
    useEffect(() => {
        popupOpenRef.current = !!(celebrationPopup || questionPopup || goldenEggPopup || letterPopup);
    }, [celebrationPopup, questionPopup, goldenEggPopup, letterPopup]);

    // Process AWTY response — shared between smart polling and heartbeat
    const handleAWTYResponse = useCallback((res: any) => {
        if (res.session) {
            setSession(res.session);
            setIsCustomTrail(!!res.session.customTrail);
        }

        if (res.dailyProgress) {
            setDailyProgress(res.dailyProgress);
        }

        updateSpawnRadius(res);

        if (res.isBonusEgg && !bonusPopupShownRef.current) {
            console.error('[DEBUG] Bonus popup triggered!', { isBonusEgg: res.isBonusEgg, dailyProgress: res.dailyProgress, currentEgg: res.session?.currentEgg?.isBonusEgg });
            setIsBonusMode(true);
            setShowBonusPopup(true);
            bonusPopupShownRef.current = true;
        } else if (res.isBonusEgg) {
            setIsBonusMode(true);
        }

        if (res.arrived) {
            const subject = res.session?.currentEgg?.subject || 'SCIENCE';
            const isGoldenEgg = res.isGoldenEgg || false;
            const isBonusEgg = res.isBonusEgg || false;
            setCelebrationPopup({ subject, isGoldenEgg, isBonusEgg, task: res.task });
        }
    }, []);

    // Smart AWTY Polling — client-side distance check + adaptive interval + heartbeat
    const PROXIMITY_THRESHOLD = 50;   // Call AWTY when within 50m
    const HEARTBEAT_INTERVAL = 60000; // 60s heartbeat for session sync / egg expiry
    const CLOSE_POLL_INTERVAL = 5000; // 5s when near egg
    const FAR_POLL_INTERVAL = 15000;  // 15s when far but moving

    useEffect(() => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        let timeoutId: ReturnType<typeof setTimeout>;
        let lastAwtyCall = 0;
        let lastPolledLoc: { lat: number; lng: number } | null = null;
        let cancelled = false;

        const hasUserMoved = (currentLoc: { lat: number; lng: number }): boolean => {
            if (!lastPolledLoc) return true;
            const dist = getDistanceInMeters(currentLoc.lat, currentLoc.lng, lastPolledLoc.lat, lastPolledLoc.lng);
            return dist > 3; // Consider moved if >3m
        };

        const callAWTY = async (currentLoc: { lat: number; lng: number }) => {
            try {
                const res: any = await EasterEventAPI.awty(userId, currentLoc.lat, currentLoc.lng);
                handleAWTYResponse(res);
                lastAwtyCall = Date.now();
                lastPolledLoc = currentLoc;
            } catch (err) {
                console.error("AWTY check failed:", err);
            }
        };

        const smartPoll = async () => {
            if (cancelled || isPollingRef.current) return;
            isPollingRef.current = true;

            if (popupOpenRef.current) {
                isPollingRef.current = false;
                timeoutId = setTimeout(smartPoll, 1000);
                return;
            }

            const currentLoc = userLocationRef.current;
            if (!currentLoc) {
                isPollingRef.current = false;
                timeoutId = setTimeout(smartPoll, 1000);
                return;
            }

            const egg = sessionRef.current?.currentEgg;
            const now = Date.now();
            const moved = hasUserMoved(currentLoc);
            let nextInterval = FAR_POLL_INTERVAL;

            if (egg) {
                const dist = getDistanceInMeters(currentLoc.lat, currentLoc.lng, egg.lat, egg.lng);
                const expired = egg.expireTime && egg.expireTime < now;

                if (expired) {
                    // Egg expired — always call regardless of movement
                    await callAWTY(currentLoc);
                } else if (moved && dist < PROXIMITY_THRESHOLD) {
                    // Close to egg and moving — call AWTY for collection check
                    await callAWTY(currentLoc);
                } else if (moved && dist < 200 && now - lastAwtyCall > CLOSE_POLL_INTERVAL) {
                    // Getting close and moving — call if not called recently
                    await callAWTY(currentLoc);
                } else if (moved && now - lastAwtyCall > HEARTBEAT_INTERVAL) {
                    // Far from egg, moving — heartbeat
                    await callAWTY(currentLoc);
                }
                // Not moving or called recently — skip, loop will check again in 5s
            } else {
                // No egg — call AWTY to get one spawned
                if (now - lastAwtyCall > CLOSE_POLL_INTERVAL) {
                    await callAWTY(currentLoc);
                }
            }

            nextInterval = CLOSE_POLL_INTERVAL;

            isPollingRef.current = false;
            timeoutId = setTimeout(smartPoll, nextInterval);
        };

        // Initial call
        smartPoll();

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
            isPollingRef.current = false;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Timer effect
    useEffect(() => {
        const egg = session?.currentEgg;
        if (!egg?.expireTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = egg.expireTime - now;
            setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
        }, 1000);

        return () => clearInterval(interval);
    }, [session]);

    // Letter reveal animation effect - flip between symbol and letter every 2 seconds
    useEffect(() => {
        if (letterPopup) {
            setLetterRevealed(false); // Start showing symbol

            let interval: ReturnType<typeof setInterval>;

            // First flip after 2 seconds, then start continuous flipping
            const firstFlip = setTimeout(() => {
                setLetterRevealed(true);
                interval = setInterval(() => {
                    setLetterRevealed(prev => !prev);
                }, 2000);
            }, 2000);

            return () => {
                clearTimeout(firstFlip);
                if (interval) clearInterval(interval);
            };
        }
    }, [letterPopup]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerSubmit = async () => {
        if (!answer.trim()) return;

        setSubmitting(true);
        setFeedback(null);
        const userId = localStorage.getItem('twimp_user_id');

        try {
            const res: any = await EasterEventAPI.collect(userId!, answer);

            if (res.correct) {
                setFeedback({ type: 'success', message: 'Correct!' });

                if (res.session) {
                    setSession(res.session);
                    setIsCustomTrail(!!res.session.customTrail);
                }

                if (res.dailyProgress) {
                    setDailyProgress(res.dailyProgress);
                }

                // Handle golden egg - show GERARDIA reveal
                if (res.isGoldenEgg) {
                    setTimeout(() => {
                        setQuestionPopup(null);
                        setAnswer('');
                        setFeedback(null);
                        setSubmitting(false);
                        setGoldenEggResult(res);
                    }, 1500);
                } else if (res.isBonusEgg) {
                    setTimeout(() => {
                        setQuestionPopup(null);
                        setAnswer('');
                        setFeedback(null);
                        setSubmitting(false);
                        // No letter popup for bonus eggs - just continue
                    }, 1500);
                } else {
                    // Show letter popup for regular eggs
                    setTimeout(() => {
                        setQuestionPopup(null);
                        setAnswer('');
                        setFeedback(null);
                        setSubmitting(false);
                        setLetterPopup({
                            letter: res.letter,
                            symbol: res.symbol,
                            isDuplicate: res.isDuplicate
                        });
                    }, 1500);
                }
            } else {
                setFeedback({ type: 'error', message: res.message || 'Incorrect!' });

                if (res.session) {
                    setSession(res.session);
                    setIsCustomTrail(!!res.session.customTrail);
                }

                setSubmitting(false);

                // For golden egg, let them try again (don't dismiss)
                if (questionPopup?.isGoldenEgg) {
                    setTimeout(() => {
                        setAnswer('');
                        setFeedback(null);
                    }, 1500);
                } else {
                    setTimeout(() => {
                        setQuestionPopup(null);
                        setAnswer('');
                        setFeedback(null);
                    }, 2500);
                }
            }
        } catch (err) {
            console.error(err);
            setFeedback({ type: 'error', message: 'Error submitting answer.' });
            setSubmitting(false);
        }
    };

    const handleCelebrationCollect = () => {
        if (!celebrationPopup || collecting) return;

        // Start collecting animation
        setCollecting(true);

        // Egg collection already recorded by AWTY - show next popup after delay
        const task = celebrationPopup.task;
        const isGolden = celebrationPopup.isGoldenEgg;

        setTimeout(() => {
            setCelebrationPopup(null);
            setCollecting(false);

            if (isGolden && task) {
                // Golden egg - show question first, then reveal after correct answer
                setQuestionPopup({ ...task, isGoldenEgg: true });
            } else if (isGolden) {
                // Golden egg with no task (fallback)
                setGoldenEggPopup(true);
            } else if (task) {
                // Regular egg - show question popup (task from AWTY response)
                setQuestionPopup(task);
            }
        }, 800);
    };

    const handleCollectGoldenEgg = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await EasterEventAPI.collect(userId);
            if (res.ok) {
                setGoldenEggPopup(false);
                setGoldenEggResult(res);

                if (res.session) {
                    setSession(res.session);
                }
            }
        } catch (err) {
            console.error('Failed to collect golden egg:', err);
        }
    };

    if (loading) {
        return (
            <Box className="h-screen flex items-center justify-center bg-green-50">
                <CircularProgress sx={{ color: 'var(--egg-primary)' }} className={styles['theme-green']} />
            </Box>
        );
    }

    const getMarkers = (): Marker[] => {
        if (session?.currentEgg) {
            const theme = getThemeForSubject(session.currentEgg.subject, session.currentEgg.isGoldenEgg);
            return [{
                lat: session.currentEgg.lat,
                lng: session.currentEgg.lng,
                title: session.currentEgg.isGoldenEgg ? 'Golden Egg!' : 'Easter Egg',
                subtitle: session.currentEgg.isGoldenEgg ? 'Special!' : 'Collect me!',
                colour: getColourEnum(theme),
                image_url: getEggSvgPath(theme)
            }];
        }
        return [];
    };

    const markers = getMarkers();
    const progress = dailyProgress || { collected: 0, max: 5 };

    // Trail Designer Mode
    if (trailMode === 'designing') {
        return (
            <Box className="h-screen flex flex-col bg-gray-50 overflow-hidden">
                {/* Header */}
                <Box className="px-4 py-3 bg-white shadow-sm flex items-center justify-between z-10" sx={{ flexShrink: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: '#16a34a' }}>
                        Design Your Trail
                    </Typography>
                    <IconButton
                        onClick={handleTrailDesignCancel}
                        size="small"
                        sx={{ color: '#6b7280' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ flex: 1, position: 'relative' }}>
                    <TrailDesigner
                        userLocation={userLocation}
                        maxEggs={progress.max}
                        radiusMeters={spawnRadius?.radiusMeters || 200}
                        onComplete={handleTrailDesignComplete}
                        onCancel={handleTrailDesignCancel}
                        mapRef={mapRef}
                    />
                </Box>
            </Box>
        );
    }


    return (
        <Box className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <Box className="px-4 py-3 bg-white shadow-sm flex items-center justify-between" sx={{ flexShrink: 0, position: 'relative' }}>
                {/* Left: Remaining Eggs / Bonus Mode */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 40 }}>
                    {trailMode === 'playing' && (
                        <>
                            <Box
                                component="img"
                                src={isBonusMode ? "/icons/egg-orange.svg" : "/icons/egg-green.svg"}
                                alt="Eggs"
                                sx={{ width: 24, height: 24 }}
                            />
                            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isBonusMode ? '#f97316' : '#22c55e' }}>
                                {!dailyProgress ? '...' : isBonusMode ? `${progress.max}/${progress.max} ✓` : Math.max(0, progress.max - progress.collected)}
                            </Typography>
                        </>
                    )}
                </Box>

                {/* Center: Timer - only in nearby mode */}
                {trailMode === 'playing' && !isCustomTrail && (
                    <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                        <Box className="bg-green-100 px-2 py-1 rounded-xl text-center">
                            <Typography className="text-[9px] font-bold text-green-600 leading-tight">RESPAWN</Typography>
                            <Typography className="text-sm font-black text-green-600 tabular-nums leading-tight">{formatTime(timeLeft)}</Typography>
                        </Box>
                    </Box>
                )}

                {/* Right: Always-visible close + optional hazard */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {trailMode === 'playing' && !isCustomTrail && (
                        <IconButton
                            size="small"
                            onClick={handleReportHazard}
                            sx={{
                                color: '#EF4444',
                                '&:hover': {
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                }
                            }}
                            title="Report hazard - respawn eggs"
                        >
                            <ReportProblemIcon />
                        </IconButton>
                    )}
                    <IconButton
                        onClick={() => setExitDialogOpen(true)}
                        size="small"
                        className={styles['theme-green']}
                        sx={{
                            color: 'var(--egg-primary)',
                            '&:hover': {
                                backgroundColor: 'rgba(34, 197, 94, 0.1)'
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Map Area */}
            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <Map
                    ref={mapRef}
                    taskMarkers={trailMode === 'playing' ? markers : []}
                    userLocation={userLocation}
                    testMode={testMode}
                    zoom={DEFAULT_ZOOM}
                    spawnRadius={trailMode === 'playing' && !isCustomTrail ? spawnRadius || undefined : undefined}
                    onPlayerMove={(lat, lng) => {
                        setUserLocation({ lat, lng });
                    }}
                    designerMode={trailMode === 'mode_select'}
                    onMapInteractionStart={handleMapInteractionStart}
                    onMapInteractionEnd={handleMapInteractionEnd}
                />

                {/* Bonus Mode Indicator */}
                {isBonusMode && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#f97316',
                            color: 'white',
                            px: 2,
                            py: 0.5,
                            borderRadius: '12px',
                            zIndex: 20,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                    >
                        <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                            🎉 Bonus Mode - Playing for fun!
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Celebration Popup - "Woohoo! You found an egg!" */}
            <Dialog
                open={!!celebrationPopup}
                onClose={() => { }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 3, textAlign: 'center' }
                }}
            >
                {celebrationPopup && (() => {
                    const theme = getThemeForSubject(celebrationPopup.subject, celebrationPopup.isGoldenEgg);
                    const themeClass = styles[`theme-${theme}`];
                    const eggSvgPath = getEggSvgPath(theme);

                    return (
                        <Box className={`flex flex-col items-center ${themeClass}`}>
                            <Box
                                sx={{
                                    width: 140,
                                    height: 170,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2,
                                    transition: 'all 0.5s ease-out',
                                    transform: collecting ? 'scale(0.3)' : 'scale(1)',
                                    opacity: collecting ? 0 : 1
                                }}
                            >
                                <img
                                    src={eggSvgPath}
                                    alt="Easter Egg"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))'
                                    }}
                                />
                            </Box>
                            <Typography
                                component="p"
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    color: 'var(--egg-text)',
                                    mb: 1,
                                    transition: 'opacity 0.3s ease-out',
                                    opacity: collecting ? 0 : 1
                                }}
                            >
                                {celebrationPopup.isGoldenEgg ? 'GOLDEN EGG!' : 'Woohoo!'}
                            </Typography>
                            <Typography
                                component="p"
                                variant="h6"
                                sx={{
                                    color: '#6B7280',
                                    mb: 4,
                                    transition: 'opacity 0.3s ease-out',
                                    opacity: collecting ? 0 : 1
                                }}
                            >
                                {celebrationPopup.isGoldenEgg
                                    ? 'You found the legendary Golden Egg!'
                                    : celebrationPopup.isBonusEgg
                                    ? 'You found a bonus egg!'
                                    : 'You found an egg!'}
                            </Typography>
                            <Button
                                variant="contained"
                                fullWidth
                                disabled={collecting}
                                onClick={handleCelebrationCollect}
                                className={styles['themed-button']}
                                sx={{
                                    '&.Mui-disabled': {
                                        background: 'var(--egg-gradient)',
                                        color: 'white'
                                    }
                                }}
                            >
                                {collecting ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={20} sx={{ color: 'white' }} />
                                        Collecting...
                                    </Box>
                                ) : (
                                    celebrationPopup.isGoldenEgg ? 'Open Golden Egg!' : 'Collect Egg!'
                                )}
                            </Button>
                        </Box>
                    );
                })()}
            </Dialog>

            {/* Question Popup Dialog */}
            <Dialog
                open={!!questionPopup}
                onClose={() => { }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', overflow: 'hidden', p: 0 }
                }}
            >
                {questionPopup && (() => {
                    const theme = isBonusMode ? 'orange' : getThemeForSubject(questionPopup.subject, false);
                    const themeClass = styles[`theme-${theme}`];
                    const eggClass = styles[`egg-${theme}`];

                    const isGoldenQ = questionPopup.isGoldenEgg;
                    const hasOptions = questionPopup.options && questionPopup.options.length > 0;

                    return (
                        <Box className={isGoldenQ ? styles['theme-gold'] : themeClass}>
                            <DialogTitle component="div" className={isGoldenQ ? styles['egg-gold'] : eggClass} sx={{ p: 3, textAlign: 'center' }}>
                                {isGoldenQ ? (
                                    <>
                                        <Typography className="text-3xl mb-1">🌟</Typography>
                                        <Typography variant="h5" component="p" className="font-extrabold mt-1">
                                            The Golden Egg
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="body2" className="font-bold uppercase tracking-widest opacity-90">
                                            {isBonusMode ? 'BONUS' : questionPopup.subject} Question
                                        </Typography>
                                        <Typography variant="h5" component="p" className="font-extrabold mt-1">
                                            {isBonusMode ? 'Answer for Fun!' : 'Answer to Unlock Codex'}
                                        </Typography>
                                    </>
                                )}
                            </DialogTitle>
                            <DialogContent sx={{ p: 3, pt: 4 }}>
                                <Box className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 mb-4">
                                    <Typography variant="h6" className="font-medium text-gray-800">
                                        {questionPopup.content}
                                    </Typography>
                                </Box>
                                {hasOptions ? (
                                    <Box className="space-y-2">
                                        {questionPopup.options.map((option: string, i: number) => (
                                            <Button
                                                key={i}
                                                variant={answer === option ? 'contained' : 'outlined'}
                                                fullWidth
                                                disabled={submitting || !!feedback}
                                                onClick={() => setAnswer(option)}
                                                sx={{
                                                    borderRadius: '16px',
                                                    py: 1.5,
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    fontSize: '1rem',
                                                    borderColor: 'var(--egg-primary)',
                                                    color: answer === option ? 'white' : 'var(--egg-text)',
                                                    backgroundColor: answer === option ? 'var(--egg-primary) !important' : 'transparent',
                                                    '&:hover': {
                                                        borderColor: 'var(--egg-primary)',
                                                        backgroundColor: answer === option ? 'var(--egg-primary) !important' : 'rgba(var(--egg-primary-rgb, 0,0,0), 0.05)'
                                                    }
                                                }}
                                            >
                                                {option}
                                            </Button>
                                        ))}
                                    </Box>
                                ) : (
                                    <TextField
                                        fullWidth
                                        label="Your Answer"
                                        variant="outlined"
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        disabled={submitting || !!feedback}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !submitting && answer.trim() && !feedback) {
                                                handleAnswerSubmit();
                                            }
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',
                                                '& fieldset': {
                                                    borderColor: 'var(--egg-primary)'
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'var(--egg-primary)'
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'var(--egg-primary)',
                                                    borderWidth: '2px'
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'var(--egg-primary)'
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: 'var(--egg-primary)'
                                            }
                                        }}
                                    />
                                )}
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pb: 3 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    disabled={submitting || !!feedback || !answer.trim()}
                                    onClick={handleAnswerSubmit}
                                    className={`${styles['submit-button']} ${isGoldenQ ? styles['egg-gold'] : eggClass}`}
                                >
                                    {submitting ? <CircularProgress size={24} color="inherit" /> : feedback?.type === 'success' ? '✓ Correct' : feedback?.type === 'error' ? '✗ Incorrect' : 'Submit Answer'}
                                </Button>
                            </DialogActions>
                        </Box>
                    );
                })()}
            </Dialog>

            {/* Golden Egg Celebration Popup */}
            <Dialog
                open={goldenEggPopup}
                onClose={() => { }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 3, textAlign: 'center' }
                }}
            >
                <Box className={`flex flex-col items-center ${styles['theme-gold']}`}>
                    <Typography className="text-6xl mb-4">🌟</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--egg-text)', mb: 2 }}>
                        GOLDEN EGG!
                    </Typography>
                    <Typography className="text-gray-600 mb-6">
                        You found the legendary Golden Egg! This is a special message from Fergus...
                    </Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleCollectGoldenEgg}
                        className={styles['themed-button']}
                    >
                        Collect Golden Egg
                    </Button>
                </Box>
            </Dialog>

            {/* Golden Egg Result Popup */}
            <Dialog
                open={!!goldenEggResult}
                onClose={() => setGoldenEggResult(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 3, textAlign: 'center' }
                }}
            >
                {goldenEggResult && (
                    <Box className={`flex flex-col items-center ${styles['theme-purple']}`}>
                        <Typography className="text-5xl mb-4">🦊</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--egg-text)', mb: 2 }}>
                            A Message from Fergus!
                        </Typography>
                        <Box sx={{ backgroundColor: 'var(--egg-bg)', border: '2px solid var(--egg-border)' }} className="p-4 rounded-2xl mb-4 w-full">
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--egg-text)', mb: 2 }}>
                                The secret word is:
                            </Typography>
                            <Box className="flex flex-wrap justify-center gap-1">
                                {goldenEggResult.encodedMessage?.map((char: any, i: number) => (
                                    <Box key={i} className={`px-2 py-1 rounded ${char.revealed ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        <Typography className={`text-lg font-bold ${char.revealed ? 'text-green-700' : 'text-gray-500'}`}>
                                            {char.revealed ? char.char : char.symbol}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Typography className="text-gray-600 italic mb-6">
                            {goldenEggResult.cliffhanger}
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setGoldenEggResult(null)}
                            className={styles['themed-button']}
                        >
                            Continue
                        </Button>
                    </Box>
                )}
            </Dialog>

            {/* Letter Unlock Popup */}
            <Dialog
                open={!!letterPopup}
                onClose={() => setLetterPopup(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 3, textAlign: 'center', overflow: 'hidden' }
                }}
            >
                {letterPopup && (() => {
                    const themeClass = letterPopup.isDuplicate ? styles['theme-orange'] : styles['theme-green'];

                    return (
                        <Box className={`flex flex-col items-center ${themeClass}`}>
                            <Typography variant="h3" sx={{ mb: 2 }}>
                                {letterPopup.isDuplicate ? '😅' : '✨'}
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 800,
                                    mb: 1,
                                    color: 'var(--egg-text)'
                                }}
                            >
                                {letterPopup.isDuplicate ? 'Duplicate!' : 'New Codex Unlocked!'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#6B7280',
                                    mb: 4
                                }}
                            >
                                {letterPopup.isDuplicate
                                    ? `Oh no! We already have ${letterPopup.letter}!`
                                    : `You unlocked a new symbol!`
                                }
                            </Typography>

                            {/* Flip Card Container */}
                            <Box
                                sx={{
                                    perspective: '1000px',
                                    width: '100%',
                                    height: '140px',
                                    mb: 4
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        transformStyle: 'preserve-3d',
                                        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: letterRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                    }}
                                >
                                    {/* Front - Symbol */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            backfaceVisibility: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '24px',
                                            border: '2px solid var(--egg-border)',
                                            backgroundColor: 'var(--egg-bg)'
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '5rem', lineHeight: 1 }}>
                                            {letterPopup.symbol}
                                        </Typography>
                                    </Box>

                                    {/* Back - Letter */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            backfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '24px',
                                            border: '2px solid var(--egg-border)',
                                            backgroundColor: 'var(--egg-bg)'
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: '5rem',
                                                fontWeight: 900,
                                                color: 'var(--egg-text)',
                                                lineHeight: 1
                                            }}
                                        >
                                            {letterPopup.letter}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => setLetterPopup(null)}
                                className={styles['themed-button']}
                            >
                                Continue
                            </Button>
                        </Box>
                    );
                })()}
            </Dialog>

            {/* Bonus Mode Popup - shows when transitioning to bonus eggs */}
            <Dialog
                open={showBonusPopup}
                onClose={() => {}}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 3, textAlign: 'center' }
                }}
            >
                <Box className={`flex flex-col items-center ${styles['theme-orange']}`}>
                    <Typography sx={{ fontSize: '4rem', mb: 2 }}>🎉</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#f97316', mb: 2 }}>
                        Great Job Today!
                    </Typography>
                    <Typography sx={{ color: '#6B7280', mb: 2, lineHeight: 1.6 }}>
                        You&apos;ve collected all {progress.max} eggs that count towards your codex!
                    </Typography>
                    <Typography sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>
                        Want to keep playing? Bonus eggs won&apos;t unlock new letters, but they&apos;re still fun to find!
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                        <Button
                            variant="outlined"
                            sx={{
                                flex: 1,
                                py: 1.5,
                                borderRadius: '16px',
                                borderColor: '#d1d5db',
                                color: '#6b7280',
                                fontWeight: 600,
                                textTransform: 'none'
                            }}
                            onClick={() => {
                                setShowBonusPopup(false);
                                router.push('/easter-event');
                            }}
                        >
                            Back to HQ
                        </Button>
                        <Button
                            variant="contained"
                            sx={{
                                flex: 1,
                                py: 1.5,
                                borderRadius: '16px',
                                backgroundColor: '#f97316',
                                fontWeight: 700,
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: '#ea580c'
                                }
                            }}
                            onClick={() => setShowBonusPopup(false)}
                        >
                            Continue Playing!
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            {/* Safety Dialog */}
            <SafetyDialog
                open={safetyDialogOpen}
                onAcknowledge={handleSafetyAcknowledge}
            />

            {/* Trail Mode Selector */}
            <TrailModeSelector
                open={trailMode === 'mode_select'}
                onSelectNearMe={handleSelectNearMe}
                onSelectAlongPath={handleSelectAlongPath}
            />

            {/* Exit Dialog */}
            <Dialog
                open={exitDialogOpen}
                onClose={() => setExitDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', p: 2 } }}
            >
                <Box className="text-center" sx={{ py: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>
                        What would you like to do?
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={async () => {
                                setExitDialogOpen(false);
                                // Clear custom trail and reset to mode select
                                const userId = localStorage.getItem('twimp_user_id');
                                if (userId && isCustomTrail) {
                                    await EasterEventAPI.clearCustomTrail(userId).catch(() => {});
                                }
                                setIsCustomTrail(false);
                                sessionStorage.removeItem('easter_playing');
                                _setTrailMode('mode_select');
                            }}
                            sx={{
                                borderRadius: '14px',
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                background: 'linear-gradient(45deg, #22C55E 0%, #16A34A 100%) !important',
                                backgroundColor: 'transparent !important'
                            }}
                        >
                            Switch Mode
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => {
                                setExitDialogOpen(false);
                                sessionStorage.removeItem('easter_playing');
                                router.back();
                            }}
                            sx={{
                                borderRadius: '14px',
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                borderColor: '#6b7280',
                                color: '#6b7280'
                            }}
                        >
                            Back to HQ
                        </Button>
                        <Button
                            onClick={() => setExitDialogOpen(false)}
                            sx={{
                                textTransform: 'none',
                                color: '#9ca3af',
                                fontWeight: 600
                            }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}
