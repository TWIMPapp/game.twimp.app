import { Box, Typography } from '@mui/material';

interface DinoStatsChartProps {
    stats: {
        speed: number;
        size: number;
        strength: number;
        intelligence: number;
        defence: number;
        aggression: number;
    };
    rarity: string;
}

const STAT_LABELS = [
    { key: 'speed', label: 'Speed', emoji: '💨' },
    { key: 'size', label: 'Size', emoji: '📏' },
    { key: 'strength', label: 'Strength', emoji: '💪' },
    { key: 'intelligence', label: 'Intelligence', emoji: '🧠' },
    { key: 'defence', label: 'Defence', emoji: '🛡️' },
    { key: 'aggression', label: 'Aggression', emoji: '🔥' },
];

const RARITY_BAR_COLOR: Record<string, string> = {
    epic: '#9333EA',
    rare: '#3B82F6',
    common: '#22C55E',
};

export default function DinoStatsChart({ stats, rarity }: DinoStatsChartProps) {
    const barColor = RARITY_BAR_COLOR[rarity] || '#22C55E';

    return (
        <Box sx={{ width: '100%' }}>
            {STAT_LABELS.map(({ key, label, emoji }) => {
                const value = (stats as any)[key] as number;
                return (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', width: 90, color: '#555', flexShrink: 0 }}>
                            {emoji} {label}
                        </Typography>
                        <Box sx={{ flex: 1, height: 12, bgcolor: '#e5e7eb', borderRadius: 6, overflow: 'hidden', mr: 1 }}>
                            <Box sx={{
                                width: `${value * 10}%`,
                                height: '100%',
                                bgcolor: barColor,
                                borderRadius: 6,
                                transition: 'width 0.5s ease',
                            }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#333', width: 20, textAlign: 'right' }}>
                            {value}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}
