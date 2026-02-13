import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface ShareLinkDisplayProps {
    trailId: string;
    trailName?: string;
}

export default function ShareLinkDisplay({ trailId, trailName }: ShareLinkDisplayProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://game.twimp.app'}/trail/${trailId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setShowToast(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setShowToast(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: trailName || 'Custom Trail',
                    text: `Join my treasure hunt on Twimp!`,
                    url
                });
            } catch {
                // User cancelled share
            }
        } else {
            handleCopy();
        }
    };

    return (
        <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {trailName ? `${trailName} is live!` : 'Your trail is live!'}
            </Typography>
            <Typography sx={{ color: '#6b7280', mb: 3 }}>
                Share this link with your friends, family, or anyone you want to join the hunt.
            </Typography>

            {/* URL Display */}
            <Box
                sx={{
                    backgroundColor: '#f3f4f6',
                    borderRadius: '16px',
                    p: 2,
                    mb: 3,
                    wordBreak: 'break-all'
                }}
            >
                <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1f2937' }}>
                    {url}
                </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={handleCopy}
                    startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                    sx={{
                        flex: 1,
                        py: 1.5,
                        borderRadius: '16px',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: copied ? '#22c55e' : '#FF2E5B',
                        color: copied ? '#22c55e' : '#FF2E5B'
                    }}
                >
                    {copied ? 'Copied!' : 'Copy Link'}
                </Button>

                <Button
                    variant="contained"
                    onClick={handleShare}
                    startIcon={<ShareIcon />}
                    sx={{
                        flex: 1,
                        py: 1.5,
                        borderRadius: '16px',
                        textTransform: 'none',
                        fontWeight: 700,
                        backgroundColor: '#FF2E5B !important',
                    }}
                >
                    Share
                </Button>
            </Box>

            {/* Watch Players Button */}
            <Button
                variant="text"
                onClick={() => router.push(`/custom-trail/status?id=${trailId}`)}
                startIcon={<VisibilityIcon />}
                sx={{
                    mt: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#6b7280',
                    '&:hover': { color: '#FF2E5B' }
                }}
            >
                Watch Players Live
            </Button>

            <Snackbar
                open={showToast}
                autoHideDuration={2000}
                onClose={() => setShowToast(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ borderRadius: '12px', fontWeight: 600 }}>
                    Link copied to clipboard!
                </Alert>
            </Snackbar>
        </Box>
    );
}
