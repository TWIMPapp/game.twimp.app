import { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog } from '@mui/material';
import styles from '@/styles/egg-hunt.module.css';

interface LetterRevealProps {
    open: boolean;
    letter: string;
    symbol: string;
    isDuplicate?: boolean;
    onClose: () => void;
}

export default function LetterReveal({ open, letter, symbol, isDuplicate = false, onClose }: LetterRevealProps) {
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        if (open) {
            setRevealed(false);
            let interval: ReturnType<typeof setInterval>;
            const firstFlip = setTimeout(() => {
                setRevealed(true);
                interval = setInterval(() => {
                    setRevealed(prev => !prev);
                }, 2000);
            }, 2000);

            return () => {
                clearTimeout(firstFlip);
                if (interval) clearInterval(interval);
            };
        }
    }, [open]);

    const themeClass = isDuplicate ? styles['theme-orange'] : styles['theme-green'];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '24px', p: 3, textAlign: 'center', overflow: 'hidden' }
            }}
        >
            <Box className={`flex flex-col items-center ${themeClass}`}>
                <Typography variant="h3" sx={{ mb: 2 }}>
                    {isDuplicate ? '😅' : '✨'}
                </Typography>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 800,
                        mb: 1,
                        color: 'var(--egg-text)'
                    }}
                >
                    {isDuplicate ? 'Duplicate!' : 'New Codex Unlocked!'}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: '#6B7280',
                        mb: 4
                    }}
                >
                    {isDuplicate
                        ? `Oh no! We already have ${letter}!`
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
                            transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
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
                                {symbol}
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
                                {letter}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={onClose}
                    className={styles['themed-button']}
                >
                    Continue
                </Button>
            </Box>
        </Dialog>
    );
}
