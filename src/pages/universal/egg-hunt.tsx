import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, Drawer, Card, CardContent, CircularProgress, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { UniversalAPI } from '@/services/API';
import Map, { SpawnRadius, MapRef } from '@/components/Map';
import { GoogleMap } from '@react-google-maps/api';
import styles from '@/styles/egg-hunt.module.css';
import SafetyDialog from '@/components/SafetyDialog';
import TutorialOverlay, { TutorialStep } from '@/components/TutorialOverlay';

// Reusable Codex Grid Component
function CodexGrid({ symbolUnlocks }: { symbolUnlocks: Record<string, string> }) {
    if (!symbolUnlocks || Object.keys(symbolUnlocks).length === 0) {
        return (
            <Box className="text-center py-8">
                <Typography className="text-gray-500">Loading codex...</Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={1}>
            {Object.entries(symbolUnlocks)
                .sort(([letterA], [letterB]) => letterA.localeCompare(letterB))
                .map(([letter, displaySymbol]) => {
                    const isUnlocked = displaySymbol !== '🔒' && displaySymbol !== '❌';
                    const isFailed = displaySymbol === '❌';

                    return (
                        <Grid item xs={2.4} sm={2} key={letter} className="text-center">
                            <Box className={`p-1.5 rounded-xl border ${isUnlocked ? 'bg-pink-50 border-pink-200' : isFailed ? 'bg-red-50 border-red-200' : 'bg-gray-100 border-gray-200'}`}>
                                <Typography className="text-xl mb-0.5">
                                    {displaySymbol as string}
                                </Typography>
                                <Typography className={`text-[9px] font-black ${isUnlocked ? 'text-pink-600' : isFailed ? 'text-red-600' : 'text-gray-400'}`}>
                                    {letter}
                                </Typography>
                            </Box>
                        </Grid>
                    );
                })}
        </Grid>
    );
}

export default function EggHuntView() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [codexOpen, setCodexOpen] = useState(false);
    const [showInlineCodex, setShowInlineCodex] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [lastSentLocation, setLastSentLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [testMode, setTestMode] = useState(true); // Test mode enabled by default
    const [questionPopup, setQuestionPopup] = useState<any>(null); // Store question data for popup
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [exitDialogOpen, setExitDialogOpen] = useState(false);
    const [codexPopup, setCodexPopup] = useState<{ letter: string; symbol: string } | null>(null);
    const [spawnRadius, setSpawnRadius] = useState<SpawnRadius | null>(null);
    const [safetyDialogOpen, setSafetyDialogOpen] = useState(false);
    const [tutorialActive, setTutorialActive] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [isNewSession, setIsNewSession] = useState(false);
    const mapRef = useRef<MapRef>(null);
    const router = useRouter();

    // Fetch spawn radius
    const fetchSpawnRadius = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await UniversalAPI.getSpawnRadius(userId);
            if (res.ok && res.center) {
                setSpawnRadius({
                    center: res.center,
                    radiusMeters: res.radiusMeters
                });
            }
        } catch (err) {
            console.error('Failed to fetch spawn radius:', err);
        }
    };

    // Handle safety acknowledgment
    const handleSafetyAcknowledge = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await UniversalAPI.acknowledgeSafety(userId);
            if (res.ok && res.session) {
                setSession(res.session);
            }
            setSafetyDialogOpen(false);
        } catch (err) {
            console.error('Failed to acknowledge safety:', err);
        }
    };

    // Handle hazard report
    const handleReportHazard = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await UniversalAPI.reportHazard(userId);
            if (res.ok && res.session) {
                setSession(res.session);
            }
        } catch (err) {
            console.error('Failed to report hazard:', err);
        }
    };

    // Initial load
    useEffect(() => {
        let visitorId = localStorage.getItem('twimp_user_id');
        if (!visitorId) {
            visitorId = crypto.randomUUID();
            localStorage.setItem('twimp_user_id', visitorId);
        }
        const userId = visitorId; // Capture for closure

        const fetchInitialData = async (lat: number, lng: number) => {
            try {
                const res: any = await UniversalAPI.start(userId, lat, lng);
                setSession(res.session);
                // Fetch spawn radius after session is loaded
                fetchSpawnRadius();

                // Check if this is a brand new session (level 1, no eggs collected)
                const isNew = res.session.currentLevel === 1 && !res.session.eggsCollected;
                setIsNewSession(isNew);

                // Show tutorial for new sessions, otherwise show safety dialog if not verified
                if (isNew) {
                    setTutorialActive(true);
                    setTutorialStep(0);
                } else if (!res.session.safetyVerified) {
                    setSafetyDialogOpen(true);
                }
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
    }, [router]);

    // Geolocation watching (only in live mode)
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
    const lastSentLocationRef = useRef<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        userLocationRef.current = userLocation;
    }, [userLocation]);

    // Optimized AWTY Polling (Stable 5s interval)
    useEffect(() => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        const checkAWTY = async () => {
            const currentLoc = userLocationRef.current;
            if (!currentLoc) return;

            const lastSent = lastSentLocationRef.current;

            // Only call server if location changed significantly (e.g., > 1m or first time)
            if (lastSent) {
                const dist = Math.sqrt(
                    Math.pow(currentLoc.lat - lastSent.lat, 2) +
                    Math.pow(currentLoc.lng - lastSent.lng, 2)
                );
                if (dist < 0.00001) return; // Very small change threshold (~1.1m)
            }

            try {
                const res: any = await UniversalAPI.awty(userId, currentLoc.lat, currentLoc.lng);
                console.log("[EggHuntView] AWTY Check:", res.message);
                if (res.session) {
                    setSession(res.session);
                }

                // If user arrived at egg, show question popup automatically
                if (res.arrived && res.task) {
                    console.log("[EggHuntView] User arrived at egg! Showing question popup");
                    setQuestionPopup(res.task);
                }

                lastSentLocationRef.current = currentLoc;
                setLastSentLocation(currentLoc); // Keep state in sync for UI if needed
            } catch (err) {
                console.error("AWTY check failed:", err);
            }
        };

        const interval = setInterval(checkAWTY, 5000);
        checkAWTY(); // Initial check

        return () => clearInterval(interval);
    }, []);

    // Timer effect
    useEffect(() => {
        const egg = session?.currentEgg || (session?.currentEggs?.length > 0 ? session.currentEggs[0] : null);
        if (!egg?.expireTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = egg.expireTime - now;
            setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
        }, 1000);

        return () => clearInterval(interval);
    }, [session]);

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
            const res: any = await UniversalAPI.answer(userId!, answer);
            if (res.correct) {
                setFeedback({ type: 'success', message: 'Correct!' });

                // Update session with new level
                if (res.session) {
                    setSession(res.session);
                }

                // Show codex popup for levels 1-26
                const previousLevel = session?.currentLevel || 1;
                if (previousLevel <= 26) {
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    const letter = alphabet[previousLevel - 1];
                    // Get the symbol from the updated session's symbolUnlocks
                    const symbol = res.session?.symbolUnlocks?.[letter] || '❓';

                    setTimeout(() => {
                        setQuestionPopup(null);
                        setAnswer('');
                        setFeedback(null);
                        setSubmitting(false);
                        setShowInlineCodex(false);
                        setCodexPopup({ letter, symbol });
                    }, 1500);
                } else {
                    setTimeout(() => {
                        setQuestionPopup(null);
                        setAnswer('');
                        setFeedback(null);
                        setSubmitting(false);
                        setShowInlineCodex(false);
                    }, 1500);
                }
            } else {
                const currentLevel = session?.currentLevel || 1;
                const message = currentLevel >= 27
                    ? 'Incorrect! The egg will respawn - try again!'
                    : 'Incorrect! You didn\'t unlock the symbol.';
                setFeedback({ type: 'error', message });

                // Update session to get respawned egg
                if (res.session) {
                    setSession(res.session);
                }

                setSubmitting(false);

                // Close popup after 2.5 seconds on wrong answer
                setTimeout(() => {
                    setQuestionPopup(null);
                    setAnswer('');
                    setFeedback(null);
                    setSubmitting(false);
                    setShowInlineCodex(false);
                }, 2500);
            }
        } catch (err) {
            console.error(err);
            setFeedback({ type: 'error', message: 'Error submitting answer.' });
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box className="h-screen flex items-center justify-center bg-pink-50">
                <CircularProgress sx={{ color: '#FF6A88' }} />
            </Box>
        );
    }

    const getEggColour = (level: number, subject: string) => {
        if (level === 30) return 'gold';
        if (level >= 27) return 'red';
        if (subject === 'MATH') return 'blue';
        if (subject === 'ENGLISH') return 'orange';
        if (subject === 'SCIENCE') return 'green';
        return 'red';
    };

    const getMarkers = () => {
        if (session?.currentEggs) {
            return session.currentEggs.map((e: any) => ({
                lat: e.lat,
                lng: e.lng,
                title: `${e.subject} Egg`,
                colour: getEggColour(e.level, e.subject),
                status: 'active'
            }));
        }
        if (session?.currentEgg) {
            return [{
                lat: session.currentEgg.lat,
                lng: session.currentEgg.lng,
                title: `Egg ${session.currentLevel}`,
                colour: getEggColour(session.currentEgg.level, session.currentEgg.subject),
                status: 'active'
            }];
        }
        return [];
    };

    const markers = getMarkers();

    // Get first egg location for tutorial
    const firstEggLocation = markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : null;

    // Tutorial steps with map actions
    const tutorialSteps: TutorialStep[] = [
        {
            message: "This is the Twimp icon, right now it represents you out in the real world.",
            action: () => {
                // Pan to the first egg
                if (mapRef.current && firstEggLocation) {
                    mapRef.current.panAndZoom(firstEggLocation, 19);
                }
            }
        },
        {
            message: "This is your first egg. Find where it is in the real world and when you get close to it, you will collect it.",
            action: () => {
                // Zoom out to show the circle
                if (mapRef.current && spawnRadius?.center) {
                    mapRef.current.panAndZoom(spawnRadius.center, 16);
                }
            }
        },
        {
            message: "This is the game radius. All of your eggs will spawn inside this circle.",
            action: () => {
                // Return to close zoom around user
                if (mapRef.current && userLocation) {
                    mapRef.current.panAndZoom(userLocation, 20);
                }
            }
        },
        {
            message: "Next up, if you're not the parent or guardian, fetch them now.",
            action: () => {
                // Tutorial complete - will trigger safety dialog
            }
        }
    ];

    const handleTutorialNext = () => {
        setTutorialStep((prev) => prev + 1);
    };

    const handleTutorialComplete = () => {
        setTutorialActive(false);
        setTutorialStep(0);
        // Show safety dialog after tutorial
        if (!session?.safetyVerified) {
            setSafetyDialogOpen(true);
        }
    };

    return (
        <Box className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <Box className="px-4 py-3 bg-white shadow-sm flex items-center justify-between z-10" sx={{ flexShrink: 0 }}>
                {/* Left: Title and Level */}
                <Box sx={{ minWidth: '140px' }}>
                    <Typography className="text-xs font-bold text-pink-500 uppercase tracking-widest">Egg Hunt</Typography>
                    <Typography variant="body1" className="font-extrabold text-gray-800">Level {session?.currentLevel || 1} / 30</Typography>
                </Box>

                {/* Center: Timer and Codex Button */}
                <Box className="flex items-center gap-2">
                    <Box className="bg-pink-100 px-2 py-1 rounded-xl text-center">
                        <Typography className="text-[9px] font-bold text-pink-600 leading-tight">RESPAWN</Typography>
                        <Typography className="text-sm font-black text-pink-600 tabular-nums leading-tight">{formatTime(timeLeft)}</Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setCodexOpen(true)}
                        sx={{
                            borderRadius: '12px',
                            borderColor: '#FF6A88',
                            color: '#FF6A88',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            px: 2,
                            py: 0.75,
                            textTransform: 'none',
                            minWidth: 'auto',
                            '&:hover': {
                                borderColor: '#ff4f73',
                                backgroundColor: 'rgba(255, 106, 136, 0.05)'
                            }
                        }}
                    >
                        📜
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={async () => {
                            if (userLocation) {
                                const userId = localStorage.getItem('twimp_user_id');
                                try {
                                    const response = await fetch(`http://localhost:3001/api/universal/reset-spawn`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ userId, lat: userLocation.lat, lng: userLocation.lng })
                                    });
                                    const data = await response.json();
                                    // Update session and show safety dialog since location changed
                                    if (data.session) {
                                        setSession(data.session);
                                    }
                                    // Refetch spawn radius to update the circle
                                    fetchSpawnRadius();
                                    // Show safety dialog again since spawn location changed
                                    setSafetyDialogOpen(true);
                                } catch (err) {
                                    console.error('Failed to reset spawn location:', err);
                                }
                            }
                        }}
                        sx={{
                            borderRadius: '12px',
                            borderColor: '#FF6A88',
                            color: '#FF6A88',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            px: 2,
                            py: 0.75,
                            textTransform: 'none',
                            minWidth: 'auto',
                            '&:hover': {
                                borderColor: '#ff4f73',
                                backgroundColor: 'rgba(255, 106, 136, 0.05)'
                            }
                        }}
                        title="Reset spawn location"
                    >
                        📍
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleReportHazard}
                        sx={{
                            borderRadius: '12px',
                            borderColor: '#FF9800',
                            color: '#FF9800',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            px: 2,
                            py: 0.75,
                            textTransform: 'none',
                            minWidth: 'auto',
                            '&:hover': {
                                borderColor: '#F57C00',
                                backgroundColor: 'rgba(255, 152, 0, 0.05)'
                            }
                        }}
                        title="Report hazard - respawn eggs"
                    >
                        <ReportProblemIcon sx={{ fontSize: '1rem' }} />
                    </Button>
                    {testMode && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={async () => {
                                const userId = localStorage.getItem('twimp_user_id');
                                if (!userId) return;
                                try {
                                    await UniversalAPI.restart(userId);
                                    window.location.reload();
                                } catch (err) {
                                    console.error('Failed to restart game:', err);
                                }
                            }}
                            sx={{
                                borderRadius: '12px',
                                borderColor: '#FF6A88',
                                color: '#FF6A88',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                px: 2,
                                py: 0.75,
                                textTransform: 'none',
                                minWidth: 'auto',
                                '&:hover': {
                                    borderColor: '#ff4f73',
                                    backgroundColor: 'rgba(255, 106, 136, 0.05)'
                                }
                            }}
                            title="Restart game (test mode)"
                        >
                            🔄
                        </Button>
                    )}
                </Box>

                {/* Right: Close Button */}
                <Box sx={{ minWidth: '48px', display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                        onClick={() => setExitDialogOpen(true)}
                        size="small"
                        sx={{
                            color: '#FF6A88',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 106, 136, 0.1)'
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
                    taskMarkers={markers}
                    userLocation={userLocation}
                    testMode={testMode}
                    zoom={20}
                    spawnRadius={spawnRadius || undefined}
                    onPlayerMove={(lat, lng) => {
                        console.log("Player moved (Test Mode)", lat, lng);
                        setUserLocation({ lat, lng });
                    }}
                />

                {/* Tutorial Overlay */}
                {tutorialActive && (
                    <TutorialOverlay
                        step={tutorialStep}
                        steps={tutorialSteps}
                        onNext={handleTutorialNext}
                        onComplete={handleTutorialComplete}
                    />
                )}
            </Box>

            {/* Codex Drawer */}
            <Drawer
                anchor="bottom"
                open={codexOpen}
                onClose={() => setCodexOpen(false)}
                PaperProps={{
                    sx: { borderRadius: '24px 24px 0 0', maxHeight: '80vh', p: 3 }
                }}
            >
                <Box className="flex justify-between items-center mb-4">
                    <Box>
                        <Typography variant="h5" className="font-extrabold text-gray-800">Symbol Codex</Typography>
                        <Typography variant="caption" className="text-gray-500">
                            Collect eggs to unlock symbols
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={() => setCodexOpen(false)}
                        size="small"
                        sx={{
                            color: '#FF6A88',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 106, 136, 0.1)'
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                <CodexGrid symbolUnlocks={session?.symbolUnlocks || {}} />
            </Drawer>

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
                    // Get the color directly from the question popup or session
                    const eggColor = getEggColour(session?.currentLevel || 1, questionPopup.subject);
                    const colorClass = `egg-${eggColor}`;

                    // Color map for the TextField
                    const colorMap: Record<string, string> = {
                        'blue': '#3B82F6',
                        'orange': '#F97316',
                        'green': '#22C55E',
                        'red': '#EF4444',
                        'gold': '#FFD700'
                    };
                    const borderColor = colorMap[eggColor] || '#EF4444';

                    // Generate button class names - keep egg color, don't change on feedback
                    const buttonClasses = [
                        styles['submit-button'],
                        styles[colorClass]
                    ].filter(Boolean).join(' ');

                    return (
                        <>
                            <DialogTitle component="div" className={styles[colorClass]} sx={{ p: 3, textAlign: 'center', position: 'relative' }}>
                                <Box className="flex flex-col items-center">
                                    <Typography variant="body2" className="font-bold uppercase tracking-widest opacity-90">
                                        {questionPopup.subject} Question - Level {session?.currentLevel}
                                    </Typography>
                                    <Typography variant="h5" component="p" className="font-extrabold mt-1">
                                        Answer to Unlock Symbol
                                    </Typography>
                                </Box>
                                <IconButton
                                    onClick={() => {
                                        setShowInlineCodex(!showInlineCodex);
                                    }}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        color: 'white',
                                        backgroundColor: showInlineCodex ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.4)'
                                        }
                                    }}
                                    title={showInlineCodex ? "Hide Codex" : "Show Codex"}
                                >
                                    📜
                                </IconButton>
                            </DialogTitle>
                            <DialogContent sx={{ p: 3, pt: 4 }}>
                                <Box className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 mb-4">
                                    <Typography variant="h6" className="font-medium text-gray-800">
                                        {questionPopup.content}
                                    </Typography>
                                </Box>

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
                                            '&.Mui-focused fieldset': {
                                                borderColor: borderColor,
                                                borderWidth: '2px'
                                            }
                                        },
                                        '& .MuiInputLabel-root.Mui-focused': {
                                            color: borderColor
                                        }
                                    }}
                                />

                                {/* Inline Codex - shown when button is clicked */}
                                {showInlineCodex && (
                                    <Box className="mt-4">
                                        <Typography variant="caption" className="text-gray-600 font-bold mb-2 block">
                                            Your Unlocked Symbols:
                                        </Typography>
                                        <CodexGrid symbolUnlocks={session?.symbolUnlocks || {}} />
                                    </Box>
                                )}
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pb: 3 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    disabled={submitting || !!feedback || !answer.trim()}
                                    onClick={handleAnswerSubmit}
                                    className={buttonClasses}
                                >
                                    {submitting ? <CircularProgress size={24} color="inherit" /> : feedback?.type === 'success' ? '✓ Correct' : feedback?.type === 'error' ? '✗ Incorrect' : 'Submit Answer'}
                                </Button>
                            </DialogActions>
                        </>
                    );
                })()}
            </Dialog>

            {/* Exit Confirmation Dialog */}
            <Dialog
                open={exitDialogOpen}
                onClose={() => setExitDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 2 }
                }}
            >
                <DialogTitle component="div">
                    <Typography variant="h6" component="p" className="font-bold text-center">
                        Leave Egg Hunt?
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography className="text-center text-gray-600">
                        Are you sure you want to exit? Your progress will be saved.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setExitDialogOpen(false)}
                        sx={{
                            borderRadius: '12px',
                            borderColor: '#FF6A88',
                            color: '#FF6A88',
                            '&:hover': {
                                borderColor: '#ff4f73',
                                backgroundColor: 'rgba(255, 106, 136, 0.05)'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => router.push('/')}
                        sx={{
                            borderRadius: '12px',
                            background: 'linear-gradient(45deg, #FF6A88 0%, #FF9A8B 100%)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #ff4f73 0%, #ff8576 100%)'
                            }
                        }}
                    >
                        Exit Game
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Codex Unlock Popup */}
            <Dialog
                open={!!codexPopup}
                onClose={() => setCodexPopup(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 3, textAlign: 'center' }
                }}
            >
                <Box className="flex flex-col items-center">
                    <Typography variant="h3" className="mb-3">✨</Typography>
                    <Typography variant="h5" className="font-extrabold text-pink-600 mb-2">
                        Added to Codex!
                    </Typography>
                    <Typography variant="body2" className="text-gray-600 mb-6">
                        You unlocked a new symbol
                    </Typography>

                    <Box className="bg-pink-50 p-6 rounded-3xl border-2 border-pink-200 mb-6 w-full">
                        <Typography className="text-6xl mb-3">{codexPopup?.symbol}</Typography>
                        <Typography className="text-3xl font-black text-pink-600">{codexPopup?.letter}</Typography>
                    </Box>

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setCodexPopup(null)}
                        sx={{
                            borderRadius: '16px',
                            height: '48px',
                            background: 'linear-gradient(45deg, #FF6A88 0%, #FF9A8B 100%)',
                            fontWeight: 'bold'
                        }}
                    >
                        Continue
                    </Button>
                </Box>
            </Dialog>

            {/* Safety Dialog */}
            <SafetyDialog
                open={safetyDialogOpen}
                onAcknowledge={handleSafetyAcknowledge}
            />
        </Box>
    );
}
