import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, CircularProgress, TextField } from '@mui/material';
import { DinoHuntAPI } from '@/services/API/DinoHuntAPI';
import DinoArmyRoster from '@/components/dino-hunt/DinoArmyRoster';
import styles from '@/styles/dino-hunt.module.css';

const DINO_OPTIONS = [
    { id: 'trex', name: 'T-Rex', emoji: '🦖' },
    { id: 'triceratops', name: 'Triceratops', emoji: '🦕' },
    { id: 'velociraptor', name: 'Velociraptor', emoji: '🦖' },
    { id: 'stegosaurus', name: 'Stegosaurus', emoji: '🦕' },
    { id: 'brachiosaurus', name: 'Brachiosaurus', emoji: '🦕' },
    { id: 'pteranodon', name: 'Pteranodon', emoji: '🦅' },
];

export default function DinoHuntIndex() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [selectedDino, setSelectedDino] = useState<string | null>(null);
    const [customDino, setCustomDino] = useState('');
    const [showIntro, setShowIntro] = useState(false);
    const [introStory, setIntroStory] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let userId = localStorage.getItem('twimp_user_id');
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem('twimp_user_id', userId);
        }

        // Get GPS and start/resume game
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const result: any = await DinoHuntAPI.start(
                        userId!, pos.coords.latitude, pos.coords.longitude
                    );
                    setSession(result.session || result);
                } catch (err) {
                    console.error('Failed to start dino hunt:', err);
                }
                setLoading(false);
            },
            () => {
                // Fallback with default location
                DinoHuntAPI.start(userId!, 51.4545, -2.5879).then((result: any) => {
                    setSession(result.session || result);
                    setLoading(false);
                }).catch(() => setLoading(false));
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    // Redirect to map if game is in progress
    useEffect(() => {
        if (!session) return;
        if (session.phase === 'hunting' || session.phase === 'golden_egg') {
            router.replace('/dino-hunt/map');
        }
    }, [session, router]);

    const handleChooseDino = async () => {
        const dinoId = customDino.trim() || selectedDino;
        if (!dinoId) return;

        setSubmitting(true);
        try {
            const userId = localStorage.getItem('twimp_user_id')!;
            const result: any = await DinoHuntAPI.chooseDino(userId, dinoId);
            if (result.ok) {
                setIntroStory(result.introStory);
                setShowIntro(true);
            }
        } catch (err) {
            console.error('Failed to choose dino:', err);
        }
        setSubmitting(false);
    };

    const handleStartAdventure = () => {
        router.push('/dino-hunt/map');
    };

    const handlePlayAgain = async () => {
        const userId = localStorage.getItem('twimp_user_id')!;
        try {
            await DinoHuntAPI.restart(userId);
            setSession(null);
            setSelectedDino(null);
            setCustomDino('');
            setShowIntro(false);
            setLoading(true);

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const result: any = await DinoHuntAPI.start(
                        userId, pos.coords.latitude, pos.coords.longitude
                    );
                    setSession(result.session || result);
                    setLoading(false);
                },
                () => setLoading(false)
            );
        } catch (err) {
            console.error('Failed to restart:', err);
        }
    };

    if (loading) {
        return (
            <Box className={`${styles.page} ${styles.loadingContainer}`}>
                <CircularProgress sx={{ color: 'white' }} />
                <Typography sx={{ color: 'white' }}>Loading Dino Hunt...</Typography>
            </Box>
        );
    }

    // Victory screen
    if (session?.phase === 'victory') {
        return (
            <Box className={`${styles.page} ${styles.victoryContainer}`}>
                <Typography className={styles.victoryTitle}>
                    🎉 VICTORY! 🎉
                </Typography>
                <Typography sx={{ textAlign: 'center', mb: 2, opacity: 0.9 }}>
                    You rescued the baby {session.favoriteDino}!
                </Typography>

                {session.battleStory && (
                    <>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            The Battle
                        </Typography>
                        <Box className={styles.battleStoryBox}>
                            {session.battleStory}
                        </Box>
                    </>
                )}

                <Box sx={{ mt: 2, width: '100%', maxWidth: 500 }}>
                    <DinoArmyRoster
                        dinos={session.collectedDinos || []}
                        totalScore={session.score || 0}
                        compact
                    />
                </Box>

                <Button
                    variant="contained"
                    onClick={handlePlayAgain}
                    sx={{
                        mt: 3, mb: 2,
                        backgroundColor: '#fbbf24 !important',
                        color: '#064e3b',
                        fontWeight: 'bold',
                        borderRadius: '16px',
                        px: 4, py: 1.5,
                        fontSize: '1rem',
                    }}
                >
                    Play Again
                </Button>

                <Button
                    variant="text"
                    onClick={() => router.push('/')}
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                    Back to Home
                </Button>
            </Box>
        );
    }

    // Intro story screen (after choosing dino)
    if (showIntro) {
        return (
            <Box className={`${styles.page} ${styles.setupContainer}`}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, textAlign: 'center' }}>
                    🦖 Your Mission
                </Typography>
                <Box className={styles.storyBox}>
                    {introStory}
                </Box>
                <Button
                    variant="contained"
                    onClick={handleStartAdventure}
                    sx={{
                        mt: 2,
                        backgroundColor: '#fbbf24 !important',
                        color: '#064e3b',
                        fontWeight: 'bold',
                        borderRadius: '16px',
                        px: 4, py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': { backgroundColor: '#f59e0b !important' }
                    }}
                >
                    Start Adventure!
                </Button>
            </Box>
        );
    }

    // Setup screen — pick favorite dinosaur
    return (
        <Box className={`${styles.page} ${styles.setupContainer}`}>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, textAlign: 'center' }}>
                🦖 Dino Egg Hunt
            </Typography>
            <Typography sx={{ opacity: 0.9, mb: 3, textAlign: 'center' }}>
                Choose your favourite dinosaur to rescue!
            </Typography>

            <Box className={styles.dinoPickerGrid}>
                {DINO_OPTIONS.map((dino) => (
                    <Box
                        key={dino.id}
                        className={`${styles.dinoPickerCard} ${selectedDino === dino.id ? styles.dinoPickerCardSelected : ''}`}
                        onClick={() => { setSelectedDino(dino.id); setCustomDino(''); }}
                    >
                        <span className={styles.dinoPickerEmoji}>{dino.emoji}</span>
                        <span className={styles.dinoPickerName}>{dino.name}</span>
                    </Box>
                ))}
            </Box>

            <Typography sx={{ opacity: 0.7, fontSize: '0.85rem', mb: 1 }}>
                Or type your own:
            </Typography>
            <TextField
                value={customDino}
                onChange={(e) => { setCustomDino(e.target.value); setSelectedDino(null); }}
                placeholder="e.g. Diplodocus"
                size="small"
                sx={{
                    maxWidth: 280, width: '100%', mb: 3,
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                    },
                    '& .MuiOutlinedInput-input::placeholder': { color: 'rgba(255,255,255,0.5)' },
                }}
            />

            <Button
                variant="contained"
                onClick={handleChooseDino}
                disabled={submitting || (!selectedDino && !customDino.trim())}
                sx={{
                    backgroundColor: '#fbbf24 !important',
                    color: '#064e3b',
                    fontWeight: 'bold',
                    borderRadius: '16px',
                    px: 4, py: 1.5,
                    fontSize: '1rem',
                    '&:hover': { backgroundColor: '#f59e0b !important' },
                    '&:disabled': { opacity: 0.5 },
                }}
            >
                {submitting ? <CircularProgress size={24} sx={{ color: '#064e3b' }} /> : 'Begin Rescue Mission'}
            </Button>

            <Button
                variant="text"
                onClick={() => router.push('/')}
                sx={{ mt: 2, color: 'rgba(255,255,255,0.6)' }}
            >
                Back to Home
            </Button>
        </Box>
    );
}
