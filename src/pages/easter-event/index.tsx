import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    IconButton,
    Collapse
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { EasterEventAPI } from '@/services/API';
import easterBunnyImg from '@/assets/images/easterbunny.png';

interface EncodedCharacter {
    char: string;
    symbol: string;
    revealed: boolean;
}

interface EncodedClue {
    text: string;
    encoded: EncodedCharacter[];
    fullyDecoded: boolean;
}

interface Chapter {
    id: number;
    title: string;
    locked: boolean;
    dayOffset: number;
}

interface MissionUpdate {
    id: string;
    type: string;
    title: string;
    message: string;
    iconEmoji: string;
}

interface PuzzleStatus {
    active: boolean;
    puzzle?: {
        id: number;
        title: string;
        image: string;
        hint: string;
    };
    startTime?: number;
    endTime?: number;
    timeRemaining?: number;
    solved?: boolean;
    nextPuzzleIn?: number;
    nextPuzzleAt?: number;
    nextPuzzleTitle?: string;
    message?: string;
}

interface CodexEntry {
    letter: string;
    symbol: string;
    unlocked: boolean;
}

// Codex Grid Component - Mystical dark theme
function CodexGrid({ codex }: { codex: CodexEntry[] }) {
    if (!codex || codex.length === 0) {
        return (
            <Box className="text-center py-4">
                <Typography className="text-indigo-300">Loading codex...</Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={1}>
            {codex.map((entry) => (
                <Grid item xs={2.4} sm={2} key={entry.letter} className="text-center">
                    <Box
                        sx={{
                            p: 1,
                            borderRadius: '12px',
                            border: entry.unlocked ? '2px solid #34d399' : '2px solid #4338ca',
                            background: entry.unlocked
                                ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.3) 100%)'
                                : 'rgba(99, 102, 241, 0.1)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Typography className="text-xl mb-0.5">
                            {entry.symbol}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '9px',
                                fontWeight: 900,
                                color: entry.unlocked ? '#34d399' : '#6366f1'
                            }}
                        >
                            {entry.letter}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );
}

// Clue Display Component
function ClueDisplay({ clue }: { clue: EncodedClue }) {
    return (
        <Box className="flex flex-wrap gap-1 items-center">
            {clue.encoded.map((char, i) => (
                <Box key={i} className={`text-center ${char.char === ' ' ? 'w-3' : ''}`}>
                    {char.char === ' ' ? (
                        <Typography>&nbsp;</Typography>
                    ) : (
                        <Box className={`px-1 py-0.5 rounded ${char.revealed ? 'bg-green-100' : 'bg-purple-100'}`}>
                            <Typography className={`text-sm font-bold ${char.revealed ? 'text-green-700' : 'text-purple-700'}`}>
                                {char.revealed ? char.char : char.symbol}
                            </Typography>
                        </Box>
                    )}
                </Box>
            ))}
            {clue.fullyDecoded && (
                <CheckCircleIcon className="text-green-500 ml-2" fontSize="small" />
            )}
        </Box>
    );
}

export default function EasterEventHub() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [gameData, setGameData] = useState<any>(null);
    const [puzzleDialogOpen, setPuzzleDialogOpen] = useState(false);
    const [puzzleAnswer, setPuzzleAnswer] = useState('');
    const [puzzleSubmitting, setPuzzleSubmitting] = useState(false);
    const [puzzleFeedback, setPuzzleFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<any>(null);
    const [currentScene, setCurrentScene] = useState(0);
    const [missionsExpanded, setMissionsExpanded] = useState(true);
    const [cluesExpanded, setCluesExpanded] = useState(true);
    const [puzzleCountdown, setPuzzleCountdown] = useState<string>('');
    const [dataFetchedAt, setDataFetchedAt] = useState<number>(Date.now());

    // Live countdown timer for puzzles
    // Uses server-provided relative times (timeRemaining, nextPuzzleIn) which respect TEST_DAY_OVERRIDE
    useEffect(() => {
        const updateCountdown = () => {
            const puzzleStatus = gameData?.puzzleStatus;
            if (!puzzleStatus) return;

            // Calculate elapsed time since data was fetched
            const elapsed = Date.now() - dataFetchedAt;

            if (puzzleStatus.active && puzzleStatus.solved && puzzleStatus.nextPuzzleIn) {
                // Countdown to next puzzle after solving current one
                const remaining = puzzleStatus.nextPuzzleIn - elapsed;
                if (remaining > 0) {
                    setPuzzleCountdown(formatTimeRemainingLive(remaining));
                } else {
                    setPuzzleCountdown('Starting soon...');
                    fetchGameData();
                }
            } else if (puzzleStatus.active && !puzzleStatus.solved && puzzleStatus.timeRemaining) {
                // Countdown for current active puzzle
                const remaining = puzzleStatus.timeRemaining - elapsed;
                if (remaining > 0) {
                    setPuzzleCountdown(formatTimeRemainingLive(remaining));
                } else {
                    setPuzzleCountdown('Ending soon...');
                    fetchGameData();
                }
            } else if (!puzzleStatus.active && puzzleStatus.nextPuzzleIn) {
                // Countdown to next puzzle when none is active
                const remaining = puzzleStatus.nextPuzzleIn - elapsed;
                if (remaining > 0) {
                    setPuzzleCountdown(formatTimeRemainingLive(remaining));
                } else {
                    setPuzzleCountdown('Starting soon...');
                    fetchGameData();
                }
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update once per minute
        return () => clearInterval(interval);
    }, [gameData?.puzzleStatus, dataFetchedAt]);

    useEffect(() => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) {
            router.push('/login');
            return;
        }

        fetchGameData();
    }, [router]);

    const fetchGameData = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        try {
            const res: any = await EasterEventAPI.getGameScreen(userId);
            setGameData(res);
            setDataFetchedAt(Date.now()); // Track when data was fetched for countdown calculations
        } catch (err) {
            console.error('Failed to fetch game data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartGame = async () => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) return;

        // Get current location and start the game
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                await EasterEventAPI.start(userId, pos.coords.latitude, pos.coords.longitude);
                router.push('/easter-event/map');
            } catch (err) {
                console.error('Failed to start game:', err);
            }
        });
    };

    const handleChapterClick = async (chapter: Chapter) => {
        if (chapter.locked) return;

        try {
            const res: any = await EasterEventAPI.getChapter(chapter.id);
            if (res && !res.locked) {
                setSelectedChapter(res);
                setCurrentScene(0);
                setChapterDialogOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch chapter:', err);
        }
    };

    const handleNextScene = () => {
        if (selectedChapter && currentScene < selectedChapter.scenes.length - 1) {
            setCurrentScene(prev => prev + 1);
        } else {
            setChapterDialogOpen(false);
            setSelectedChapter(null);
            setCurrentScene(0);
        }
    };

    const handlePuzzleSubmit = async () => {
        if (!puzzleAnswer.trim() || !gameData?.puzzleStatus?.puzzle) return;

        setPuzzleSubmitting(true);
        setPuzzleFeedback(null);
        const userId = localStorage.getItem('twimp_user_id');

        try {
            const res: any = await EasterEventAPI.submitPuzzleAnswer(
                userId!,
                gameData.puzzleStatus.puzzle.id,
                puzzleAnswer
            );

            if (res.correct) {
                setPuzzleFeedback({ type: 'success', message: res.message });
                // Refresh game data to show new letters
                setTimeout(() => {
                    fetchGameData();
                    setPuzzleDialogOpen(false);
                    setPuzzleAnswer('');
                    setPuzzleFeedback(null);
                }, 2000);
            } else {
                setPuzzleFeedback({ type: 'error', message: res.message || 'Incorrect answer. Try again!' });
            }
        } catch (err) {
            console.error('Failed to submit puzzle answer:', err);
            setPuzzleFeedback({ type: 'error', message: 'Error submitting answer.' });
        } finally {
            setPuzzleSubmitting(false);
        }
    };

    const formatTimeRemaining = (ms: number) => {
        if (ms <= 0) return '0 mins';
        const totalMinutes = Math.ceil(ms / (1000 * 60));
        const hours = Math.ceil(ms / (1000 * 60 * 60));

        if (totalMinutes >= 60) {
            return `${hours} Hour${hours !== 1 ? 's' : ''}`;
        } else {
            return `${totalMinutes} min${totalMinutes !== 1 ? 's' : ''}`;
        }
    };

    const formatTimeRemainingLive = (ms: number) => {
        if (ms <= 0) return '0 mins';
        const totalMinutes = Math.ceil(ms / (1000 * 60));
        const hours = Math.ceil(ms / (1000 * 60 * 60));

        if (totalMinutes >= 60) {
            return `${hours} Hour${hours !== 1 ? 's' : ''}`;
        } else {
            return `${totalMinutes} min${totalMinutes !== 1 ? 's' : ''}`;
        }
    };

    if (loading) {
        return (
            <Box className="h-screen flex items-center justify-center bg-green-50">
                <CircularProgress sx={{ color: '#22C55E' }} />
            </Box>
        );
    }

    return (
        <Box className="min-h-screen bg-gradient-to-b from-green-50 to-yellow-50 pb-24">
            {/* Header with Easter Bunny */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #059669 50%, #047857 100%)',
                    minHeight: 220,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    overflow: 'hidden'
                }}
            >
                {/* Easter Bunny image as background */}
                <Box
                    component="img"
                    src={easterBunnyImg.src}
                    alt=""
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 30%',
                        opacity: 0.85,
                        pointerEvents: 'none'
                    }}
                />
                {/* Gradient overlay for text readability */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to right, rgba(5, 150, 105, 0.6) 0%, rgba(5, 150, 105, 0.35) 35%, transparent 55%)',
                        pointerEvents: 'none'
                    }}
                />
                <Box
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        textAlign: 'left',
                        color: 'white',
                        px: 3,
                        pb: 2,
                        pt: 2,
                        maxWidth: '60%'
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 900,
                            fontSize: '1.4rem',
                            lineHeight: 1.1,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                            letterSpacing: '0.5px'
                        }}
                    >EGGSTRAORDINARY<br />
                        CASE<br />
                        OF<br />
                        THE<br />
                        MISSING<br />
                        EGGS
                    </Typography>
                    {gameData?.dailyProgress && (
                        <Box
                            sx={{
                                mt: 1.5,
                                display: 'inline-block',
                                background: 'rgba(255,255,255,0.25)',
                                backdropFilter: 'blur(4px)',
                                px: 2,
                                py: 0.75,
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.3)'
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 700, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                                Today: {gameData.dailyProgress.collected} / {gameData.dailyProgress.max} eggs
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <Box className="px-4 py-4 space-y-4">
                {/* Story Chapters */}
                <Card
                    className="rounded-2xl shadow-md overflow-hidden"
                    sx={{
                        background: '#ffffff',
                        border: '1px solid #e5e7eb'
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" className="font-bold mb-3 flex items-center gap-2 text-gray-800">
                            📖 Story Chapters
                        </Typography>
                        <Box className="space-y-2">
                            {gameData?.chapters?.map((chapter: Chapter) => (
                                <Box
                                    key={chapter.id}
                                    onClick={() => handleChapterClick(chapter)}
                                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${chapter.locked
                                        ? 'bg-gray-50 border-gray-200 opacity-60'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    <Box className="flex items-center gap-3">
                                        {chapter.locked ? (
                                            <LockIcon className="text-gray-400" />
                                        ) : (
                                            <CheckCircleIcon className="text-emerald-500" />
                                        )}
                                        <Box>
                                            <Typography className="font-bold text-gray-800">
                                                Chapter {chapter.id}: {chapter.title}
                                            </Typography>
                                            {chapter.locked && (
                                                <Typography variant="caption" className="text-gray-500">
                                                    Unlocks Day {chapter.dayOffset + 1}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </CardContent>
                </Card>

                {/* Mission Updates - Bulletin board theme */}
                <Card
                    className="rounded-2xl shadow-md overflow-hidden"
                    sx={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '2px solid #fcd34d'
                    }}
                >
                    <CardContent>
                        <Box
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setMissionsExpanded(!missionsExpanded)}
                        >
                            <Typography variant="h6" className="font-bold flex items-center gap-2 text-amber-800">
                                📢 Mission Updates
                            </Typography>
                            <IconButton size="small" sx={{ color: '#92400e' }}>
                                {missionsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={missionsExpanded}>
                            <Box className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                {gameData?.missionUpdates?.slice(0, 5).map((update: MissionUpdate) => (
                                    <Box
                                        key={update.id}
                                        className="p-2 rounded-lg bg-white/70 border border-amber-300"
                                    >
                                        <Box className="flex items-start gap-2">
                                            <Typography className="text-lg">{update.iconEmoji}</Typography>
                                            <Box>
                                                <Typography className="font-bold text-sm text-gray-800">
                                                    {update.title}
                                                </Typography>
                                                <Typography variant="caption" className="text-gray-600">
                                                    {update.message}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Collapse>
                    </CardContent>
                </Card>

                {/* Daily Puzzle - Question mark pattern background */}
                <Card
                    className="rounded-2xl shadow-md overflow-hidden"
                    sx={{
                        background: `
                            linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(124, 58, 237, 0.15) 100%),
                            repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 20px,
                                rgba(147, 51, 234, 0.03) 20px,
                                rgba(147, 51, 234, 0.03) 40px
                            )
                        `,
                        border: '2px solid #c4b5fd',
                        position: 'relative',
                        '&::before': {
                            content: '"? ? ? ? ? ? ? ? ? ?"',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            fontSize: '24px',
                            color: 'rgba(147, 51, 234, 0.08)',
                            fontWeight: 'bold',
                            letterSpacing: '20px',
                            lineHeight: '40px',
                            overflow: 'hidden',
                            pointerEvents: 'none',
                            zIndex: 0
                        }
                    }}
                >
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="h6" className="font-bold mb-3 flex items-center gap-2 text-purple-800">
                            🧩 Daily Puzzle
                        </Typography>
                        {gameData?.puzzleStatus?.active ? (
                            <Box
                                onClick={() => !gameData.puzzleStatus.solved && setPuzzleDialogOpen(true)}
                                className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${gameData.puzzleStatus.solved
                                    ? 'bg-green-50/90 border-green-300'
                                    : 'bg-white/80 border-purple-300 hover:bg-white/90'
                                    }`}
                            >
                                <Typography className="text-3xl mb-2">
                                    {gameData.puzzleStatus.solved ? '✅' : '🔮'}
                                </Typography>
                                <Typography className="font-bold text-gray-800">
                                    {gameData.puzzleStatus.puzzle?.title}
                                </Typography>
                                {gameData.puzzleStatus.solved ? (
                                    <Box>
                                        <Typography variant="caption" className="text-green-600 block">
                                            Solved!
                                        </Typography>
                                        {gameData.puzzleStatus.nextPuzzleAt && (
                                            <Typography variant="caption" className="text-gray-500">
                                                Next puzzle: {gameData.puzzleStatus.nextPuzzleTitle || 'Coming'} in {puzzleCountdown}
                                            </Typography>
                                        )}
                                    </Box>
                                ) : (
                                    <Typography variant="caption" className="text-purple-600">
                                        ⏰ {puzzleCountdown || formatTimeRemaining(gameData.puzzleStatus.timeRemaining || 0)} remaining
                                    </Typography>
                                )}
                            </Box>
                        ) : gameData?.puzzleStatus?.nextPuzzleAt ? (
                            <Box className="p-4 rounded-xl bg-white/80 border-2 border-purple-300 text-center">
                                <Typography className="text-3xl mb-2">⏳</Typography>
                                <Typography className="font-bold text-gray-800">
                                    {gameData.puzzleStatus.nextPuzzleTitle || 'Next Puzzle'}
                                </Typography>
                                <Typography variant="caption" className="text-purple-600">
                                    Starts in {puzzleCountdown}
                                </Typography>
                            </Box>
                        ) : (
                            <Box className="p-4 rounded-xl bg-white/60 border-2 border-gray-300 text-center">
                                <Typography className="text-gray-500">
                                    {gameData?.puzzleStatus?.message || 'No active puzzle'}
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Clues */}
                <Card
                    className="rounded-2xl shadow-md overflow-hidden"
                    sx={{
                        background: '#ffffff',
                        border: '1px solid #e5e7eb'
                    }}
                >
                    <CardContent>
                        <Box
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setCluesExpanded(!cluesExpanded)}
                        >
                            <Typography variant="h6" className="font-bold flex items-center gap-2 text-gray-800">
                                🔍 Clues
                            </Typography>
                            <IconButton size="small" sx={{ color: '#6b7280' }}>
                                {cluesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={cluesExpanded}>
                            <Box className="mt-3 space-y-3">
                                {gameData?.clues?.length > 0 ? (
                                    gameData.clues.map((clue: EncodedClue, i: number) => (
                                        <Box key={i} className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                                            <ClueDisplay clue={clue} />
                                        </Box>
                                    ))
                                ) : (
                                    <Typography className="text-gray-500 text-center py-4">
                                        Start collecting eggs to reveal clues!
                                    </Typography>
                                )}
                            </Box>
                        </Collapse>
                    </CardContent>
                </Card>

                {/* Codex - Mystical scroll theme */}
                <Card
                    className="rounded-2xl shadow-md overflow-hidden"
                    sx={{
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        border: '2px solid #4338ca'
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" className="font-bold mb-3 flex items-center gap-2 text-indigo-200">
                            📜 Your Codex
                        </Typography>
                        <Typography variant="caption" className="text-indigo-300 block mb-3">
                            Collect eggs to unlock symbol meanings ({gameData?.session?.uniqueLettersFound || 0}/26)
                        </Typography>
                        <CodexGrid codex={gameData?.codex || []} />
                    </CardContent>
                </Card>
            </Box>

            {/* Fixed CTA Button */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    background: 'white',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000
                }}
            >
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleStartGame}
                    sx={{
                        borderRadius: '16px',
                        height: '56px',
                        background: 'linear-gradient(45deg, #22C55E 0%, #16A34A 100%)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                        '&:hover': {
                            background: 'linear-gradient(45deg, #16A34A 0%, #15803D 100%)'
                        }
                    }}
                >
                    <Box
                        component="img"
                        src="/eggs/egg-gold.svg"
                        alt=""
                        sx={{ width: 28, height: 28, mr: 1 }}
                    />
                    Find The Eggs
                </Button>
            </Box>

            {/* Puzzle Dialog */}
            <Dialog
                open={puzzleDialogOpen}
                onClose={() => !puzzleSubmitting && setPuzzleDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px' } }}
            >
                <DialogTitle className="text-center bg-purple-500 text-white">
                    <Typography variant="h6" component="p" className="font-bold">
                        🧩 {gameData?.puzzleStatus?.puzzle?.title}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Box className="text-center mb-4">
                        <Box className="bg-gray-100 p-4 rounded-xl mb-4">
                            <Typography variant="body2" className="text-gray-600 italic">
                                💡 Hint: {gameData?.puzzleStatus?.puzzle?.hint}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            label="Your Answer"
                            variant="outlined"
                            value={puzzleAnswer}
                            onChange={(e) => setPuzzleAnswer(e.target.value)}
                            disabled={puzzleSubmitting}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !puzzleSubmitting && puzzleAnswer.trim()) {
                                    handlePuzzleSubmit();
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px'
                                }
                            }}
                        />
                        {puzzleFeedback && (
                            <Box className={`mt-3 p-2 rounded-lg ${puzzleFeedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                <Typography className="font-bold">{puzzleFeedback.message}</Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setPuzzleDialogOpen(false)}
                        disabled={puzzleSubmitting}
                        sx={{ borderRadius: '12px' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handlePuzzleSubmit}
                        disabled={puzzleSubmitting || !puzzleAnswer.trim()}
                        sx={{
                            borderRadius: '12px',
                            background: 'linear-gradient(45deg, #9333EA 0%, #7C3AED 100%)'
                        }}
                    >
                        {puzzleSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Chapter Dialog */}
            <Dialog
                open={chapterDialogOpen}
                onClose={() => setChapterDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px' } }}
            >
                {selectedChapter && selectedChapter.scenes && (
                    <>
                        <DialogTitle className="text-center bg-green-500 text-white">
                            <Typography variant="h6" component="p" className="font-bold">
                                📖 {selectedChapter.title}
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 3 }}>
                            <Box className="text-center">
                                {selectedChapter.scenes[currentScene]?.character !== 'narrator' && (
                                    <Typography className="text-4xl mb-3">
                                        {selectedChapter.scenes[currentScene]?.character === 'easter_bunny' ? '🐰' : '🦊'}
                                    </Typography>
                                )}
                                <Typography className="text-gray-700 whitespace-pre-line">
                                    {selectedChapter.scenes[currentScene]?.narration}
                                </Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
                            <Typography variant="caption" className="text-gray-500">
                                {currentScene + 1} / {selectedChapter.scenes.length}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleNextScene}
                                sx={{
                                    borderRadius: '12px',
                                    background: 'linear-gradient(45deg, #22C55E 0%, #16A34A 100%)'
                                }}
                            >
                                {currentScene < selectedChapter.scenes.length - 1 ? 'Next' : 'Close'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
