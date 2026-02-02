import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Typography,
    Button,
    TextField,
    Slider,
    Switch,
    FormControlLabel,
    CircularProgress,
    IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ThemeSelector from '@/components/custom-trail/ThemeSelector';
import EnhancedTrailDesigner from '@/components/custom-trail/EnhancedTrailDesigner';
import ShareLinkDisplay from '@/components/custom-trail/ShareLinkDisplay';
import Map, { MapRef } from '@/components/Map';
import { CustomTrailAPI } from '@/services/API';
import { Colour } from '@/typings/Colour.enum';

type CustomTrailTheme = 'easter' | 'valentine' | 'general';
type Step = 'theme' | 'name' | 'start_location' | 'mode' | 'random_config' | 'designer' | 'creating' | 'done';

// Theme icon sets (mirrors backend themes.ts)
const THEME_ICONS: Record<string, { icons: string[]; defaultIcon: string }> = {
    easter: {
        icons: ['egg_red', 'egg_blue', 'egg_green', 'egg_gold', 'egg_orange', 'basket', 'treasure_chest', 'question_mark'],
        defaultIcon: 'egg_red'
    },
    valentine: {
        icons: ['heart_red', 'heart_pink', 'rose', 'love_letter', 'treasure_chest', 'question_mark'],
        defaultIcon: 'heart_red'
    },
    general: {
        icons: ['pin', 'treasure_chest', 'star', 'question_mark', 'flag'],
        defaultIcon: 'pin'
    }
};

export default function CreateCustomTrail() {
    const router = useRouter();
    const { user_id } = router.query;

    const [step, setStep] = useState<Step>('theme');
    const [theme, setTheme] = useState<CustomTrailTheme>('general');
    const [name, setName] = useState('');
    const [startLocation, setStartLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [randomCount, setRandomCount] = useState(5);
    const [competitive, setCompetitive] = useState(false);
    const [createdTrailId, setCreatedTrailId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

    const creatorId = (user_id as string) || `anon_${Date.now()}`;

    // Request geolocation on mount so the map is ready by the time the user reaches that step
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setMapCenter({ lat: 51.5074, lng: -0.1278 }) // fallback to London
        );
    }, []);

    const handleThemeSelect = (t: CustomTrailTheme) => {
        setTheme(t);
        setStep('name');
    };

    const handleNameNext = () => {
        setStep('start_location');
    };

    const handleStartLocationSet = (lat: number, lng: number) => {
        setStartLocation({ lat, lng });
    };

    const handleStartLocationConfirm = () => {
        if (startLocation) {
            setStep('mode');
        }
    };

    const handleModeSelect = (mode: 'random' | 'custom') => {
        if (mode === 'random') {
            setStep('random_config');
        } else {
            setStep('designer');
        }
    };

    const handleRandomCreate = async () => {
        if (!startLocation) return;
        setStep('creating');
        setError(null);

        try {
            const result: any = await CustomTrailAPI.create({
                creator_id: creatorId,
                theme,
                name: name.trim() || undefined,
                start_location: startLocation,
                mode: 'random',
                competitive,
                count: randomCount
            });

            if (result.ok && result.trail) {
                setCreatedTrailId(result.trail.id);
                setStep('done');
            } else {
                setError(result.message || 'Failed to create trail');
                setStep('random_config');
            }
        } catch (e: any) {
            setError(e.message || 'Network error');
            setStep('random_config');
        }
    };

    const handleCustomComplete = async (pins: any[]) => {
        if (!startLocation) return;
        setStep('creating');
        setError(null);

        try {
            const result: any = await CustomTrailAPI.create({
                creator_id: creatorId,
                theme,
                name: name.trim() || undefined,
                start_location: startLocation,
                pins,
                mode: 'custom',
                competitive
            });

            if (result.ok && result.trail) {
                setCreatedTrailId(result.trail.id);
                setStep('done');
            } else {
                setError(result.message || 'Failed to create trail');
                setStep('designer');
            }
        } catch (e: any) {
            setError(e.message || 'Network error');
            setStep('designer');
        }
    };

    const handleBack = () => {
        switch (step) {
            case 'name': setStep('theme'); break;
            case 'start_location': setStep('name'); break;
            case 'mode': setStep('start_location'); break;
            case 'random_config': setStep('mode'); break;
            case 'designer': setStep('mode'); break;
            default: break;
        }
    };

    // Header bar (not shown on theme select or designer)
    const showHeader = !['theme', 'designer', 'creating', 'done'].includes(step);

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Header */}
            {showHeader && (
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #e5e7eb' }}>
                    <IconButton onClick={handleBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', ml: 1 }}>
                        Create Trail
                    </Typography>
                </Box>
            )}

            {/* Step: Theme */}
            {step === 'theme' && (
                <ThemeSelector onSelect={handleThemeSelect} />
            )}

            {/* Step: Name */}
            {step === 'name' && (
                <Box sx={{ p: 3 }}>
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
                        sx={{ mb: 3 }}
                        inputProps={{ maxLength: 200 }}
                    />
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleNameNext}
                        sx={{
                            py: 1.5,
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontWeight: 700,
                            background: '#3b82f6 !important',
                            color: 'white !important',
                            '&:hover': { background: '#2563eb !important' }
                        }}
                    >
                        {name.trim() ? 'Next' : 'Skip'}
                    </Button>
                </Box>
            )}

            {/* Step: Start Location */}
            {step === 'start_location' && (
                <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700 }}>
                            Set the starting point
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            Long press on the map to set where players will begin
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, pb: '80px' }}>
                        <Map
                            taskMarkers={startLocation ? [{
                                lat: startLocation.lat,
                                lng: startLocation.lng,
                                title: 'Start',
                                subtitle: 'Starting point',
                                colour: Colour.Red
                            }] : []}
                            userLocation={mapCenter}
                            testMode={false}
                            zoom={15}
                            onPlayerMove={() => { }}
                            designerMode={true}
                            onLongPress={handleStartLocationSet}
                        />
                    </Box>
                    {startLocation && (
                        <Box
                            sx={{
                                position: 'fixed',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                p: 2,
                                backgroundColor: 'white',
                                borderTopLeftRadius: '24px',
                                borderTopRightRadius: '24px',
                                boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                                zIndex: 1000
                            }}
                        >
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleStartLocationConfirm}
                                sx={{
                                    py: 1.5,
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    background: '#22c55e !important',
                                    color: 'white !important',
                                    '&:hover': { background: '#16a34a !important' }
                                }}
                            >
                                Confirm Starting Point
                            </Button>
                        </Box>
                    )}
                </Box>
            )}

            {/* Step: Mode */}
            {step === 'mode' && (
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        How do you want to place pins?
                    </Typography>
                    <Typography sx={{ color: '#6b7280', mb: 3 }}>
                        Choose how the locations in your trail are created.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                            onClick={() => handleModeSelect('random')}
                            sx={{
                                py: 3,
                                borderRadius: '20px',
                                border: '2px solid #e5e7eb',
                                textTransform: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                '&:hover': { borderColor: '#3b82f6', backgroundColor: '#eff6ff' }
                            }}
                        >
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1f2937' }}>
                                Random Locations
                            </Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                We'll scatter pins around the starting point
                            </Typography>
                        </Button>

                        <Button
                            onClick={() => handleModeSelect('custom')}
                            sx={{
                                py: 3,
                                borderRadius: '20px',
                                border: '2px solid #e5e7eb',
                                textTransform: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                '&:hover': { borderColor: '#3b82f6', backgroundColor: '#eff6ff' }
                            }}
                        >
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1f2937' }}>
                                Make Your Own
                            </Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                Place each pin exactly where you want it
                            </Typography>
                        </Button>
                    </Box>

                </Box>
            )}

            {/* Step: Random Config */}
            {step === 'random_config' && (
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                        Configure your trail
                    </Typography>

                    <Typography sx={{ fontWeight: 600, mb: 1 }}>
                        How many pins? ({randomCount})
                    </Typography>
                    <Slider
                        value={randomCount}
                        onChange={(_, val) => setRandomCount(val as number)}
                        min={3}
                        max={20}
                        marks={[
                            { value: 3, label: '3' },
                            { value: 10, label: '10' },
                            { value: 20, label: '20' }
                        ]}
                        sx={{ mb: 4, color: '#3b82f6' }}
                    />

                    <Box sx={{ mb: 4, p: 2, borderRadius: '16px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={competitive}
                                    onChange={(e) => setCompetitive(e.target.checked)}
                                />
                            }
                            label={
                                <Box>
                                    <Typography sx={{ fontWeight: 600 }}>Competitive mode</Typography>
                                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                        All pins visible to everyone. When someone collects a pin, it disappears from everyone else's map.
                                    </Typography>
                                </Box>
                            }
                            sx={{ ml: 0 }}
                        />
                    </Box>

                    {error && (
                        <Typography sx={{ color: '#ef4444', mb: 2, fontWeight: 600 }}>
                            {error}
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleRandomCreate}
                        sx={{
                            py: 1.5,
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontWeight: 700,
                            background: '#3b82f6 !important',
                            color: 'white !important',
                            '&:hover': { background: '#2563eb !important' }
                        }}
                    >
                        Create Trail
                    </Button>
                </Box>
            )}

            {/* Step: Designer */}
            {step === 'designer' && startLocation && (
                <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ px: 2, py: 1, backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
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
                                    <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                        Multiple players race to complete the trail first. Each player solves it independently.
                                    </Typography>
                                </Box>
                            }
                            sx={{ ml: 0 }}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                    <EnhancedTrailDesigner
                        startLocation={startLocation}
                        icons={THEME_ICONS[theme]?.icons || THEME_ICONS.general.icons}
                        defaultIcon={THEME_ICONS[theme]?.defaultIcon || 'pin'}
                        onComplete={handleCustomComplete}
                        onCancel={() => setStep('mode')}
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
