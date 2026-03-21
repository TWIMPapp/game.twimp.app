import { useState } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import easterBunnyImg from '@/assets/images/easterbunny.png';
import { EasterEventAPI } from '@/services/API';

const FONT = "'Poppins', sans-serif";

const FEATURES = [
    { emoji: '👨‍👩‍👧‍👦', label: 'Community effort' },
    { emoji: '📍', label: 'Play anywhere' },
    { emoji: '📚', label: 'Educational' },
    { emoji: '📅', label: '10 days of fun' },
    { emoji: '🆓', label: 'Completely free' },
];

const SHARE_URL = 'https://game.twimp.app/easter-event';
const SHARE_TEXT = 'The Eggstraordinary Case of the Missing Eggs — a free 10-day Easter mystery adventure for families. Starts March 27th!';

export default function EasterEventComingSoon() {
    const [town, setTown] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSubmitTown = async () => {
        if (!town.trim() || submitting) return;
        setSubmitting(true);
        try {
            await EasterEventAPI.registerInterest(town.trim());
        } catch {
            // Still show success — we don't want to block the UX
        }
        setSubmitting(false);
        setSubmitted(true);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Easter Egg Hunt', text: SHARE_TEXT, url: SHARE_URL });
            } catch {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(SHARE_URL);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Box className="min-h-screen bg-gradient-to-b from-green-50 to-yellow-50 pb-12">
            {/* Poster hero */}
            <Box
                sx={{
                    position: 'relative',
                    height: { xs: '70vh', md: '85vh' },
                    minHeight: { xs: 420, md: 520 },
                    maxHeight: { xs: 560, md: 800 },
                    overflow: 'hidden',
                    borderRadius: '0 0 24px 24px'
                }}
            >
                {/* Full background image */}
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
                        objectPosition: 'center 20%',
                        pointerEvents: 'none'
                    }}
                />
                {/* Bottom gradient for text readability */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: { xs: '55%', md: '50%' },
                        background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)',
                        pointerEvents: 'none'
                    }}
                />
                {/* Content anchored to bottom */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1,
                        px: { xs: 3, md: 6 },
                        pb: { xs: 3, md: 4 },
                        textAlign: 'center',
                        color: 'white',
                        maxWidth: 720,
                        mx: 'auto'
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: FONT,
                            fontWeight: 900,
                            fontSize: { xs: '1.6rem', md: '2.4rem' },
                            lineHeight: 1.15,
                            textShadow: '2px 3px 6px rgba(0,0,0,0.6)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            mb: 1.5
                        }}
                    >
                        The Eggstraordinary<br />
                        Case of the<br />
                        Missing Eggs
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mb: 1.5 }}>
                        {['/icons/egg-gold.svg', '/icons/egg-blue.svg', '/icons/egg-red.svg', '/icons/egg-green.svg', '/icons/egg-orange.svg'].map((src, i) => (
                            <Box
                                key={i}
                                component="img"
                                src={src}
                                alt=""
                                sx={{
                                    width: { xs: 24, md: 30 },
                                    height: { xs: 24, md: 30 },
                                    animation: `heroEggBounce 1.5s ease-in-out ${i * 0.15}s infinite`,
                                    '@keyframes heroEggBounce': {
                                        '0%, 100%': { transform: 'translateY(0)' },
                                        '50%': { transform: 'translateY(-6px)' }
                                    }
                                }}
                            />
                        ))}
                    </Box>
                    <Typography
                        sx={{
                            fontFamily: FONT,
                            fontWeight: 600,
                            fontSize: { xs: '0.95rem', md: '1.15rem' },
                            textShadow: '1px 2px 4px rgba(0,0,0,0.5)',
                            opacity: 0.95
                        }}
                    >
                        A free 10-day Easter mystery adventure
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: FONT,
                            fontWeight: 700,
                            fontSize: { xs: '0.85rem', md: '1rem' },
                            mt: 0.5,
                            textShadow: '1px 2px 4px rgba(0,0,0,0.5)',
                            opacity: 0.8
                        }}
                    >
                        27 March &ndash; 5 April
                    </Typography>

                    {/* Feature pills + share URL — visible on md+ only */}
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 1.5,
                            mt: 3
                        }}
                    >
                        {FEATURES.map((f, i) => (
                            <Box
                                key={i}
                                sx={{
                                    background: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(6px)',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    borderRadius: '20px',
                                    px: 2,
                                    py: 0.75,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75
                                }}
                            >
                                <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{f.emoji}</Typography>
                                <Typography
                                    sx={{
                                        fontFamily: FONT,
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        textShadow: '1px 1px 3px rgba(0,0,0,0.4)'
                                    }}
                                >
                                    {f.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                    <Typography
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            fontFamily: FONT,
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            mt: 2.5,
                            opacity: 0.7,
                            textShadow: '1px 1px 3px rgba(0,0,0,0.4)'
                        }}
                    >
                        Share with your school community &mdash; game.twimp.app/easter-event
                    </Typography>
                </Box>
            </Box>

            <Box
                className="py-4 space-y-4"
                sx={{ px: { xs: 2, md: 4 }, maxWidth: 640, mx: 'auto' }}
            >
                {/* Community card */}
                <Card
                    className="rounded-2xl shadow-md overflow-hidden"
                    sx={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        border: '2px solid #15803d'
                    }}
                >
                    <CardContent sx={{ py: 3 }}>
                        {!submitted ? (
                            <>
                                <Typography
                                    sx={{
                                        fontFamily: FONT,
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                        color: 'white',
                                        textAlign: 'center',
                                        mb: 0.5
                                    }}
                                >
                                    Easter Egg Hunts have been ruined!                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: FONT,
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                        color: 'white',
                                        textAlign: 'center',
                                        mb: 0.5
                                    }}
                                >
                                    This is too big for just one family...                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: FONT,
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                        color: 'rgba(255,255,255,0.85)',
                                        textAlign: 'center',
                                        mb: 2.5
                                    }}
                                >
                                    Tell us where you are and we&apos;ll rally your neighbours.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        placeholder="Enter your town"
                                        value={town}
                                        onChange={(e) => setTown(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSubmitTown();
                                        }}
                                        disabled={submitting}
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                backgroundColor: 'white',
                                                fontFamily: FONT,
                                                '& fieldset': { border: 'none' }
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleSubmitTown}
                                        disabled={!town.trim() || submitting}
                                        sx={{
                                            borderRadius: '12px',
                                            fontFamily: FONT,
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            px: 3,
                                            backgroundColor: '#064e3b !important',
                                            flexShrink: 0,
                                            '&:hover': {
                                                backgroundColor: '#065f46 !important'
                                            },
                                            '&.Mui-disabled': {
                                                backgroundColor: 'rgba(6, 78, 59, 0.5) !important',
                                                color: 'rgba(255,255,255,0.5)'
                                            }
                                        }}
                                    >
                                        {submitting ? '...' : 'Go'}
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography
                                    sx={{
                                        fontFamily: FONT,
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                        color: 'white',
                                        mb: 0.5
                                    }}
                                >
                                    You&apos;re in! Now spread the word
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: FONT,
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                        color: 'rgba(255,255,255,0.85)',
                                        mb: 2.5
                                    }}
                                >
                                    The more families near you that join, the better your chances of cracking the case
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={handleShare}
                                    startIcon={copied ? <CheckIcon /> : (typeof navigator !== 'undefined' && 'share' in navigator) ? <ShareIcon /> : <ContentCopyIcon />}
                                    sx={{
                                        borderRadius: '14px',
                                        fontFamily: FONT,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        px: 4,
                                        py: 1.25,
                                        fontSize: '1rem',
                                        backgroundColor: 'white !important',
                                        color: '#16a34a',
                                        '&:hover': {
                                            backgroundColor: '#f0fdf4 !important'
                                        }
                                    }}
                                >
                                    {copied ? 'Link copied!' : 'Share with friends'}
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Feature cards */}
                <Box className="space-y-3">
                    <FeatureCard
                        emoji="👨‍👩‍👧‍👦"
                        title="It&apos;s a community effort"
                        description="Families from your school all contribute to solving the same mystery together."
                    />
                    <FeatureCard
                        emoji="📍"
                        title="Happens wherever you are"
                        description="No need to travel. Each family explores their own local area."
                    />
                    <FeatureCard
                        emoji="📚"
                        title="It&apos;s educational"
                        description="Children answer curriculum-aligned questions in maths, English, and science as they collect eggs."
                    />
                    <FeatureCard
                        emoji="📅"
                        title="Runs for 10 days"
                        description="New challenges encourage outdoor fun every day, building towards a big reveal on Easter Sunday."
                    />
                    <FeatureCard
                        emoji="🆓"
                        title="Completely free"
                        description="No catches, no in-app purchases. Just good old-fashioned fun."
                    />
                </Box>

                {/* How it works */}
                <Card
                    className="rounded-2xl shadow-md overflow-hidden"
                    sx={{
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        border: '2px solid #4338ca'
                    }}
                >
                    <CardContent sx={{ py: 3 }}>
                        <Typography
                            sx={{
                                fontFamily: FONT,
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                color: '#c7d2fe',
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <span>🔍</span> How it works
                        </Typography>
                        <Box className="space-y-3">
                            <StepItem number={1} text="Come back here on March 27th to start" />
                            <StepItem number={2} text="Head outside and find digital eggs in your local area" />
                            <StepItem number={3} text="Answer questions to reveal clues" />
                            <StepItem number={4} text="Work together to solve riddles" />
                            <StepItem number={5} text="Save Easter!" />
                        </Box>
                    </CardContent>
                </Card>

            </Box>
        </Box>
    );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
    return (
        <Card
            className="rounded-2xl shadow-sm overflow-hidden"
            sx={{
                background: '#ffffff',
                border: '1px solid #e5e7eb'
            }}
        >
            <CardContent sx={{ py: 2, px: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Typography sx={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0, mt: 0.25 }}>
                    {emoji}
                </Typography>
                <Box>
                    <Typography
                        sx={{
                            fontFamily: FONT,
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: '#1f2937',
                            mb: 0.25
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: FONT,
                            fontWeight: 400,
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            lineHeight: 1.4
                        }}
                    >
                        {description}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

function StepItem({ number, text }: { number: number; text: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
                sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.3)',
                    border: '2px solid #6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}
            >
                <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: '0.75rem', color: '#a5b4fc' }}>
                    {number}
                </Typography>
            </Box>
            <Typography
                sx={{
                    fontFamily: FONT,
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    color: '#c7d2fe',
                    lineHeight: 1.3
                }}
            >
                {text}
            </Typography>
        </Box>
    );
}
