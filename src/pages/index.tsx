import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BASE_URL } from '@/constants';
import { Game } from '@/types';
import { Box, Card, CardContent, CardMedia, Typography, Container, Grid, Button, ToggleButton, ToggleButtonGroup, CircularProgress } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';
import TrailsMapView from '@/components/TrailsMapView';
import BottomNav from '@/components/BottomNav';
import FeaturedCard from '@/components/FeaturedCard';

interface CategorizedGames {
    featured: Game[];
    playAgain: Game[];
    nearYou: Game[];
    all: Game[];
}

export default function Home() {
    const [data, setData] = useState<CategorizedGames>({ featured: [], playAgain: [], nearYou: [], all: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'map'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        let userId = localStorage.getItem('twimp_user_id');

        // Auto-generate anonymous user ID if none exists
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem('twimp_user_id', userId);
        }

        const fetchTrails = (lat?: number, lng?: number) => {
            const params = new URLSearchParams();
            if (lat) params.append('lat', lat.toString());
            if (lng) params.append('lng', lng.toString());
            if (userId) params.append('user_id', userId);

            fetch(`${BASE_URL}/list?${params.toString()}`)
                .then(res => {
                    if (!res.ok) throw new Error('API unavailable');
                    return res.json();
                })
                .then(resData => {
                    setData(resData);
                    setError(null);
                })
                .catch(() => {
                    setError('Unable to load games. Please check back soon!');
                })
                .finally(() => setLoading(false));
        };

        // Try to get location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchTrails(pos.coords.latitude, pos.coords.longitude),
                () => fetchTrails() // Fallback if denied
            );
        } else {
            fetchTrails();
        }

    }, [router]);

    // Featured games come directly from backend
    const featuredGames = data.featured;
    const featuredRefs = new Set(featuredGames.map(g => g.ref));

    // Pending = status 'pending' in any list
    const isPending = (ref: string) => {
        const game = [...data.all, ...data.playAgain].find(g => g.ref === ref);
        return game?.status === 'pending';
    };

    // Non-featured games for regular display
    const nonFeaturedGames = data.all.filter(g => !featuredRefs.has(g.ref));
    const nonFeaturedNearYou = data.nearYou.filter(g => !featuredRefs.has(g.ref));
    const nonFeaturedPlayAgain = data.playAgain.filter(g => !featuredRefs.has(g.ref));

    const handlePlay = (game: Game) => {
        // EVENT games use flat paths (e.g., /egg-hunt)
        if (game.type === 'EVENT') {
            router.push(`/${game.ref}`);
            return;
        }

        // WALK games use the play API
        const userId = localStorage.getItem('twimp_user_id');
        setLoading(true);

        fetch(`${BASE_URL}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game_ref: game.ref,
                user_id: userId
            })
        })
            .then(res => res.json())
            .then(resData => {
                const result = resData.body || resData;
                if (result.ok && result.task) {
                    sessionStorage.setItem('task', JSON.stringify(result.task));
                    router.push(`/task/map?trail_ref=${game.ref}&user_id=${userId}`);
                } else {
                    console.error("Failed to start game", result);
                    setLoading(false);
                }
            })
            .catch(() => setLoading(false));
    };

    const filteredGames = searchQuery.length > 0
        ? nonFeaturedGames.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : nonFeaturedGames;

    if (loading && data.all.length === 0) {
        return (
            <Box className="h-screen flex flex-col items-center justify-center bg-gray-50">
                <CircularProgress sx={{ color: '#FF2E5B' }} />
                <Typography className="mt-4 font-medium text-gray-500">Loading Twimp Library...</Typography>
            </Box>
        );
    }

    if (error && data.all.length === 0) {
        return (
            <Box className="h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
                <Typography variant="h5" className="font-extrabold text-[#FF2E5B] mb-4">twimp</Typography>
                <Typography variant="h6" className="font-bold text-gray-700 mb-2 text-center">
                    We&apos;re setting things up!
                </Typography>
                <Typography className="text-gray-500 text-center mb-6">
                    {error}
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => window.location.reload()}
                    sx={{
                        backgroundColor: '#FF2E5B',
                        borderRadius: '16px',
                        px: 4,
                        py: 1.5,
                        fontWeight: 'bold',
                        '&:hover': { backgroundColor: '#e6284f' }
                    }}
                >
                    Try Again
                </Button>
            </Box>
        );
    }

    return (
        <div className="min-h-screen pb-8 bg-gray-50">
            <Head>
                <title>Twimp - The World is my Playground</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            {/* Consistent Container for both views */}
            <Container maxWidth="lg" className="pt-6 px-4 pb-24">
                {/* Header & Search */}
                <Box className="flex flex-col gap-4 mb-8">
                    <Box className="flex justify-between items-center">
                        <Typography variant="h5" className="font-extrabold text-[#FF2E5B] tracking-tight" sx={{ fontFamily: "'Noto Sans', sans-serif" }}>
                            twimp
                        </Typography>
                        <ToggleButtonGroup
                            value={view}
                            exclusive
                            onChange={(_, newView) => newView && setView(newView)}
                            size="small"
                            sx={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                '& .MuiToggleButton-root': { border: 'none', px: 2 }
                            }}
                        >
                            <ToggleButton value="list">
                                <ViewListIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="map">
                                <MapIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {view === 'list' && (
                        <Box className="relative">
                            <input
                                type="text"
                                placeholder="Search trails..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-14 pl-5 pr-14 rounded-2xl bg-white shadow-sm border-none focus:ring-2 focus:ring-pink-500 text-lg transition-all"
                                style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                            />
                            <Button
                                className="absolute right-1.5 top-1.5 w-11 h-11 min-w-0 rounded-xl bg-[#FF2E5B] text-white shadow-md p-0"
                                sx={{ backgroundColor: '#FF2E5B !important', minWidth: '44px !important' }}
                            >
                                <SearchIcon />
                            </Button>
                        </Box>
                    )}
                </Box>

                {view === 'list' ? (
                    <Box>
                        {searchQuery.length > 0 ? (
                            <Box>
                                <Typography variant="h6" className="font-bold text-gray-800 mb-4 px-1">Results</Typography>
                                <Grid container spacing={2}>
                                    {filteredGames.map(game => (
                                        <Grid item key={game.ref} xs={12} sm={6}>
                                            <TrailCard game={game} onPlay={handlePlay} fullWidth isPending={isPending(game.ref)} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ) : (
                            <>
                                {featuredGames.length > 0 && (
                                    <>
                                        <Typography variant="h6" className="font-bold text-gray-800 mb-4 px-1">Featured</Typography>
                                        {featuredGames.map(game => (
                                            <FeaturedCard
                                                key={game.ref}
                                                game={game}
                                                onClick={() => handlePlay(game)}
                                            />
                                        ))}
                                    </>
                                )}

                                {nonFeaturedPlayAgain.length > 0 && (
                                    <>
                                        <Typography variant="h6" className="font-bold text-gray-800 mb-4 px-1">Play again</Typography>
                                        <Grid container spacing={2} className="mb-8">
                                            {nonFeaturedPlayAgain.map((game) => (
                                                <Grid item key={game.ref} xs={6}>
                                                    <TrailCard game={game} onPlay={handlePlay} isPending={isPending(game.ref)} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </>
                                )}

                                {(nonFeaturedNearYou.length > 0 || nonFeaturedGames.length > 0) && (
                                    <>
                                        <Typography variant="h6" className="font-bold text-gray-800 mb-4 px-1">
                                            {nonFeaturedNearYou.length > 0 ? 'Not far from you' : 'Exploration'}
                                        </Typography>
                                        <Grid container spacing={3}>
                                            {(nonFeaturedNearYou.length > 0 ? nonFeaturedNearYou : nonFeaturedGames).map((game) => (
                                                <Grid item key={game.ref} xs={12} sm={6}>
                                                    <TrailCard game={game} onPlay={handlePlay} fullWidth isPending={isPending(game.ref)} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </>
                                )}
                            </>
                        )}
                    </Box>
                ) : (
                    <TrailsMapView games={nonFeaturedGames} onPlayGame={handlePlay} />
                )}
            </Container>
            <BottomNav />
        </div>
    );
}

function TrailCard({ game, onPlay, fullWidth = false, isPending = false }: { game: Game, onPlay: (g: Game) => void, fullWidth?: boolean, isPending?: boolean }) {
    return (
        <Card
            className={`h-full flex flex-col shadow-sm hover:shadow-xl transition-all duration-500 rounded-[28px] overflow-hidden border-none relative group ${isPending ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={() => !isPending && onPlay(game)}
            sx={{
                aspectRatio: fullWidth ? 'unset' : '1/1',
                minHeight: fullWidth ? '180px' : 'unset',
                backgroundColor: 'white',
                opacity: isPending ? 0.8 : 1
            }}
        >
            <Box className="absolute inset-0 z-0">
                <CardMedia
                    component="img"
                    image={game.image_url}
                    alt={game.name}
                    className={`h-full w-full object-cover transition-transform duration-700 ${isPending ? '' : 'group-hover:scale-110'}`}
                    sx={{ filter: isPending ? 'grayscale(30%)' : 'none' }}
                />
                <Box
                    className="absolute inset-0"
                    sx={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
                    }}
                />
            </Box>

            <CardContent className="relative z-10 mt-auto p-5 flex flex-col justify-end h-full text-white">
                <Typography
                    variant="h6"
                    className="font-bold leading-tight mb-1"
                    sx={{ fontFamily: "'Noto Sans', sans-serif", fontSize: fullWidth ? '1.3rem' : '1.1rem' }}
                >
                    {game.name}
                </Typography>
                <Box className="flex items-center justify-between mt-1">
                    <Typography variant="caption" className="opacity-90 font-semibold tracking-wide uppercase text-[10px]">
                        {isPending ? 'COMING SOON' : (game.isFree ? 'Free Adventure' : 'Premium Experience')}
                    </Typography>
                    {!isPending && game.distanceInMiles !== null && game.distanceInMiles !== undefined && (
                        <Typography variant="caption" className="opacity-90 font-medium bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {game.distanceInMiles.toFixed(1)} mi
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
