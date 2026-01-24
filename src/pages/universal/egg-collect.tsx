import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, TextField, CircularProgress, Alert } from '@mui/material';
import { UniversalAPI } from '@/services/API';
import BottomNav from '@/components/BottomNav';

export default function EggCollectView() {
    const [task, setTask] = useState<any>(null);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const userId = localStorage.getItem('twimp_user_id');
        if (!userId) {
            router.push('/login');
            return;
        }

        const fetchStatus = async () => {
            try {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const res: any = await UniversalAPI.awty(userId, pos.coords.latitude, pos.coords.longitude);
                    if (res.arrived && res.task) {
                        setTask(res.task);
                    } else {
                        // If not arrived, go back to map
                        router.push('/universal/egg-hunt');
                    }
                    setLoading(false);
                });
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchStatus();
    }, [router]);

    const handleSubmit = async () => {
        if (!answer.trim()) return;

        setSubmitting(true);
        const userId = localStorage.getItem('twimp_user_id');

        try {
            const res: any = await UniversalAPI.answer(userId!, answer);
            if (res.correct) {
                setFeedback({ type: 'success', message: 'Correct! Egg collected!' });
                setTimeout(() => router.push('/universal/egg-hunt'), 2000);
            } else {
                setFeedback({ type: 'error', message: 'Incorrect answer. Try again or wait for respawn.' });
                setSubmitting(false);
            }
        } catch (err) {
            console.error(err);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box className="h-screen flex items-center justify-center bg-white">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="h-screen flex flex-col bg-white">
            <Box className="flex-1 p-6 flex flex-col items-center justify-center">
                <Typography variant="h3" className="mb-4">🥚</Typography>
                <Typography variant="h4" className="font-extrabold text-center mb-6" sx={{ color: '#FF6A88' }}>
                    Challenge Unlocked!
                </Typography>

                <Box className="w-full bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 mb-8">
                    <Typography className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                        {task?.subject} QUESTION
                    </Typography>
                    <Typography variant="h5" className="font-medium text-gray-800">
                        {task?.content}
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    label="Your Answer"
                    variant="outlined"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={submitting || feedback?.type === 'success'}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                        },
                        mb: 4
                    }}
                />

                {feedback && (
                    <Alert severity={feedback.type} className="w-full mb-6 rounded-2xl">
                        {feedback.message}
                    </Alert>
                )}

                <Button
                    variant="contained"
                    fullWidth
                    disabled={submitting || feedback?.type === 'success'}
                    onClick={handleSubmit}
                    sx={{
                        borderRadius: '20px',
                        height: '64px',
                        background: 'linear-gradient(45deg, #FF6A88 0%, #FF9A8B 100%)',
                        boxShadow: '0 8px 20px rgba(255, 106, 136, 0.4)',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                    }}
                >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : 'Collect Egg!'}
                </Button>

                <Button
                    variant="text"
                    className="mt-4"
                    onClick={() => router.push('/universal/egg-hunt')}
                >
                    Back to Map
                </Button>
            </Box>
            <BottomNav />
        </Box>
    );
}
