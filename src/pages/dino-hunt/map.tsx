import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, CircularProgress, Chip, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DinoHuntAPI } from '@/services/API/DinoHuntAPI';
import Map, { MapRef } from '@/components/Map';
import DinoStatsChart from '@/components/dino-hunt/DinoStatsChart';
import RarityBadge from '@/components/dino-hunt/RarityBadge';
import { Colour } from '@/typings/Colour.enum';
import { Marker } from '@/typings/Task';
import styles from '@/styles/dino-hunt.module.css';

// Map egg colors to Colour enum for map markers
const EGG_COLOR_MAP: Record<string, Colour> = {
    '#EAB308': Colour.Yellow,
    '#EF4444': Colour.Red,
    '#1F2937': Colour.Purple,
    '#A855F7': Colour.Purple,
    '#3B82F6': Colour.Blue,
    '#38BDF8': Colour.Blue,
    '#22C55E': Colour.Green,
    '#F97316': Colour.Orange,
    '#6B7280': Colour.Blue,
    '#92400E': Colour.Orange,
};

const CATEGORY_INFO: Record<string, { name: string; emoji: string; eggColor: string }> = {
    fastest: { name: 'The Fastest', emoji: '💨', eggColor: '#EAB308' },
    aggressive: { name: 'The Most Aggressive', emoji: '😡', eggColor: '#EF4444' },
    deadliest: { name: 'The Deadliest', emoji: '💀', eggColor: '#1F2937' },
    weirdest: { name: 'The Weirdest', emoji: '🤪', eggColor: '#A855F7' },
    sea: { name: 'The Sea Creatures', emoji: '🌊', eggColor: '#3B82F6' },
    flying: { name: 'The Flyers', emoji: '🦅', eggColor: '#38BDF8' },
    smartest: { name: 'The Smartest', emoji: '🧠', eggColor: '#22C55E' },
    biggest: { name: 'The Biggest', emoji: '🏔️', eggColor: '#F97316' },
    armoured: { name: 'The Armoured', emoji: '🛡️', eggColor: '#6B7280' },
    horns_spikes: { name: 'Horns & Spikes', emoji: '🦏', eggColor: '#92400E' },
};

export default function DinoHuntMap() {
    const router = useRouter();
    const mapRef = useRef<MapRef>(null);
    const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Dialog states
    const [arrivedPopup, setArrivedPopup] = useState<any>(null);     // egg arrival data
    const [questionPopup, setQuestionPopup] = useState<any>(null);   // question + options
    const [revealPopup, setRevealPopup] = useState<any>(null);       // dinosaur reveal
    const [namingPopup, setNamingPopup] = useState(false);           // nickname input
    const [nickname, setNickname] = useState('');
    const [goldenEggArrived, setGoldenEggArrived] = useState(false); // golden egg arrival
    const [storyLoading, setStoryLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Current dino data (from answer, before naming)
    const [pendingDino, setPendingDino] = useState<any>(null);

    // Store option rarities for answering
    const [currentOptionRarities, setCurrentOptionRarities] = useState<string[]>([]);

    // Initialize: get location and resume game
    useEffect(() => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) {
            router.replace('/dino-hunt');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                userLocationRef.current = loc;

                try {
                    const result: any = await DinoHuntAPI.start(userId, loc.lat, loc.lng);
                    const sess = result.session || result;
                    setSession(sess);

                    if (sess.phase === 'setup') {
                        router.replace('/dino-hunt');
                        return;
                    }
                    if (sess.phase === 'victory') {
                        router.replace('/dino-hunt');
                        return;
                    }
                } catch (err) {
                    console.error('Failed to resume dino hunt:', err);
                }
                setLoading(false);
            },
            () => {
                // Fallback location
                const loc = { lat: 51.4545, lng: -2.5879 };
                setUserLocation(loc);
                userLocationRef.current = loc;
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [router]);

    // GPS tracking
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                userLocationRef.current = loc;
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // AWTY polling (every 5 seconds)
    useEffect(() => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId || !session) return;

        // Don't poll during dialogs
        const isInDialog = arrivedPopup || questionPopup || revealPopup || namingPopup || goldenEggArrived || storyLoading;

        const checkAWTY = async () => {
            if (isInDialog) return;
            const loc = userLocationRef.current;
            if (!loc) return;

            try {
                const res: any = await DinoHuntAPI.awty(userId, loc.lat, loc.lng);
                if (res.session) setSession(res.session);

                if (res.arrived && res.phase === 'hunting' && res.question) {
                    setArrivedPopup(res);
                } else if (res.arrived && res.phase === 'golden_egg' && res.goldenEggReady) {
                    setGoldenEggArrived(true);
                }
            } catch (err) {
                console.error('AWTY check failed:', err);
            }
        };

        const interval = setInterval(checkAWTY, 5000);
        checkAWTY();
        return () => clearInterval(interval);
    }, [session, arrivedPopup, questionPopup, revealPopup, namingPopup, goldenEggArrived, storyLoading]);

    // Build map markers from eggs
    const getMarkers = useCallback((): Marker[] => {
        if (!session?.eggs) return [];
        const markers: Marker[] = [];

        for (const egg of session.eggs) {
            const catInfo = CATEGORY_INFO[egg.categoryId] || { name: '?', emoji: '🥚', eggColor: '#888' };
            markers.push({
                lat: egg.lat,
                lng: egg.lng,
                title: egg.collected ? '✓' : catInfo.emoji,
                subtitle: egg.collected ? 'Collected' : catInfo.name,
                colour: egg.collected ? Colour.Green : (EGG_COLOR_MAP[catInfo.eggColor] || Colour.Orange),
            });
        }

        // Golden egg marker
        if (session.phase === 'golden_egg' && session.startPosition) {
            markers.push({
                lat: session.startPosition.lat,
                lng: session.startPosition.lng,
                title: '🥚',
                subtitle: 'Golden Egg!',
                colour: Colour.Yellow,
            });
        }

        return markers;
    }, [session]);

    // Handle "Open Egg" from arrival popup
    const handleOpenEgg = () => {
        if (!arrivedPopup) return;
        setQuestionPopup(arrivedPopup);
        setCurrentOptionRarities(arrivedPopup.question._optionRarities || []);
        setArrivedPopup(null);
    };

    // Handle answer selection
    const handleAnswer = async (answerIndex: number) => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const userId = localStorage.getItem('twimp_user_id')!;
            const result: any = await DinoHuntAPI.answerQuestion(
                userId, answerIndex, currentOptionRarities
            );

            if (result.ok) {
                setPendingDino(result.dinosaur);
                setRevealPopup({
                    dinosaur: result.dinosaur,
                    revealMessage: result.revealMessage,
                });
                setQuestionPopup(null);
            }
        } catch (err) {
            console.error('Answer failed:', err);
        }
        setSubmitting(false);
    };

    // Handle opening naming dialog from reveal
    const handleNameDino = () => {
        setRevealPopup(null);
        setNickname('');
        setNamingPopup(true);
    };

    // Handle submitting nickname
    const handleSubmitNickname = async () => {
        if (!nickname.trim() || !pendingDino || submitting) return;
        setSubmitting(true);

        try {
            const userId = localStorage.getItem('twimp_user_id')!;
            const result: any = await DinoHuntAPI.nameDino(userId, nickname.trim(), pendingDino);

            if (result.ok) {
                setSession(result.session);
                setNamingPopup(false);
                setPendingDino(null);
                setNickname('');

                if (result.goldenEggSpawned) {
                    // All 10 collected — golden egg notification handled by session update
                }
            }
        } catch (err) {
            console.error('Name dino failed:', err);
        }
        setSubmitting(false);
    };

    // Handle golden egg collection
    const handleCollectGoldenEgg = async () => {
        setGoldenEggArrived(false);
        setStoryLoading(true);

        try {
            const userId = localStorage.getItem('twimp_user_id')!;
            const result: any = await DinoHuntAPI.collectGoldenEgg(userId);

            if (result.ok) {
                // Redirect to victory screen
                router.replace('/dino-hunt');
            }
        } catch (err) {
            console.error('Collect golden egg failed:', err);
        }
        setStoryLoading(false);
    };

    if (loading) {
        return (
            <Box className={`${styles.page} ${styles.loadingContainer}`}>
                <CircularProgress sx={{ color: 'white' }} />
                <Typography sx={{ color: 'white' }}>Loading map...</Typography>
            </Box>
        );
    }

    // Story generation loading
    if (storyLoading) {
        return (
            <Box className={`${styles.page} ${styles.loadingContainer}`}>
                <Typography sx={{ fontSize: '4rem' }}>⚔️</Typography>
                <CircularProgress sx={{ color: '#fbbf24' }} />
                <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    The battle is beginning...
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    Your army is preparing to face Dr. Fossilus!
                </Typography>
            </Box>
        );
    }

    const collectedCount = session?.collectedCount || session?.collectedDinos?.length || 0;
    const markers = getMarkers();

    return (
        <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
            {/* Progress header */}
            <Box className={styles.mapProgressBar}>
                <Box className={styles.eggCounter}>
                    🥚 {collectedCount}/10 Eggs
                </Box>
                {session?.phase === 'golden_egg' && (
                    <Chip
                        label="🌟 Return to start!"
                        sx={{
                            backgroundColor: '#fbbf24',
                            color: '#064e3b',
                            fontWeight: 'bold',
                            animation: 'goldenPulse 1.5s ease-in-out infinite',
                        }}
                    />
                )}
                <IconButton onClick={() => router.push('/dino-hunt')} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Map */}
            <Map
                ref={mapRef}
                taskMarkers={markers}
                userLocation={userLocation}
                zoom={17}
                onPlayerMove={() => {}}
            />

            {/* ===== ARRIVAL POPUP ===== */}
            <Dialog
                open={!!arrivedPopup}
                onClose={() => setArrivedPopup(null)}
                PaperProps={{ sx: { borderRadius: '24px', textAlign: 'center', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
                    {arrivedPopup?.category?.emoji} You found an egg!
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: '4rem', mb: 1 }}>🥚</Typography>
                    <Typography sx={{ fontWeight: 'bold', color: arrivedPopup?.category?.eggColor }}>
                        {arrivedPopup?.category?.name}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleOpenEgg}
                        sx={{
                            backgroundColor: '#047857 !important',
                            borderRadius: '16px',
                            px: 4, fontWeight: 'bold',
                        }}
                    >
                        Open Egg!
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== QUESTION POPUP ===== */}
            <Dialog
                open={!!questionPopup}
                onClose={() => {}}
                PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: 400 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {questionPopup?.category?.emoji} {questionPopup?.category?.name}
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2, textAlign: 'center', fontWeight: 500 }}>
                        {questionPopup?.question?.text}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {questionPopup?.question?.options?.map((option: string, i: number) => (
                            <Button
                                key={i}
                                variant="outlined"
                                onClick={() => handleAnswer(i)}
                                disabled={submitting}
                                className={styles.answerButton}
                                fullWidth
                            >
                                {option}
                            </Button>
                        ))}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* ===== DINOSAUR REVEAL POPUP ===== */}
            <Dialog
                open={!!revealPopup}
                onClose={() => {}}
                PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: 360 } }}
            >
                <DialogContent sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', mb: 1, color: '#047857' }}>
                        {revealPopup?.revealMessage}
                    </Typography>

                    <Typography sx={{ fontSize: '4rem', mb: 1 }}>🦖</Typography>

                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {revealPopup?.dinosaur?.name}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <RarityBadge rarity={revealPopup?.dinosaur?.rarity || 'common'} />
                    </Box>

                    <DinoStatsChart
                        stats={revealPopup?.dinosaur?.stats || { speed: 0, size: 0, strength: 0, intelligence: 0, defence: 0, aggression: 0 }}
                        rarity={revealPopup?.dinosaur?.rarity || 'common'}
                    />

                    <Typography sx={{ fontWeight: 'bold', mt: 1.5, fontSize: '1rem' }}>
                        Total Score: {revealPopup?.dinosaur?.total}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleNameDino}
                        sx={{
                            backgroundColor: '#047857 !important',
                            borderRadius: '16px',
                            px: 4, fontWeight: 'bold',
                        }}
                    >
                        Give it a Nickname!
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== NAMING POPUP ===== */}
            <Dialog
                open={namingPopup}
                onClose={() => {}}
                PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: 360 } }}
            >
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                    Name your {pendingDino?.name}!
                </DialogTitle>
                <DialogContent>
                    <TextField
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value.substring(0, 20))}
                        placeholder="e.g. Chompy, Sir Bitesalot, Kevin"
                        fullWidth
                        autoFocus
                        sx={{ mt: 1 }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSubmitNickname();
                        }}
                        inputProps={{ maxLength: 20 }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 0.5, textAlign: 'right' }}>
                        {nickname.length}/20
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleSubmitNickname}
                        disabled={!nickname.trim() || submitting}
                        sx={{
                            backgroundColor: '#047857 !important',
                            borderRadius: '16px',
                            px: 4, fontWeight: 'bold',
                        }}
                    >
                        {submitting ? <CircularProgress size={24} /> : 'Add to Army!'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== GOLDEN EGG ARRIVAL POPUP ===== */}
            <Dialog
                open={goldenEggArrived}
                onClose={() => {}}
                PaperProps={{ sx: { borderRadius: '24px', p: 1, textAlign: 'center' } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
                    ⚔️ The Final Battle
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: '4rem', mb: 1 }} className={styles.goldenEggPulse}>
                        🥚
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                        Your army of {collectedCount} dinosaurs is ready.
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>
                        It&apos;s time to face Dr. Fossilus!
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleCollectGoldenEgg}
                        sx={{
                            backgroundColor: '#fbbf24 !important',
                            color: '#064e3b',
                            borderRadius: '16px',
                            px: 4, fontWeight: 'bold',
                            fontSize: '1rem',
                        }}
                    >
                        Begin Final Battle!
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
