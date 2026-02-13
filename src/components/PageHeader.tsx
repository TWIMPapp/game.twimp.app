import { Box, Typography, Button } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import logoImg from '@/assets/images/logo.png';
import { useRouter } from 'next/router';

const FONT = "'Poppins', sans-serif";

const colors = {
    text: '#1A1A2E',
    green: '#2DB87A',
};

interface PageHeaderProps {
    compact?: boolean;
    showCreate?: boolean;
    onCreateClick?: () => void;
}

export default function PageHeader({ compact = false, showCreate = false, onCreateClick }: PageHeaderProps) {
    const router = useRouter();

    const handleLogoClick = () => {
        if (router.pathname !== '/') {
            router.push('/');
        }
    };

    return (
        <Box sx={{
            px: 2, pt: compact ? 1.5 : 2, pb: compact ? 1 : 1.5,
            bgcolor: 'white', mx: 2, mt: compact ? 1.5 : 2, borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            cursor: router.pathname !== '/' ? 'pointer' : 'default',
        }}
            onClick={handleLogoClick}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <img
                    src={logoImg.src}
                    alt="Twimp"
                    style={{ height: compact ? 30 : 38 }}
                />
                <Typography sx={{
                    fontFamily: FONT, fontWeight: 900,
                    fontSize: compact ? '1.1rem' : '1.3rem',
                    color: colors.text, lineHeight: 1.2,
                    flex: 1,
                }}>
                    twimp
                </Typography>
                {showCreate && (
                    <Button
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onCreateClick?.();
                        }}
                        sx={{
                            fontFamily: FONT,
                            borderRadius: '14px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            px: 2,
                            py: 1,
                            backgroundColor: `${colors.green} !important`,
                            boxShadow: '0 4px 12px rgba(45, 184, 122, 0.3)',
                        }}
                    >
                        Create
                    </Button>
                )}
            </Box>
        </Box>
    );
}
