import { Box, Typography, Grid } from '@mui/material';
import DinoCard from './DinoCard';

interface CollectedDino {
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
}

interface DinoArmyRosterProps {
    dinos: CollectedDino[];
    totalScore: number;
    compact?: boolean;
}

export default function DinoArmyRoster({ dinos, totalScore, compact = false }: DinoArmyRosterProps) {
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Your Army ({dinos.length}/10)
                </Typography>
                <Typography sx={{ fontWeight: 'bold', color: '#9333EA' }}>
                    Total: {totalScore}
                </Typography>
            </Box>

            <Grid container spacing={compact ? 1 : 2}>
                {dinos.map((dino, i) => (
                    <Grid item xs={compact ? 6 : 12} key={i}>
                        <DinoCard
                            name={dino.name}
                            nickname={dino.nickname}
                            rarity={dino.rarity}
                            stats={dino.stats}
                            total={dino.total}
                            categoryName={dino.categoryName}
                            compact={compact}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
