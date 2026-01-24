import { useEffect, useState, useRef } from 'react';
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
import HomeIcon from '@mui/icons-material/Home';
import { EasterEventAPI } from '@/services/API';
import Map, { SpawnRadius, MapRef } from '@/components/Map';
import SafetyDialog from '@/components/SafetyDialog';
import styles from '@/styles/egg-hunt.module.css';
import { Colour } from '@/typings/Colour.enum';
import { Marker } from '@/typings/Task';

export default function EasterEventMap() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [testMode, setTestMode] = useState(true);
    const [celebrationPopup, setCelebrationPopup] = useState<{ subject: string; isGoldenEgg: boolean } | null>(null);
    const [questionPopup, setQuestionPopup] = useState<any>(null);
    const [goldenEggPopup, setGoldenEggPopup] = useState(false);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [exitDialogOpen, setExitDialogOpen] = useState(false);
    const [letterPopup, setLetterPopup] = useState<{ letter: string; symbol: string; isDuplicate: boolean } | null>(null);
    const [goldenEggResult, setGoldenEggResult] = useState<any>(null);
    const [spawnRadius, setSpawnRadius] = useState<SpawnRadius | null>(null);
    const [safetyDialogOpen, setSafetyDialogOpen] = useState(false);
    const [dailyProgress, setDailyProgress] = useState<{ collected: number; max: number } | null>(null);
    const mapRef = useRef<MapRef>(null);
    const router = useRouter();

    // Helper to calculate daily progress from session
    const calculateDailyProgress = (sess: any): { collected: number; max: number } => {
        if (!sess?.dailyEggs) return { collected: 0, max: 5 };
        const today = new Date().toISOString().split('T')[0];
        const todayEggs = sess.dailyEggs[today] || [];
        return { collected: todayEggs.length, max: 5 };
    };

    const fetchSpawnRadius = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await EasterEventAPI.getSpawnRadius(userId);
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

    const handleSafetyAcknowledge = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await EasterEventAPI.acknowledgeSafety(userId);
            if (res.ok && res.session) {
                setSession(res.session);
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
                const res: any = await EasterEventAPI.start(userId, lat, lng);
                setSession(res);
                fetchSpawnRadius();

                // Calculate daily progress immediately from session
                setDailyProgress(calculateDailyProgress(res));

                if (!res.safetyVerified) {
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
    const lastSentLocationRef = useRef<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        userLocationRef.current = userLocation;
    }, [userLocation]);

    // AWTY Polling
    useEffect(() => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        const checkAWTY = async () => {
            const currentLoc = userLocationRef.current;
            if (!currentLoc) return;

            const lastSent = lastSentLocationRef.current;
            if (lastSent) {
                const dist = Math.sqrt(
                    Math.pow(currentLoc.lat - lastSent.lat, 2) +
                    Math.pow(currentLoc.lng - lastSent.lng, 2)
                );
                if (dist < 0.00001) return;
            }

            try {
                const res: any = await EasterEventAPI.awty(userId, currentLoc.lat, currentLoc.lng);
                console.log("[EasterEventMap] AWTY Check:", res.message);

                if (res.session) {
                    setSession(res.session);
                }

                if (res.dailyProgress) {
                    setDailyProgress(res.dailyProgress);
                }

                // User arrived at egg - show celebration popup first
                if (res.arrived) {
                    const subject = res.session?.currentEgg?.subject || 'SCIENCE';
                    const isGoldenEgg = res.isGoldenEgg || false;
                    setCelebrationPopup({ subject, isGoldenEgg });
                }

                lastSentLocationRef.current = currentLoc;
            } catch (err) {
                console.error("AWTY check failed:", err);
            }
        };

        const interval = setInterval(checkAWTY, 5000);
        checkAWTY();

        return () => clearInterval(interval);
    }, []);

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
                }

                if (res.dailyProgress) {
                    setDailyProgress(res.dailyProgress);
                }

                // Show letter popup
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
            } else {
                setFeedback({ type: 'error', message: res.message || 'Incorrect!' });

                if (res.session) {
                    setSession(res.session);
                }

                setSubmitting(false);

                setTimeout(() => {
                    setQuestionPopup(null);
                    setAnswer('');
                    setFeedback(null);
                }, 2500);
            }
        } catch (err) {
            console.error(err);
            setFeedback({ type: 'error', message: 'Error submitting answer.' });
            setSubmitting(false);
        }
    };

    const handleCelebrationCollect = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId || !celebrationPopup) return;

        try {
            const res: any = await EasterEventAPI.confirmArrival(userId);

            if (res.dailyProgress) {
                setDailyProgress(res.dailyProgress);
            }

            setCelebrationPopup(null);

            if (celebrationPopup.isGoldenEgg) {
                // Golden egg - show golden egg popup (no question)
                setGoldenEggPopup(true);
            } else if (res.task) {
                // Regular egg - show question popup
                setQuestionPopup(res.task);
            }
        } catch (err) {
            console.error('Failed to confirm arrival:', err);
        }
    };

    const handleCollectGoldenEgg = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await EasterEventAPI.collectGolden(userId);
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
                <CircularProgress sx={{ color: '#22C55E' }} />
            </Box>
        );
    }

    const getEggColour = (subject: string, isGoldenEgg: boolean): Colour => {
        if (isGoldenEgg) return Colour.Yellow;
        if (subject === 'MATH') return Colour.Blue;
        if (subject === 'ENGLISH') return Colour.Orange;
        if (subject === 'SCIENCE') return Colour.Green;
        return Colour.Pink;
    };

    const getMarkers = (): Marker[] => {
        if (session?.currentEgg) {
            return [{
                lat: session.currentEgg.lat,
                lng: session.currentEgg.lng,
                title: session.currentEgg.isGoldenEgg ? 'Golden Egg!' : 'Easter Egg',
                subtitle: session.currentEgg.isGoldenEgg ? 'Special!' : 'Collect me!',
                colour: getEggColour(session.currentEgg.subject, session.currentEgg.isGoldenEgg)
            }];
        }
        return [];
    };

    const markers = getMarkers();
    const progress = dailyProgress || { collected: 0, max: 5 };

    return (
        <Box className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <Box className="px-4 py-3 bg-white shadow-sm flex items-center justify-between z-10" sx={{ flexShrink: 0 }}>
                {/* Left: Title and Progress */}
                <Box sx={{ minWidth: '140px' }}>
                    <Typography className="text-xs font-bold text-green-500 uppercase tracking-widest">Easter Event</Typography>
                    <Typography variant="body1" className="font-extrabold text-gray-800">
                        {progress.collected} / {progress.max} Eggs Today
                    </Typography>
                </Box>

                {/* Center: Timer and Buttons */}
                <Box className="flex items-center gap-2">
                    <Box className="bg-green-100 px-2 py-1 rounded-xl text-center">
                        <Typography className="text-[9px] font-bold text-green-600 leading-tight">RESPAWN</Typography>
                        <Typography className="text-sm font-black text-green-600 tabular-nums leading-tight">{formatTime(timeLeft)}</Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => router.push('/easter-event')}
                        sx={{
                            borderRadius: '12px',
                            borderColor: '#22C55E',
                            color: '#22C55E',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            px: 2,
                            py: 0.75,
                            textTransform: 'none',
                            minWidth: 'auto',
                            '&:hover': {
                                borderColor: '#16A34A',
                                backgroundColor: 'rgba(34, 197, 94, 0.05)'
                            }
                        }}
                        title="Back to HQ"
                    >
                        <HomeIcon sx={{ fontSize: '1rem' }} />
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
                </Box>

                {/* Right: Close Button */}
                <Box sx={{ minWidth: '48px', display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                        onClick={() => setExitDialogOpen(true)}
                        size="small"
                        sx={{
                            color: '#22C55E',
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
                    taskMarkers={markers}
                    userLocation={userLocation}
                    testMode={testMode}
                    zoom={20}
                    spawnRadius={spawnRadius || undefined}
                    onPlayerMove={(lat, lng) => {
                        setUserLocation({ lat, lng });
                    }}
                />

                {/* Daily Limit Reached Overlay */}
                {progress.collected >= progress.max && !session?.currentEgg && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 20,
                            p: 4
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: 'white',
                                borderRadius: '24px',
                                p: 4,
                                textAlign: 'center',
                                maxWidth: '320px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                            }}
                        >
                            <Typography sx={{ fontSize: '4rem', mb: 2 }}>🎉</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#22C55E', mb: 2 }}>
                                Great Job!
                            </Typography>
                            <Typography sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>
                                Thank you! You&apos;ve done enough for today, come back tomorrow!
                            </Typography>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => router.push('/easter-event')}
                                sx={{
                                    borderRadius: '16px',
                                    height: '56px',
                                    background: 'linear-gradient(45deg, #22C55E 0%, #16A34A 100%)',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem'
                                }}
                            >
                                Back to HQ
                            </Button>
                        </Box>
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
                    const eggColor = getEggColour(celebrationPopup.subject, celebrationPopup.isGoldenEgg);
                    const colorMap: Record<string, { bg: string; text: string; gradient: string }> = {
                        'blue': { bg: '#EFF6FF', text: '#1D4ED8', gradient: 'linear-gradient(45deg, #3B82F6 0%, #2563EB 100%)' },
                        'orange': { bg: '#FFF7ED', text: '#C2410C', gradient: 'linear-gradient(45deg, #F97316 0%, #EA580C 100%)' },
                        'green': { bg: '#F0FDF4', text: '#15803D', gradient: 'linear-gradient(45deg, #22C55E 0%, #16A34A 100%)' },
                        'yellow': { bg: '#FEFCE8', text: '#A16207', gradient: 'linear-gradient(45deg, #F59E0B 0%, #D97706 100%)' },
                        'pink': { bg: '#FDF2F8', text: '#BE185D', gradient: 'linear-gradient(45deg, #EC4899 0%, #DB2777 100%)' }
                    };
                    const colors = colorMap[eggColor] || colorMap['green'];

                    // Get the correct egg SVG path
                    const getEggSvgPath = (color: string, isGolden: boolean): string => {
                        if (isGolden) return '/eggs/egg-gold.svg';
                        if (color === 'blue') return '/eggs/egg-blue.svg';
                        if (color === 'orange') return '/eggs/egg-orange.svg';
                        if (color === 'green') return '/eggs/egg-green.svg';
                        return '/eggs/egg-blue.svg';
                    };
                    const eggSvgPath = getEggSvgPath(eggColor, celebrationPopup.isGoldenEgg);

                    return (
                        <Box className="flex flex-col items-center">
                            <Box
                                sx={{
                                    width: 140,
                                    height: 170,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2
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
                            <Typography component="p" variant="h4" sx={{ fontWeight: 800, color: colors.text, mb: 1 }}>
                                {celebrationPopup.isGoldenEgg ? 'GOLDEN EGG!' : 'Woohoo!'}
                            </Typography>
                            <Typography component="p" variant="h6" sx={{ color: '#6B7280', mb: 4 }}>
                                {celebrationPopup.isGoldenEgg
                                    ? 'You found the legendary Golden Egg!'
                                    : 'You found an egg!'}
                            </Typography>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleCelebrationCollect}
                                sx={{
                                    borderRadius: '16px',
                                    height: '56px',
                                    background: colors.gradient,
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    '&:hover': {
                                        opacity: 0.9
                                    }
                                }}
                            >
                                {celebrationPopup.isGoldenEgg ? 'Open Golden Egg!' : 'Collect Egg!'}
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
                    const eggColor = getEggColour(questionPopup.subject, false);
                    const colorClass = `egg-${eggColor}`;
                    const colorMap: Record<string, string> = {
                        'blue': '#3B82F6',
                        'orange': '#F97316',
                        'green': '#22C55E',
                        'pink': '#EC4899'
                    };
                    const borderColor = colorMap[eggColor] || '#22C55E';
                    const buttonClasses = [styles['submit-button'], styles[colorClass]].filter(Boolean).join(' ');

                    return (
                        <>
                            <DialogTitle className={styles[colorClass]} sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" className="font-bold uppercase tracking-widest opacity-90">
                                    {questionPopup.subject} Question
                                </Typography>
                                <Typography variant="h5" className="font-extrabold mt-1">
                                    Answer to Collect Egg
                                </Typography>
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
                                        }
                                    }}
                                />
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
                <Box className="flex flex-col items-center">
                    <Typography className="text-6xl mb-4">🌟</Typography>
                    <Typography variant="h4" className="font-extrabold text-yellow-600 mb-2">
                        GOLDEN EGG!
                    </Typography>
                    <Typography className="text-gray-600 mb-6">
                        You found the legendary Golden Egg! This is a special message from Fergus...
                    </Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleCollectGoldenEgg}
                        sx={{
                            borderRadius: '16px',
                            height: '48px',
                            background: 'linear-gradient(45deg, #F59E0B 0%, #D97706 100%)',
                            fontWeight: 'bold',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #D97706 0%, #B45309 100%)'
                            }
                        }}
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
                    <Box className="flex flex-col items-center">
                        <Typography className="text-5xl mb-4">🦊</Typography>
                        <Typography variant="h5" className="font-extrabold text-purple-600 mb-2">
                            A Message from Fergus!
                        </Typography>
                        <Box className="bg-purple-50 p-4 rounded-2xl border-2 border-purple-200 mb-4 w-full">
                            <Typography variant="h6" className="font-bold text-purple-800 mb-2">
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
                            sx={{
                                borderRadius: '16px',
                                height: '48px',
                                background: 'linear-gradient(45deg, #9333EA 0%, #7C3AED 100%)',
                                fontWeight: 'bold'
                            }}
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
                    sx: { borderRadius: '24px', p: 3, textAlign: 'center' }
                }}
            >
                {letterPopup && (
                    <Box className="flex flex-col items-center">
                        <Typography variant="h3" className="mb-3">
                            {letterPopup.isDuplicate ? '😅' : '✨'}
                        </Typography>
                        <Typography variant="h5" className={`font-extrabold mb-2 ${letterPopup.isDuplicate ? 'text-orange-600' : 'text-green-600'}`}>
                            {letterPopup.isDuplicate ? 'Duplicate!' : 'Added to Codex!'}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mb-6">
                            {letterPopup.isDuplicate
                                ? `Oh no! We already have ${letterPopup.letter}!`
                                : `You unlocked a new symbol!`
                            }
                        </Typography>
                        <Box className={`p-6 rounded-3xl border-2 mb-6 w-full ${letterPopup.isDuplicate ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                            <Typography className="text-6xl mb-3">{letterPopup.symbol}</Typography>
                            <Typography className={`text-3xl font-black ${letterPopup.isDuplicate ? 'text-orange-600' : 'text-green-600'}`}>
                                {letterPopup.letter}
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setLetterPopup(null)}
                            sx={{
                                borderRadius: '16px',
                                height: '48px',
                                background: letterPopup.isDuplicate
                                    ? 'linear-gradient(45deg, #F97316 0%, #EA580C 100%)'
                                    : 'linear-gradient(45deg, #22C55E 0%, #16A34A 100%)',
                                fontWeight: 'bold'
                            }}
                        >
                            Continue
                        </Button>
                    </Box>
                )}
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
                <DialogTitle>
                    <Typography variant="h6" className="font-bold text-center">
                        Leave Easter Hunt?
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
                            borderColor: '#22C55E',
                            color: '#22C55E'
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
                            background: 'linear-gradient(45deg, #22C55E 0%, #16A34A 100%)'
                        }}
                    >
                        Exit Game
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Safety Dialog */}
            <SafetyDialog
                open={safetyDialogOpen}
                onAcknowledge={handleSafetyAcknowledge}
            />
        </Box>
    );
}
