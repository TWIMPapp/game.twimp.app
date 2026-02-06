import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Typography,
    Button,
    TextField,
    Slider,
    Switch,
    FormControlLabel,
    CircularProgress
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import ThemeSelector from '@/components/custom-trail/ThemeSelector';
import EnhancedTrailDesigner from '@/components/custom-trail/EnhancedTrailDesigner';
import ShareLinkDisplay from '@/components/custom-trail/ShareLinkDisplay';
import Map, { MapRef } from '@/components/Map';
import { CustomTrailAPI } from '@/services/API';
import { Colour } from '@/typings/Colour.enum';

type CustomTrailTheme = 'easter' | 'valentine' | 'general';
type Step = 'theme' | 'mode' | 'random_map' | 'designer' | 'name_create' | 'creating' | 'done';
type MapPhase = 'set_start' | 'radius' | 'pins';

const MIN_SPACING_METERS = 50;

// Theme icon sets (mirrors backend themes.ts)
const THEME_ICONS: Record<string, { icons: string[]; defaultIcon: string }> = {
    easter: {
        icons: ['egg', 'medal', 'basket', 'treasure_chest', 'question_mark'],
        defaultIcon: 'egg'
    },
    valentine: {
        icons: ['heart_red', 'heart_pink', 'rose', 'love_letter', 'treasure_chest', 'question_mark'],
        defaultIcon: 'heart_red'
    },
    general: {
        icons: ['pin', 'treasure_chest', 'star', 'question_mark', 'flag', 'gift'],
        defaultIcon: 'pin'
    }
};

// Egg color cycle for preview markers
const EGG_COLOURS = [Colour.Blue, Colour.Orange, Colour.Green, Colour.Red, Colour.Yellow];

// Theme-based gradients for mode cards
const THEME_MODE_GRADIENTS: Record<CustomTrailTheme, { random: string; custom: string }> = {
    easter: {
        random: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
        custom: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)'
    },
    valentine: {
        random: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
        custom: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
    },
    general: {
        random: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
        custom: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    }
};

// Shared button styles
const primaryButton = {
    py: 1.5,
    borderRadius: '16px',
    textTransform: 'none',
    fontWeight: 700,
    background: '#3b82f6 !important',
    color: 'white !important',
    '&:hover': { background: '#2563eb !important' }
};

const secondaryButton = {
    py: 1.5,
    borderRadius: '16px',
    textTransform: 'none',
    fontWeight: 700,
    color: '#6b7280'
};

export default function CreateCustomTrail() {
    const router = useRouter();
    const { user_id, theme: themeParam, mode: modeParam, count: countParam, radius: radiusParam } = router.query;

    const [step, setStep] = useState<Step>('mode');
    const [mapPhase, setMapPhase] = useState<MapPhase>('set_start');
    const [theme, setTheme] = useState<CustomTrailTheme>('general');
    const [mode, setMode] = useState<'random' | 'custom'>('random');
    const [name, setName] = useState('');
    const [startLocation, setStartLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [randomCount, setRandomCount] = useState(5);
    const [spawnRadius, setSpawnRadius] = useState(500);
    const [competitive, setCompetitive] = useState(false);
    const [customPins, setCustomPins] = useState<any[] | null>(null);
    const [createdTrailId, setCreatedTrailId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

    const mapRef = useRef<MapRef>(null);

    // Use localStorage ID so it matches the status page's lookup
    const creatorId = (() => {
        if (user_id) return user_id as string;
        if (typeof window === 'undefined') return '';
        let id = localStorage.getItem('twimp_user_id');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('twimp_user_id', id);
        }
        return id;
    })();
    const maxPinsForRadius = Math.max(3, Math.floor(spawnRadius / 25));

    // Generate preview pin positions using golden angle for even distribution, then shuffle
    // so adding more pins doesn't imply they spread further out
    const previewPins = useMemo(() => {
        if (!startLocation) return [];
        const positions: { lat: number; lng: number }[] = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i * 137.508) * (Math.PI / 180);
            const r = spawnRadius * Math.sqrt((i + 1) / 21);
            const lat = startLocation.lat + (r * Math.cos(angle)) / 111320;
            const lng = startLocation.lng + (r * Math.sin(angle)) / (111320 * Math.cos(startLocation.lat * Math.PI / 180));
            positions.push({ lat, lng });
        }
        // Fisher-Yates shuffle
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        return positions;
    }, [startLocation, spawnRadius]);

    // Whether random config is fully pre-determined via query params
    const presetCount = countParam ? parseInt(countParam as string) : null;
    const presetRadius = radiusParam ? parseInt(radiusParam as string) : null;
    const isFullyPreset = presetCount !== null && presetRadius !== null
        && presetCount >= 1 && presetCount <= 20
        && presetRadius >= 100 && presetRadius <= 500;

    // Handle query params - skip screens when pre-configured
    useEffect(() => {
        const validTheme = themeParam && ['easter', 'valentine', 'general'].includes(themeParam as string);
        const validMode = modeParam && ['random', 'custom'].includes(modeParam as string);

        if (validTheme) setTheme(themeParam as CustomTrailTheme);
        if (validMode) setMode(modeParam as 'random' | 'custom');
        if (presetCount && presetCount >= 1 && presetCount <= 20) setRandomCount(presetCount);
        if (presetRadius && presetRadius >= 100 && presetRadius <= 500) setSpawnRadius(presetRadius);

        // Determine starting step (default is 'mode')
        if (validTheme && validMode) {
            // Both pre-set: skip straight to map/designer
            if (modeParam === 'random') {
                setMapPhase('set_start');
                setStep('random_map');
            } else {
                setStep('designer');
            }
        } else if (validMode) {
            // Mode pre-set: skip mode, start at theme
            setStep('theme');
        } else if (validTheme) {
            // Theme pre-set: start at mode (cards will use themed colors)
            setStep('mode');
        }
    }, [themeParam, modeParam, countParam, radiusParam]);

    // Request geolocation on mount
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setMapCenter({ lat: 51.5074, lng: -0.1278 })
        );
    }, []);

    // Re-center map when radius changes
    useEffect(() => {
        if (startLocation && mapRef.current) {
            mapRef.current.panTo(startLocation);
        }
    }, [spawnRadius, startLocation]);

    const handleModeSelect = (m: 'random' | 'custom') => {
        setMode(m);
        // If theme already set via query param, skip theme selection
        if (themeParam && ['easter', 'valentine', 'general'].includes(themeParam as string)) {
            if (m === 'random') {
                setMapPhase('set_start');
                setStep('random_map');
            } else {
                setStep('designer');
            }
        } else {
            setStep('theme');
        }
    };

    const handleThemeSelect = (t: CustomTrailTheme) => {
        setTheme(t);
        if (mode === 'random') {
            setMapPhase('set_start');
            setStep('random_map');
        } else {
            setStep('designer');
        }
    };

    const handleStartLocationSet = (lat: number, lng: number) => {
        setStartLocation({ lat, lng });
        if (isFullyPreset) {
            // All config pre-determined, skip straight to name/create
            setStep('name_create');
        } else {
            setMapPhase('radius');
        }
    };

    const handleCreate = async () => {
        if (!startLocation) return;
        setStep('creating');
        setError(null);

        try {
            const params: any = {
                creator_id: creatorId,
                theme,
                name: name.trim() || undefined,
                start_location: startLocation,
                competitive
            };

            if (mode === 'random') {
                params.mode = 'random';
                params.count = randomCount;
                params.spawn_radius = spawnRadius;
            } else {
                params.mode = 'custom';
                params.pins = customPins;
            }

            const result: any = await CustomTrailAPI.create(params);

            if (result.ok && result.trail) {
                setCreatedTrailId(result.trail.id);
                setStep('done');
            } else {
                setError(result.message || 'Failed to create trail');
                setStep('name_create');
            }
        } catch (e: any) {
            setError(e.message || 'Network error');
            setStep('name_create');
        }
    };

    const handleDesignerComplete = (pins: any[]) => {
        setCustomPins(pins);
        setStep('name_create');
    };

    const handleBack = () => {
        switch (step) {
            case 'theme': setStep('mode'); break;
            case 'random_map':
                if (mapPhase === 'pins') { setMapPhase('radius'); }
                else if (mapPhase === 'radius') { setMapPhase('set_start'); setStartLocation(null); }
                else { setStep('theme'); }
                break;
            case 'designer': setStep('theme'); break;
            case 'name_create':
                if (mode === 'random') {
                    setMapPhase(isFullyPreset ? 'set_start' : 'pins');
                    setStartLocation(isFullyPreset ? null : startLocation);
                    setStep('random_map');
                } else { setStep('designer'); }
                break;
            default: break;
        }
    };

    // Build map markers for random_map step (start + preview pins in pins phase)
    const randomMapMarkers = useMemo(() => {
        if (!startLocation) return [];
        const markers = [{
            lat: startLocation.lat,
            lng: startLocation.lng,
            title: 'Start',
            subtitle: 'Starting point',
            colour: Colour.Red
        }];
        if (mapPhase === 'pins') {
            previewPins.slice(0, randomCount).forEach((pos, i) => {
                markers.push({
                    lat: pos.lat,
                    lng: pos.lng,
                    title: theme === 'easter' ? `Egg ${i + 1}` : `Pin ${i + 1}`,
                    subtitle: 'Preview',
                    colour: theme === 'easter' ? EGG_COLOURS[i % EGG_COLOURS.length] : Colour.Blue
                });
            });
        }
        return markers;
    }, [startLocation, mapPhase, previewPins, randomCount, theme]);

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>

            {/* Step: Theme */}
            {step === 'theme' && (
                <ThemeSelector onSelect={handleThemeSelect} />
            )}

            {/* Step: Mode */}
            {step === 'mode' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', color: '#ec4899' }}>
                        Let&apos;s make a new game!
                    </Typography>
                    <Typography sx={{ textAlign: 'center', color: '#6b7280', mb: 1 }}>
                        How do you want your game to work?
                    </Typography>

                    <Box
                        onClick={() => handleModeSelect('random')}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            py: 3,
                            px: 2,
                            borderRadius: '20px',
                            background: THEME_MODE_GRADIENTS[theme].random,
                            color: 'white',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s, transform 0.2s',
                            '&:hover': { opacity: 0.9, transform: 'scale(0.99)' },
                            '&:active': { transform: 'scale(0.97)' }
                        }}
                    >
                        <ShuffleIcon sx={{ fontSize: 40 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            Random Locations
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            Pins are scattered around the starting point
                        </Typography>
                    </Box>

                    <Box
                        onClick={() => handleModeSelect('custom')}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            py: 3,
                            px: 2,
                            borderRadius: '20px',
                            background: THEME_MODE_GRADIENTS[theme].custom,
                            color: 'white',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s, transform 0.2s',
                            '&:hover': { opacity: 0.9, transform: 'scale(0.99)' },
                            '&:active': { transform: 'scale(0.97)' }
                        }}
                    >
                        <EditLocationAltIcon sx={{ fontSize: 40 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            Make Your Own
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            Place each pin exactly where you want it
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Step: Random Map (set_start → radius → pins) */}
            {step === 'random_map' && (
                <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
                    {/* Map */}
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <Map
                            ref={mapRef}
                            taskMarkers={randomMapMarkers}
                            userLocation={startLocation || mapCenter}
                            testMode={false}
                            zoom={mapPhase === 'set_start' ? 15 : spawnRadius <= 200 ? 17 : spawnRadius <= 350 ? 16 : 15}
                            onPlayerMove={() => {}}
                            designerMode={mapPhase === 'set_start'}
                            onLongPress={mapPhase === 'set_start' ? handleStartLocationSet : undefined}
                            spawnRadius={startLocation ? {
                                center: startLocation,
                                radiusMeters: spawnRadius
                            } : undefined}
                        />
                    </Box>

                    {/* Bottom sheet */}
                    <Box sx={{
                        px: 2,
                        pt: 1.5,
                        pb: 2,
                        backgroundColor: 'white',
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        flexShrink: 0
                    }}>
                        {/* Phase: Set Start */}
                        {mapPhase === 'set_start' && (
                            <>
                                <Typography sx={{ fontWeight: 700, textAlign: 'center', mb: 0.5 }}>
                                    Set the starting point
                                </Typography>
                                <Typography sx={{ color: '#6b7280', textAlign: 'center', fontSize: '0.85rem', mb: 1.5 }}>
                                    Long press on the map to set where players will begin
                                </Typography>
                                <Button onClick={handleBack} sx={secondaryButton}>
                                    &lt; Previous
                                </Button>
                            </>
                        )}

                        {/* Phase: Radius */}
                        {mapPhase === 'radius' && (
                            <>
                                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Spawn area: {spawnRadius}m
                                </Typography>
                                <Box sx={{ px: 2 }}>
                                    <Slider
                                        value={spawnRadius}
                                        onChange={(_, val) => {
                                            const r = val as number;
                                            setSpawnRadius(r);
                                            const newMax = Math.max(3, Math.floor(r / MIN_SPACING_METERS));
                                            if (randomCount > newMax) setRandomCount(newMax);
                                        }}
                                        min={100}
                                        max={500}
                                        step={50}
                                        sx={{ color: '#3b82f6' }}
                                    />
                                </Box>
                                <Box sx={{ mt: '5px', display: 'flex', gap: 2 }}>
                                    <Button fullWidth onClick={handleBack} sx={secondaryButton}>
                                        &lt; Previous
                                    </Button>
                                    <Button fullWidth onClick={() => setMapPhase('pins')} sx={primaryButton}>
                                        Next &gt;
                                    </Button>
                                </Box>
                            </>
                        )}

                        {/* Phase: Pins */}
                        {mapPhase === 'pins' && (
                            <>
                                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                                    How many pins? ({randomCount})
                                </Typography>
                                <Box sx={{ px: 2 }}>
                                    <Slider
                                        value={randomCount}
                                        onChange={(_, val) => setRandomCount(val as number)}
                                        min={3}
                                        max={maxPinsForRadius}
                                        sx={{ color: '#3b82f6' }}
                                    />
                                </Box>
                                <Typography sx={{ color: '#9ca3af', fontSize: '0.75rem', textAlign: 'center' }}>
                                    Pins shown are for illustration purposes only
                                </Typography>
                                <Box sx={{ mt: '5px', display: 'flex', gap: 2 }}>
                                    <Button fullWidth onClick={handleBack} sx={secondaryButton}>
                                        &lt; Previous
                                    </Button>
                                    <Button fullWidth onClick={() => setStep('name_create')} sx={primaryButton}>
                                        Next &gt;
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>
            )}

            {/* Step: Designer */}
            {step === 'designer' && (
                <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1 }}>
                        <EnhancedTrailDesigner
                            startLocation={startLocation || mapCenter || { lat: 51.5074, lng: -0.1278 }}
                            icons={THEME_ICONS[theme]?.icons || THEME_ICONS.general.icons}
                            defaultIcon={THEME_ICONS[theme]?.defaultIcon || 'pin'}
                            onComplete={handleDesignerComplete}
                            onCancel={() => setStep('theme')}
                        />
                        {error && (
                            <Box sx={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 2000 }}>
                                <Typography sx={{
                                    color: 'white',
                                    backgroundColor: '#ef4444',
                                    px: 3,
                                    py: 1,
                                    borderRadius: '12px',
                                    fontWeight: 600
                                }}>
                                    {error}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}

            {/* Step: Name & Create */}
            {step === 'name_create' && (
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        Name your trail
                    </Typography>
                    <Typography sx={{ color: '#6b7280', mb: 3 }}>
                        Give it a name so people know what they are joining (optional).
                    </Typography>
                    <TextField
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value.slice(0, 200))}
                        placeholder="e.g. Sophie's Birthday Hunt"
                        sx={{ mb: 2 }}
                        inputProps={{ maxLength: 200 }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={competitive}
                                onChange={(e) => setCompetitive(e.target.checked)}
                                size="small"
                            />
                        }
                        label={
                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Competitive mode</Typography>
                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                    {mode === 'random'
                                        ? 'Players compete to collect pins — first come, first served. Once a pin is claimed, it\'s gone!'
                                        : 'Players race to see who completes the trail first. Everyone follows the same route.'}
                                </Typography>
                            </Box>
                        }
                        sx={{ ml: 0, mb: 2 }}
                    />

                    {error && (
                        <Typography sx={{ color: '#ef4444', mb: 2, fontWeight: 600 }}>
                            {error}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button fullWidth onClick={handleBack} sx={secondaryButton}>
                            &lt; Previous
                        </Button>
                        <Button fullWidth onClick={handleCreate} sx={{
                            ...primaryButton,
                            background: '#22c55e !important',
                            '&:hover': { background: '#16a34a !important' }
                        }}>
                            {name.trim() ? 'Create Trail' : 'Create'}
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Step: Creating */}
            {step === 'creating' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
                    <CircularProgress size={48} sx={{ color: '#3b82f6' }} />
                    <Typography sx={{ fontWeight: 600, color: '#6b7280' }}>
                        Creating your trail...
                    </Typography>
                </Box>
            )}

            {/* Step: Done */}
            {step === 'done' && createdTrailId && (
                <ShareLinkDisplay
                    trailId={createdTrailId}
                    trailName={name.trim() || undefined}
                />
            )}
        </Box>
    );
}
