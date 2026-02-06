import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    Box,
    Typography,
    Button,
    TextField,
    Card,
    CardContent,
    CircularProgress
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { BASE_URL } from '@/constants';

export default function ValentineLanding() {
    const router = useRouter();
    const [senderEmail, setSenderEmail] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const canSubmit = isValidEmail(senderEmail) && isValidEmail(recipientEmail) && message.trim().length > 0 && message.length <= 200;

    const handleSendValentine = async () => {
        if (!canSubmit) return;

        setSending(true);
        setError(null);

        try {
            const res = await fetch(`${BASE_URL}/valentine/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderEmail,
                    recipientEmail,
                    message: message.trim()
                })
            });

            const data = await res.json();

            if (data.success) {
                setSent(true);
            } else {
                setError(data.message || 'Failed to send. Please try again.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleCreateTrail = () => {
        let userId = localStorage.getItem('twimp_user_id');
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem('twimp_user_id', userId);
        }
        router.push(`/custom-trail/create?user_id=${userId}&theme=valentine&mode=custom`);
    };

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FDF2F8 0%, #FFFFFF 50%, #FDF2F8 100%)' }}>
            <Head>
                <title>Valentine&apos;s Day | Twimp</title>
                <meta name="description" content="Surprise someone special this Valentine's Day with a secret valentine or romantic trail" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            {/* Hero Section */}
            <Box sx={{ textAlign: 'center', pt: 6, pb: 4, px: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <FavoriteIcon sx={{ fontSize: 48, color: '#EC4899' }} />
                </Box>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 800,
                        color: '#831843',
                        mb: 1.5,
                        lineHeight: 1.2
                    }}
                >
                    Surprise someone special this Valentine&apos;s Day
                </Typography>
                <Typography
                    sx={{
                        color: '#9D174D',
                        fontSize: '1.1rem',
                        maxWidth: 320,
                        mx: 'auto'
                    }}
                >
                    Two ways to share a little love — no chocolates required
                </Typography>
            </Box>

            <Box sx={{
                px: 3,
                pb: 4,
                maxWidth: 900,
                mx: 'auto',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
                alignItems: 'flex-start'
            }}>
                {/* Option 1: Secret Valentine */}
                <Card
                    sx={{
                        borderRadius: '24px',
                        border: '2px solid #FBCFE8',
                        boxShadow: '0 4px 20px rgba(236, 72, 153, 0.15)',
                        flex: { md: 1 },
                        width: { xs: '100%', md: 'auto' }
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <MailOutlineIcon sx={{ color: 'white', fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#831843' }}>
                                    Secret Valentine
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9D174D' }}>
                                    Quick & easy
                                </Typography>
                            </Box>
                        </Box>

                        <Typography sx={{ color: '#6B7280', mb: 3, fontSize: '0.95rem' }}>
                            Send an anonymous valentine that magically appears near them.
                        </Typography>

                        {sent ? (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <Typography sx={{ fontSize: '3rem', mb: 2 }}>💌</Typography>
                                <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '1.1rem', mb: 1 }}>
                                    Sent!
                                </Typography>
                                <Typography sx={{ color: '#6B7280' }}>
                                    They&apos;ll receive their invitation shortly.
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                                    <TextField
                                        fullWidth
                                        label="Your email"
                                        type="email"
                                        value={senderEmail}
                                        onChange={(e) => setSenderEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px'
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Their email"
                                        type="email"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        placeholder="someone@example.com"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px'
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Your message"
                                        multiline
                                        rows={3}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                                        placeholder="Write something sweet..."
                                        helperText={`${message.length}/200`}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px'
                                            }
                                        }}
                                    />
                                </Box>

                                {error && (
                                    <Typography sx={{ color: '#DC2626', mb: 2, fontSize: '0.875rem', textAlign: 'center' }}>
                                        {error}
                                    </Typography>
                                )}

                                <Button
                                    fullWidth
                                    variant="contained"
                                    disabled={!canSubmit || sending}
                                    onClick={handleSendValentine}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: '16px',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #DB2777 0%, #BE185D 100%)'
                                        },
                                        '&.Mui-disabled': {
                                            background: '#E5E7EB',
                                            color: '#9CA3AF'
                                        }
                                    }}
                                >
                                    {sending ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send Secret Valentine'}
                                </Button>

                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        textAlign: 'center',
                                        mt: 2,
                                        color: '#9CA3AF',
                                        lineHeight: 1.4
                                    }}
                                >
                                    They&apos;ll receive an email inviting them to collect a mystery valentine near their location. Your identity stays secret unless you sign your message!
                                </Typography>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Option 2: Romantic Trail */}
                <Card
                    sx={{
                        borderRadius: '24px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                        flex: { md: 1 },
                        width: { xs: '100%', md: 'auto' }
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Box
                                    component="img"
                                    src="/icons/heart-pin-outline.svg"
                                    alt="Romantic Trail"
                                    sx={{ width: 24, height: 24, objectFit: 'contain' }}
                                />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#831843' }}>
                                Romantic Trail
                            </Typography>
                        </Box>

                        <Typography sx={{ color: '#6B7280', mb: 2, fontSize: '0.95rem' }}>
                            Create a walk with love notes leading to a surprise.
                        </Typography>

                        <Typography sx={{ fontWeight: 600, color: '#374151', mb: 1, fontSize: '0.9rem' }}>
                            Perfect for:
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 3, color: '#6B7280', fontSize: '0.9rem' }}>
                            <li>A surprise lunch date</li>
                            <li>Revisiting meaningful places</li>
                            <li>A proposal route 💍</li>
                            <li>&quot;Our story&quot; memory lane</li>
                        </Box>

                        <Typography sx={{ color: '#6B7280', mb: 3, fontSize: '0.9rem' }}>
                            Create waypoints with personal messages at each stop, then share the unique link with your valentine.
                        </Typography>

                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleCreateTrail}
                            sx={{
                                py: 1.5,
                                borderRadius: '16px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                borderColor: '#EC4899',
                                borderWidth: 2,
                                color: '#EC4899',
                                '&:hover': {
                                    borderColor: '#DB2777',
                                    borderWidth: 2,
                                    background: 'rgba(236, 72, 153, 0.05)'
                                }
                            }}
                        >
                            Create Your Trail →
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 1 }}>
                    Made with ❤️ by <span style={{ fontWeight: 600, color: '#EC4899' }}>twimp</span>
                </Typography>
                <Typography sx={{ color: '#D1D5DB', fontSize: '0.75rem' }}>
                    Outdoor adventures that bring stories to life
                </Typography>
            </Box>
        </Box>
    );
}
