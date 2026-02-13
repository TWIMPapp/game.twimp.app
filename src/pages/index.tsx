import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { BASE_URL } from '@/constants';
import { Game } from '@/types';
import { Box, Card, CardContent, CardMedia, Typography, Container, Grid, Button, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import FeaturedCard from '@/components/FeaturedCard';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import WelcomeModal from '@/components/WelcomeModal';

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
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { data: session, status } = useSession();

    // Welcome modal state
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

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

    // Show welcome modal for new users
    useEffect(() => {
        if (status === 'authenticated' && session?.user && !hasSeenWelcome) {
            const welcomeShown = localStorage.getItem(`welcomed_${session.user.email}`);
            if (!welcomeShown) {
                setShowWelcomeModal(true);
                localStorage.setItem(`welcomed_${session.user.email}`, 'true');
                setHasSeenWelcome(true);
            } else {
                setHasSeenWelcome(true);
            }
        }
    }, [status, session, hasSeenWelcome]);

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

    const handleCreateClick = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        // Go directly to custom trail creation
        router.push('/custom-trail/create');
    };

    const handleWelcomeCreateNow = () => {
        setShowWelcomeModal(false);
        // Go directly to custom trail creation
        router.push('/custom-trail/create');
    };

    const handleWelcomeBackHome = () => {
        setShowWelcomeModal(false);
    };

    if (loading && data.all.length === 0) {
        return (
            <Box className="h-screen flex flex-col items-center justify-center bg-twimp-bg">
                <CircularProgress sx={{ color: '#FF2E5B' }} />
                <Typography className="mt-4 font-medium text-gray-500">Loading Twimp Library...</Typography>
            </Box>
        );
    }

    if (error && data.all.length === 0) {
        return (
            <Box className="h-screen flex flex-col items-center justify-center bg-twimp-bg px-6">
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
                        borderRadius: '16px',
                        px: 4,
                        py: 1.5,
                        fontWeight: 'bold',
                        backgroundColor: '#FF2E5B !important',
                    }}
                >
                    Try Again
                </Button>
            </Box>
        );
    }

    return (
        <div className="min-h-screen pb-8 bg-twimp-bg">
            <Head>
                <title>Twimp - The World is my Playground</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            <PageHeader showCreate onCreateClick={handleCreateClick} />

            <Container maxWidth="lg" className="px-4 pb-24 pt-4">

                <Box>
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
                </Box>
            </Container>
            <BottomNav onCreateClick={handleCreateClick} />

            {/* Login Required Modal */}
            <LoginRequiredModal
                open={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                action="create"
            />

            {/* Welcome Modal for New Users */}
            <WelcomeModal
                open={showWelcomeModal}
                onCreateNow={handleWelcomeCreateNow}
                onBackHome={handleWelcomeBackHome}
            />
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
