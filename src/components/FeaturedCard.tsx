import { Card, CardMedia, CardContent, Box, Typography } from '@mui/material';
import { Game } from '@/types';

interface FeaturedCardProps {
    game: Game;
    onClick: () => void;
}

export default function FeaturedCard({ game, onClick }: FeaturedCardProps) {
    return (
        <Card
            className="mb-6 rounded-[28px] overflow-hidden shadow-lg border-none cursor-pointer group relative"
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

            <CardContent className="relative z-10 mt-auto p-6 flex flex-col justify-end h-full text-white" sx={{ minHeight: '180px' }}>
                <Typography
                    variant="h5"
                    className="font-extrabold mb-1"
                    sx={{ fontFamily: "'Noto Sans', sans-serif" }}
                >
                    {game.name}
                </Typography>
                {game.description && (
                    <Typography variant="body2" className="opacity-90 max-w-[85%]">
                        {game.description}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
