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
    CircularProgress
} from '@mui/material';
import Map, { MapRef } from '@/components/Map';
import { CustomTrailAPI } from '@/services/API';
import { Colour } from '@/typings/Colour.enum';
import { Marker } from '@/typings/Task';
import { getPinMarkerProps } from '@/config/pinIcons';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { IconButton } from '@mui/material';

const AWTY_INTERVAL = 5000;

type GameState = 'loading' | 'preview' | 'playing' | 'arrived' | 'question' | 'success' | 'completed' | 'error';

interface TrailInfo {
    id: string;
    theme: string;
    name?: string;
    startLocation: { lat: number; lng: number };
    pinCount: number;
    competitive: boolean;
    playCount: number;
    mode?: 'random' | 'custom';
}

interface PlaySession {
    currentPinIndex: number;
    collectedPins: number[];
    completed: boolean;
    totalPins: number;
}

interface TrailPin {
    lat: number;
    lng: number;
    icon: string;
    order: number;
    collected: boolean;
    collectedByYou?: boolean;
    collectedBy?: string | null;
}

export default function PlayCustomTrail() {
    const router = useRouter();
    const { id, user_id } = router.query;
    const trailId = id as string;
    const [userId] = useState(() => (user_id as string) || `player_${Date.now()}`);

    const [gameState, setGameState] = useState<GameState>('loading');
    const [trailInfo, setTrailInfo] = useState<TrailInfo | null>(null);
    const [session, setSession] = useState<PlaySession | null>(null);
    const [trailPins, setTrailPins] = useState<TrailPin[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [questionText, setQuestionText] = useState('');
    const [answer, setAnswer] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [answerError, setAnswerError] = useState<string | null>(null);
    const [activePinIndex, setActivePinIndex] = useState<number | undefined>(undefined);
    const [isCompetitive, setIsCompetitive] = useState(false);
    const [testMode, setTestMode] = useState(process.env.NODE_ENV !== 'production');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    const awtyRef = useRef<NodeJS.Timeout | null>(null);
    const awtyInFlight = useRef(false);
    const mapRef = useRef<MapRef>(null);

    // Fetch trail info on mount
    useEffect(() => {
        if (!trailId) return;
        (async () => {
            try {
                const result: any = await CustomTrailAPI.getTrail(trailId);
                if (result.ok) {
                    setTrailInfo(result.trail);
                    setGameState('preview');
                } else {
                    setErrorMessage(result.message || 'Trail not found');
                    setGameState('error');
                }
            } catch {
                setErrorMessage('Failed to load trail');
                setGameState('error');
            }
        })();
    }, [trailId]);

    // Watch user location (skip in test mode — player marker is draggable instead)
    useEffect(() => {
        if (testMode) return;
        if (gameState !== 'playing' && gameState !== 'arrived') return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => { },
            { enableHighAccuracy: true, maximumAge: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [gameState, testMode]);

    // AWTY polling — uses a lock to prevent overlapping calls from racing
    const gameStateRef = useRef(gameState);
    gameStateRef.current = gameState;

    const pollAWTY = useCallback(async () => {
        if (!userLocation || !trailId || gameStateRef.current !== 'playing') return;
        if (awtyInFlight.current) return; // prevent overlapping calls
        awtyInFlight.current = true;

        try {
            const result: any = await CustomTrailAPI.awty(userId, trailId, userLocation.lat, userLocation.lng);

            // After the await, check current state — not the stale closure value
            if (gameStateRef.current !== 'playing') return;
            if (!result.ok) return;

            if (result.completed) {
                if (result.successMessage) setSuccessMessage(result.successMessage);
                if (result.session) setSession(result.session);
                if (result.trail?.pins) setTrailPins(result.trail.pins);
                setGameState('completed');
                return;
            }

            if (result.session) setSession(result.session);
            if (result.trail?.pins) setTrailPins(result.trail.pins);

            if (result.competitive !== undefined) setIsCompetitive(result.competitive);

            if (result.arrived) {
                if (result.task?.type === 'question') {
                    setQuestionText(result.task.content);
                    setActivePinIndex(result.task.pinIndex);
                    setAnswer('');
                    setAnswerError(null);
                    setGameState('question');
                } else if (result.collected) {
                    setSuccessMessage(result.successMessage || 'Found it!');
                    setGameState(result.completed ? 'completed' : 'success');
                    if (result.session) setSession(result.session);
                    if (result.trail?.pins) setTrailPins(result.trail.pins);
                }
            } else {
                setHint(result.hint || null);
            }
        } catch { /* ignore polling errors */ } finally {
            awtyInFlight.current = false;
        }
    }, [userLocation, trailId, userId]);

    // Store pollAWTY in a ref so the interval always calls the latest version
    const pollAWTYRef = useRef(pollAWTY);
    pollAWTYRef.current = pollAWTY;

    useEffect(() => {
        if (gameState !== 'playing') {
            if (awtyRef.current) clearInterval(awtyRef.current);
            return;
        }
        // Use ref-based callback so the interval doesn't need to be recreated on every GPS update
        const poll = () => pollAWTYRef.current();
        awtyRef.current = setInterval(poll, AWTY_INTERVAL);
        poll(); // immediate first poll
        return () => { if (awtyRef.current) clearInterval(awtyRef.current); };
    }, [gameState]);

    const handleStart = async () => {
        if (!trailId) return;

        // Get user's location first
        setGameState('loading');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserLocation({ lat, lng });

                try {
                    const result: any = await CustomTrailAPI.start(userId, trailId, lat, lng);
                    if (result.ok) {
                        setSession(result.session);
                        if (result.competitive !== undefined) setIsCompetitive(result.competitive);
                        if (result.trail?.pins) setTrailPins(result.trail.pins);
                        setGameState('playing');
                    } else {
                        setErrorMessage(result.message || 'Failed to start');
                        setGameState('error');
                    }
                } catch {
                    setErrorMessage('Failed to start trail');
                    setGameState('error');
                }
            },
            () => {
                setErrorMessage('Location access is required to play');
                setGameState('error');
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmitAnswer = async () => {
        if (!answer.trim()) return;
        setAnswerError(null);

        try {
            const result: any = await CustomTrailAPI.collect(userId, trailId, answer.trim(), activePinIndex);

            if (result.correct) {
                setSuccessMessage(result.successMessage || 'Correct!');
                if (result.session) setSession(result.session);
                if (result.trail?.pins) setTrailPins(result.trail.pins);
                setGameState(result.completed ? 'completed' : 'success');
            } else {
                setAnswerError(result.message || 'Incorrect! Try again.');
            }
        } catch {
            setAnswerError('Network error, try again');
        }
    };

    const handleSuccessDismiss = () => {
        setGameState('playing');
    };

    const handleResetLocation = async () => {
        setResetting(true);
        try {
            await CustomTrailAPI.restart(userId, trailId);
            setShowResetConfirm(false);
            setSession(null);
            setTrailPins([]);
            setHint(null);
            // Re-start from current location
            handleStart();
        } catch {
            setShowResetConfirm(false);
        }
        setResetting(false);
    };

    // Build map markers from trail pins
    const markers: Marker[] = trailPins
        .filter((pin) => !pin.collected || pin.collectedByYou) // In competitive, hide pins others collected
        .map((pin) => ({
            lat: pin.lat,
            lng: pin.lng,
            title: `Pin ${pin.order + 1}`,
            subtitle: pin.collected
                ? (pin.collectedByYou ? 'You found this!' : 'Taken')
                : 'Find me!',
            colour: pin.collected ? Colour.Green : Colour.Red,
            ...(!pin.collected && pin.icon ? getPinMarkerProps(pin.icon) : {})
        }));

    // Find the marker index for current target pin (order may differ from array index)
    // Returns undefined if pin is hidden (not in markers array) - no indicator shown for hidden pins
    const currentPin = session ? trailPins.find(p => p.order === session.currentPinIndex) : null;
    const foundIndex = currentPin ? markers.findIndex(m => m.lat === currentPin.lat && m.lng === currentPin.lng) : -1;
    const currentTargetMarkerIndex = foundIndex >= 0 ? foundIndex : undefined;

    const themeLabel = trailInfo?.theme === 'easter' ? 'Easter Egg Hunt'
        : trailInfo?.theme === 'valentine' ? "Valentine's Trail"
        : 'Treasure Hunt';

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F8F5F2' }}>

            {/* Loading */}
            {gameState === 'loading' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
                    <CircularProgress size={48} sx={{ color: '#FF2E5B' }} />
                    <Typography sx={{ color: '#6b7280' }}>Loading...</Typography>
                </Box>
            )}

            {/* Error */}
            {gameState === 'error' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2, p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444' }}>Oops!</Typography>
                    <Typography sx={{ color: '#6b7280', textAlign: 'center' }}>{errorMessage}</Typography>
                    <Button onClick={() => router.back()} sx={{ textTransform: 'none' }}>Go Back</Button>
                </Box>
            )}

            {/* Preview */}
            {gameState === 'preview' && trailInfo && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 3, p: 3 }}>
                    <Typography sx={{ fontSize: '3rem' }}>
                        {trailInfo.theme === 'easter' ? '🥚' : trailInfo.theme === 'valentine' ? '❤️' : '🗺️'}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
                        {trailInfo.name || themeLabel}
                    </Typography>
                    {trailInfo.theme !== 'valentine' && (
                        <Typography sx={{ color: '#6b7280', textAlign: 'center' }}>
                            {themeLabel} &middot; {trailInfo.pinCount} location{trailInfo.pinCount !== 1 ? 's' : ''} to find
                            {trailInfo.competitive && ' (Competitive)'}
                        </Typography>
                    )}
                    {trailInfo.theme !== 'valentine' && trailInfo.playCount > 0 && (
                        <Typography sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                            Played {trailInfo.playCount} time{trailInfo.playCount !== 1 ? 's' : ''}
                        </Typography>
                    )}
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleStart}
                        sx={{
                            py: 2,
                            px: 6,
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 14px rgba(255,46,91,0.3)',
                            backgroundColor: '#FF2E5B !important',
                        }}
                    >
                        Start!
                    </Button>
                </Box>
            )}

            {/* Playing - Map View */}
            {gameState === 'playing' && (
                <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        backgroundColor: 'white',
                        borderBottom: '1px solid #e5e7eb',
                        zIndex: 10
                    }}>
                        <Typography sx={{ fontWeight: 700 }}>
                            {trailInfo?.name || themeLabel}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 600, color: '#FF2E5B' }}>
                                {session
                                    ? isCompetitive
                                        ? `You: ${session.collectedPins.length} | ${(session as any).remainingPins ?? '?'} left`
                                        : `${session.collectedPins.length}/${session.totalPins}`
                                    : ''}
                            </Typography>
                            {trailInfo?.mode === 'random' && (
                                <IconButton
                                    size="small"
                                    onClick={() => setShowResetConfirm(true)}
                                    title="Reset to current location"
                                    sx={{ color: '#9ca3af' }}
                                >
                                    <MyLocationIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    {/* Hint */}
                    {hint && (
                        <Box sx={{
                            position: 'absolute',
                            top: 70,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 20,
                            backgroundColor: 'rgba(0,0,0,0.75)',
                            color: 'white',
                            px: 3,
                            py: 1,
                            borderRadius: '20px'
                        }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {hint}
                            </Typography>
                        </Box>
                    )}

                    {/* Map */}
                    <Box sx={{ flex: 1 }}>
                        <Map
                            ref={mapRef}
                            taskMarkers={markers}
                            userLocation={userLocation}
                            testMode={testMode}
                            zoom={16}
                            onPlayerMove={(lat, lng) => {
                                if (testMode) setUserLocation({ lat, lng });
                            }}
                            // Custom trails are always sequential - only show indicator for current target pin
                            targetMarkerIndex={currentTargetMarkerIndex}
                        />
                    </Box>
                </Box>
            )}

            {/* Question Dialog */}
            <Dialog
                open={gameState === 'question'}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    You found a pin!
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        {questionText}
                    </Typography>
                    <TextField
                        fullWidth
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Your answer..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                        error={!!answerError}
                        helperText={answerError}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleSubmitAnswer}
                        disabled={!answer.trim()}
                        sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 4,
                            backgroundColor: '#FF2E5B !important',
                        }}
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Dialog */}
            <Dialog
                open={gameState === 'success'}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
            >
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>
                        {trailInfo?.theme === 'easter' ? '🥚' : trailInfo?.theme === 'valentine' ? '💗' : '⭐'}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        Found it!
                    </Typography>
                    <Typography sx={{ color: '#4b5563', mb: 1 }}>
                        {successMessage}
                    </Typography>
                    {session && (
                        <Typography sx={{ color: '#9ca3af', mt: 2, fontSize: '0.85rem' }}>
                            {session.collectedPins.length} of {session.totalPins} collected
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleSuccessDismiss}
                        sx={{
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 6,
                            py: 1.5,
                            backgroundColor: '#2DB87A !important',
                        }}
                    >
                        Next!
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reset Location Confirmation */}
            <Dialog
                open={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Reset Location?
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        This will restart the trail and place your pins around your current location. Any progress will be lost.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setShowResetConfirm(false)}
                        sx={{ textTransform: 'none', color: '#6b7280' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleResetLocation}
                        disabled={resetting}
                        sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            backgroundColor: '#FF2E5B !important',
                        }}
                    >
                        {resetting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Reset'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Completed */}
            {gameState === 'completed' && (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    gap: 3,
                    p: 3,
                    textAlign: 'center'
                }}>
                    <Typography sx={{ fontSize: '4rem' }}>
                        {trailInfo?.theme === 'easter' ? '🏆' : trailInfo?.theme === 'valentine' ? '💕' : '🎉'}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {trailInfo?.theme === 'valentine' ? 'Trail Complete!' : 'You did it!'}
                    </Typography>
                    {successMessage && (
                        <Typography sx={{ fontSize: '1.1rem', color: '#4b5563', maxWidth: 400 }}>
                            {successMessage}
                        </Typography>
                    )}
                    <Typography sx={{ color: '#9ca3af' }}>
                        All {session?.totalPins} locations found!
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
