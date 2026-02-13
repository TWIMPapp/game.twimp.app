import { Box, Typography } from '@mui/material';
import EggIcon from '@mui/icons-material/Egg';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ExploreIcon from '@mui/icons-material/Explore';

interface ThemeSelectorProps {
    onSelect: (theme: 'easter' | 'valentine' | 'general') => void;
}

const themes = [
    {
        id: 'easter' as const,
        label: 'Easter Egg Hunt',
        description: 'Hide eggs for friends and family to find!',
        icon: <EggIcon sx={{ fontSize: 40 }} />,
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    },
    {
        id: 'valentine' as const,
        label: "Valentine's Trail",
        description: 'Create a romantic treasure hunt\nfor your loved one',
        icon: <FavoriteIcon sx={{ fontSize: 40 }} />,
        gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    },
    {
        id: 'general' as const,
        label: 'Treasure Hunt',
        description: 'A custom scavenger hunt for any occasion',
        icon: <ExploreIcon sx={{ fontSize: 40 }} />,
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    }
];

export default function ThemeSelector({ onSelect }: ThemeSelectorProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Choose a Theme
            </Typography>

            {themes.map((theme) => (
                <Box
                    key={theme.id}
                    onClick={() => onSelect(theme.id)}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        py: 3,
                        px: 2,
                        borderRadius: '20px',
                        background: theme.gradient,
                        color: 'white',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s, transform 0.2s',
                        '&:hover': {
                            opacity: 0.9,
                            transform: 'scale(0.99)'
                        },
                        '&:active': {
                            transform: 'scale(0.97)'
                        }
                    }}
                >
                    {theme.icon}
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {theme.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', opacity: 0.9, textAlign: 'center', whiteSpace: 'pre-line' }}>
                        {theme.description}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}
