import { Box, Typography, Paper } from '@mui/material';
import RarityBadge from './RarityBadge';
import DinoStatsChart from './DinoStatsChart';

interface DinoCardProps {
    name: string;
    nickname: string;
    rarity: string;
    stats: {
        speed: number;
        size: number;
        strength: number;
        intelligence: number;
        defence: number;
        aggression: number;
    };
    total: number;
    categoryName: string;
    compact?: boolean;
}

const RARITY_BORDER: Record<string, string> = {
    epic: '#9333EA',
    rare: '#3B82F6',
    common: '#22C55E',
};

export default function DinoCard({
    name, nickname, rarity, stats, total, categoryName, compact = false
}: DinoCardProps) {
    const borderColor = RARITY_BORDER[rarity] || '#22C55E';

    if (compact) {
        return (
            <Paper elevation={2} sx={{
                p: 1.5, borderRadius: 2, border: `2px solid ${borderColor}`,
                display: 'flex', alignItems: 'center', gap: 1,
            }}>
                <Typography sx={{ fontSize: '1.5rem' }}>🦖</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', lineHeight: 1.2 }} noWrap>
                        {nickname}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#666' }} noWrap>
                        {name}
                    </Typography>
                </Box>
                <RarityBadge rarity={rarity} />
            </Paper>
        );
    }

    return (
        <Paper elevation={3} sx={{
            p: 2, borderRadius: 3, border: `3px solid ${borderColor}`,
            maxWidth: 320, width: '100%',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        &quot;{nickname}&quot;
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                        {name} &bull; {categoryName}
                    </Typography>
                </Box>
                <RarityBadge rarity={rarity} />
            </Box>

            <Box sx={{ textAlign: 'center', my: 1.5 }}>
                <Typography sx={{ fontSize: '3rem' }}>🦖</Typography>
            </Box>

            <DinoStatsChart stats={stats} rarity={rarity} />

            <Box sx={{ textAlign: 'center', mt: 1, pt: 1, borderTop: '1px solid #e5e7eb' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem', color: borderColor }}>
                    Total Score: {total}
                </Typography>
            </Box>
        </Paper>
    );
}
