import { Card, CardMedia, Box } from '@mui/material';
import { Game } from '@/types';
import { CardOverlay } from '@/components/CardOverlay';

interface FeaturedCardProps {
    game: Game;
    onClick: () => void;
}

export default function FeaturedCard({ game, onClick }: FeaturedCardProps) {
    // Same corners as TrailCard: partner top-left, title bottom-left, distance
    // bottom-right (same visibility rule as TrailCard; featured games are never pending).
    const distance = game.distanceInMiles !== null && game.distanceInMiles !== undefined
        ? `${game.distanceInMiles.toFixed(1)} mi`
        : null;
    return (
        <Card
            className="mb-6 rounded-[28px] overflow-hidden shadow-lg border-none cursor-pointer group relative flex flex-col"
            onClick={onClick}
            sx={{ minHeight: '180px' }}
        >
            <Box className="absolute inset-0 z-0">
                <CardMedia
                    component="img"
                    image={game.image_url}
                    alt={game.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <Box
                    className="absolute inset-0"
                    sx={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
                    }}
                />
            </Box>

            <CardOverlay game={game} distance={distance} titleVariant="h5" titleSize="1.5rem" padding={3} />
        </Card>
    );
}
