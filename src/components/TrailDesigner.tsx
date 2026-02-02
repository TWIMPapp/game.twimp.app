import { useState, useCallback } from 'react';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import Map, { MapRef, ExclusionZone } from './Map';
import { Marker } from '@/typings/Task';
import { Colour } from '@/typings/Colour.enum';

interface TrailDesignerProps {
    userLocation: { lat: number; lng: number } | null;
    maxEggs: number;
    radiusMeters: number;
    onComplete: (locations: Array<{ lat: number; lng: number }>) => void;
    onCancel: () => void;
    mapRef?: React.RefObject<MapRef>;
}

// Haversine distance in meters
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const MIN_SPACING_METERS = 200;

export default function TrailDesigner({
    userLocation,
    maxEggs,
    radiusMeters,
    onComplete,
    onCancel,
    mapRef
}: TrailDesignerProps) {
    const [placedEggs, setPlacedEggs] = useState<Array<{ lat: number; lng: number }>>([]);
    const [showDroppedToast, setShowDroppedToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastSeverity, setToastSeverity] = useState<'success' | 'warning'>('success');
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const currentEggNumber = placedEggs.length + 1;
    const hasEggs = placedEggs.length > 0;
    const exceededMax = placedEggs.length >= maxEggs;

    // Build exclusion zones from placed eggs
    const exclusionZones: ExclusionZone[] = placedEggs.map(egg => ({
        center: egg,
        radiusMeters: MIN_SPACING_METERS
    }));

    // Convert placed eggs to map markers - eggs beyond max are orange
    const markers: Marker[] = placedEggs.map((egg, idx) => ({
        lat: egg.lat,
        lng: egg.lng,
        title: `Egg ${idx + 1}`,
        subtitle: idx >= maxEggs ? 'Bonus (no codex)' : 'Placed',
        colour: idx >= maxEggs ? Colour.Orange : Colour.Green
    }));

    const handleLongPress = useCallback((lat: number, lng: number) => {
        // Check distance from user's current location
        if (userLocation) {
            const distFromUser = getDistanceMeters(lat, lng, userLocation.lat, userLocation.lng);
            if (distFromUser < MIN_SPACING_METERS) {
                setErrorMessage(`Too close to your location! Must be at least 200m away.`);
                setErrorOpen(true);
                return;
            }
        }

        // Check distance from all existing eggs
        for (let i = 0; i < placedEggs.length; i++) {
            const dist = getDistanceMeters(lat, lng, placedEggs[i].lat, placedEggs[i].lng);
            if (dist < MIN_SPACING_METERS) {
                setErrorMessage(`Too close to Egg ${i + 1}! Must be at least 200m apart.`);
                setErrorOpen(true);
                return;
            }
        }

        // Place the egg
        const newEggs = [...placedEggs, { lat, lng }];
        setPlacedEggs(newEggs);

        // Show appropriate message based on whether this exceeds the max
        if (newEggs.length > maxEggs) {
            setToastMessage(`Egg ${currentEggNumber} Dropped! (Won't reveal codex)`);
            setToastSeverity('warning');
        } else {
            setToastMessage(`Egg ${currentEggNumber} Dropped!`);
            setToastSeverity('success');
        }
        setShowDroppedToast(true);
    }, [placedEggs, currentEggNumber, userLocation, maxEggs]);

    const handleUndo = () => {
        if (placedEggs.length > 0) {
            setPlacedEggs(placedEggs.slice(0, -1));
        }
    };

    const handleSubmit = () => {
        if (placedEggs.length > 0) {
            onComplete(placedEggs);
        }
    };

    // Build instruction text
    const getInstructionText = () => {
        if (placedEggs.length === 0) {
            return `Long press to drop Egg 1`;
        }
        if (exceededMax) {
            return `Egg ${currentEggNumber} won't reveal codex`;
        }
        return `Long press to drop Egg ${currentEggNumber}`;
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Instruction Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 20,
                    backgroundColor: exceededMax ? '#f97316' : 'rgba(0, 0, 0, 0.75)',
                    color: 'white',
                    px: 3,
                    py: 1.5,
                    borderRadius: '20px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
            >
                <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    {getInstructionText()}
                </Typography>
            </Box>

            {/* Egg Counter - positioned at bottom, above controls */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 90,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 999,
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    px: 2,
                    py: 0.5,
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
            >
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: placedEggs.length > maxEggs ? '#f97316' : '#22c55e' }}>
                    {placedEggs.length} / {maxEggs} eggs{placedEggs.length > maxEggs ? ` (+${placedEggs.length - maxEggs} bonus)` : ''}
                </Typography>
            </Box>

            {/* Map */}
            <Box sx={{ flex: 1, pb: '80px' }}>
                <Map
                    ref={mapRef}
                    taskMarkers={markers}
                    userLocation={userLocation}
                    testMode={false}
                    zoom={18}
                    onPlayerMove={() => { }}
                    designerMode={true}
                    onLongPress={handleLongPress}
                    exclusionZones={exclusionZones}
                />
            </Box>

            {/* Bottom Controls */}
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
                    zIndex: 1000,
                    display: 'flex',
                    gap: 2
                }}
            >
                {hasEggs && (
                    <Button
                        variant="outlined"
                        onClick={handleUndo}
                        sx={{
                            py: 1.5,
                            px: 3,
                            borderRadius: '16px',
                            borderColor: '#f97316',
                            color: '#f97316',
                            fontWeight: 600,
                            textTransform: 'none'
                        }}
                    >
                        Undo
                    </Button>
                )}

                {hasEggs && (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        sx={{
                            flex: 1,
                            py: 1.5,
                            borderRadius: '16px',
                            backgroundColor: '#22c55e',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: '#16a34a'
                            }
                        }}
                    >
                        Start Egg Hunt!
                    </Button>
                )}
            </Box>

            {/* Success/Warning Toast */}
            <Snackbar
                open={showDroppedToast}
                autoHideDuration={2000}
                onClose={() => setShowDroppedToast(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ bottom: 100 }}
            >
                <Alert
                    severity={toastSeverity}
                    sx={{
                        borderRadius: '16px',
                        fontWeight: 600,
                        backgroundColor: toastSeverity === 'success' ? '#22c55e' : '#f97316',
                        color: 'white',
                        '& .MuiAlert-icon': {
                            color: 'white'
                        }
                    }}
                >
                    {toastMessage}
                </Alert>
            </Snackbar>

            {/* Error Toast */}
            <Snackbar
                open={errorOpen}
                autoHideDuration={2000}
                onClose={() => setErrorOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ bottom: 100 }}
            >
                <Alert
                    severity="error"
                    sx={{
                        borderRadius: '16px',
                        fontWeight: 600
                    }}
                    onClose={() => setErrorOpen(false)}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
