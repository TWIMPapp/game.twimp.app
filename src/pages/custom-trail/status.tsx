import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, CircularProgress, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import Map from '@/components/Map';
import { MapRef } from '@/components/Map';
import { CustomTrailAPI } from '@/services/API/CustomTrailAPI';
import { Marker } from '@/typings/Task';
import { Colour } from '@/typings/Colour.enum';
import { Status } from '@/typings/Status.enum';

interface Player {
    userId: string;
    position: { lat: number; lng: number };
    collectedPins: number[];
    completed: boolean;
    score: number;
    startTime: number;
}

interface TrailPin {
    lat: number;
    lng: number;
    icon: string;
    order: number;
    visible: boolean;
    globallyCollected: boolean;
    collectedBy: string | null;
}

interface CreatorViewData {
    trail: {
        id: string;
        name?: string;
        theme: string;
        startLocation: { lat: number; lng: number };
        pins: TrailPin[];
        mode: string;
        competitive: boolean;
        playCount: number;
        createdAt: number;
        expiresAt: number;
        isActive: boolean;
    };
    players: Player[];
    summary: {
        totalPlayers: number;
        activePlayers: number;
        completedPlayers: number;
        totalPinsCollected: number;
        totalPins: number;
    };
}

const POLL_INTERVAL = 5000;

export default function CreatorStatus() {
    const router = useRouter();
    const { id: trailId } = router.query;

    const [data, setData] = useState<CreatorViewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<MapRef>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const creatorId = typeof window !== 'undefined' ? localStorage.getItem('twimp_user_id') : null;

    const fetchStatus = useCallback(async () => {
        if (!trailId || !creatorId) return;
        try {
            const result: any = await CustomTrailAPI.getCreatorView(trailId as string, creatorId);
            const body = result.body || result;
            if (body.ok) {
                setData(body);
                setError(null);
            } else {
                setError(body.message || 'Failed to load');
            }
        } catch {
            setError('Failed to connect');
        } finally {
            setLoading(false);
        }
    }, [trailId, creatorId]);

    useEffect(() => {
        fetchStatus();
        pollRef.current = setInterval(fetchStatus, POLL_INTERVAL);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchStatus]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#f9fafb' }}>
                <CircularProgress sx={{ color: '#FF2E5B' }} />
                <Typography sx={{ mt: 2, color: '#6b7280' }}>Loading trail status...</Typography>
            </Box>
        );
    }

    if (error || !data) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#f9fafb', px: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444', mb: 2 }}>
                    {error || 'Trail not found'}
                </Typography>
                <Typography sx={{ color: '#6b7280', textAlign: 'center' }}>
                    Make sure you are the creator of this trail.
                </Typography>
            </Box>
        );
    }

    const { trail, players, summary } = data;

    // Pin markers
    const pinMarkers: Marker[] = trail.pins.map((pin, idx) => ({
        lat: pin.lat,
        lng: pin.lng,
        title: `Pin ${idx + 1}`,
        subtitle: pin.globallyCollected ? `Found by ${pin.collectedBy?.slice(0, 8) || 'someone'}` : 'Uncollected',
        colour: pin.globallyCollected ? Colour.Green : Colour.Red,
        status: pin.globallyCollected ? Status.Visited : Status.Active
    }));

    // Player markers (blue dots)
    const playerMarkers: Marker[] = players
        .filter(p => p.position && !p.completed)
        .map((p, idx) => ({
            lat: p.position.lat,
            lng: p.position.lng,
            title: `Player ${idx + 1}`,
            subtitle: `${p.collectedPins.length}/${trail.pins.length} found`,
            colour: Colour.Blue,
            status: Status.Active
        }));

    const allMarkers = [...pinMarkers, ...playerMarkers];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f9fafb' }}>
            {/* Header */}
            <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937' }}>
                    {trail.name || 'Custom Trail'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                        icon={<PeopleIcon />}
                        label={`${summary.totalPlayers} player${summary.totalPlayers !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                    <Chip
                        icon={<DirectionsRunIcon />}
                        label={`${summary.activePlayers} active`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 600 }}
                    />
                    <Chip
                        icon={<CheckCircleIcon />}
                        label={`${summary.completedPlayers} finished`}
                        size="small"
                        color="success"
                        sx={{ fontWeight: 600 }}
                    />
                    <Chip
                        label={`${summary.totalPinsCollected}/${summary.totalPins} pins found`}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                </Box>
            </Box>

            {/* Map */}
            <Box sx={{ flex: 1 }}>
                <Map
                    ref={mapRef}
                    taskMarkers={allMarkers}
                    userLocation={trail.startLocation}
                    zoom={15}
                    onPlayerMove={() => {}}
                />
            </Box>

            {/* Player List */}
            {players.length > 0 && (
                <Box sx={{ maxHeight: '200px', overflow: 'auto', bgcolor: 'white', borderTop: '1px solid #e5e7eb', p: 2 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#6b7280', mb: 1 }}>
                        PLAYERS
                    </Typography>
                    {players.map((player, idx) => (
                        <Box key={player.userId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                Player {idx + 1}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {player.collectedPins.length}/{trail.pins.length} pins
                                </Typography>
                                {player.completed && (
                                    <CheckCircleIcon sx={{ fontSize: 16, color: '#22c55e' }} />
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
