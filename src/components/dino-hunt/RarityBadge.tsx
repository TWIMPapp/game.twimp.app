import { Chip } from '@mui/material';

const RARITY_COLORS: Record<string, { bg: string; text: string }> = {
    epic: { bg: '#9333EA', text: '#FFFFFF' },
    rare: { bg: '#3B82F6', text: '#FFFFFF' },
    common: { bg: '#22C55E', text: '#FFFFFF' },
};

interface RarityBadgeProps {
    rarity: string;
}

export default function RarityBadge({ rarity }: RarityBadgeProps) {
    const colors = RARITY_COLORS[rarity] || RARITY_COLORS.common;
    return (
        <Chip
            label={rarity.toUpperCase()}
            size="small"
            sx={{
                backgroundColor: colors.bg,
                color: colors.text,
                fontWeight: 'bold',
                fontSize: '0.7rem',
                letterSpacing: '0.05em',
                height: 22,
            }}
        />
    );
}
