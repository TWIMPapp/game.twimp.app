import { useState, useCallback } from 'react';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import Map, { MapRef, ExclusionZone } from '../Map';
import { Marker } from '@/typings/Task';
import { Colour } from '@/typings/Colour.enum';
import PinConfigDialog from './PinConfigDialog';

interface PinData {
    lat: number;
    lng: number;
    icon: string;
    colour: string;
    visible: boolean;
    question?: string;
    answer?: string;
    successMessage?: string;
    order: number;
}

export interface ThemeIcon { name: string; colour: string; }

interface EnhancedTrailDesignerProps {
    startLocation: { lat: number; lng: number };
    icons: ThemeIcon[];
    defaultIcon: string;
    onComplete: (pins: PinData[]) => void;
    onCancel: () => void;
    mapRef?: React.RefObject<MapRef>;
}

// Haversine distance in meters
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const MIN_SPACING_METERS = 50;

export default function EnhancedTrailDesigner({
    startLocation,
    icons,
    defaultIcon,
    onComplete,
    onCancel,
    mapRef
}: EnhancedTrailDesignerProps) {
    const [pins, setPins] = useState<PinData[]>([]);
    const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [showDroppedToast, setShowDroppedToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastSeverity, setToastSeverity] = useState<'success' | 'warning' | 'error'>('success');

    // Build exclusion zones from placed pins + start location
    const exclusionZones: ExclusionZone[] = [
        { center: startLocation, radiusMeters: MIN_SPACING_METERS },
        ...pins.map(pin => ({
            center: { lat: pin.lat, lng: pin.lng },
            radiusMeters: MIN_SPACING_METERS
        }))
    ];

    // Convert placed pins to map markers
    const markers: Marker[] = [
        // Start location marker (red)
        {
            lat: startLocation.lat,
            lng: startLocation.lng,
            title: 'Start',
            subtitle: 'Starting point',
            colour: Colour.Red
        },
        // Placed pins
        ...pins.map((pin, idx) => ({
            lat: pin.lat,
            lng: pin.lng,
            title: `Pin ${idx + 1}`,
            subtitle: pin.visible ? 'Visible' : 'Hidden',
            colour: pin.visible ? Colour.Green : Colour.Purple
        }))
    ];

    const handleLongPress = useCallback((lat: number, lng: number) => {
        // Check distance from start location
        const distFromStart = getDistanceMeters(lat, lng, startLocation.lat, startLocation.lng);
        if (distFromStart < MIN_SPACING_METERS) {
            setToastMessage('Too close to the start point! Must be at least 200m away.');
            setToastSeverity('error');
            setShowDroppedToast(true);
            return;
        }

        // Check distance from all existing pins
        for (let i = 0; i < pins.length; i++) {
            const dist = getDistanceMeters(lat, lng, pins[i].lat, pins[i].lng);
            if (dist < MIN_SPACING_METERS) {
                setToastMessage(`Too close to Pin ${i + 1}! Must be at least 200m apart.`);
                setToastSeverity('error');
                setShowDroppedToast(true);
                return;
            }
        }

        // Valid location - open config dialog
        setPendingLocation({ lat, lng });
        setShowConfigDialog(true);
    }, [pins, startLocation]);

    const handlePinConfigSave = useCallback((config: {
        icon: string;
        colour: string;
        visible: boolean;
        question?: string;
        answer?: string;
        successMessage?: string;
    }) => {
        if (!pendingLocation) return;

        const newPin: PinData = {
            lat: pendingLocation.lat,
            lng: pendingLocation.lng,
            icon: config.icon,
            colour: config.colour,
            visible: config.visible,
            question: config.question,
            answer: config.answer,
            successMessage: config.successMessage,
            order: pins.length
        };

        setPins([...pins, newPin]);
        setPendingLocation(null);
        setShowConfigDialog(false);

        setToastMessage(`Pin ${pins.length + 1} placed!`);
        setToastSeverity('success');
        setShowDroppedToast(true);
    }, [pendingLocation, pins]);

    const handlePinConfigCancel = () => {
        setPendingLocation(null);
        setShowConfigDialog(false);
    };

    const handleUndo = () => {
        if (pins.length > 0) {
            setPins(pins.slice(0, -1));
        }
    };

    const handleSubmit = () => {
        if (pins.length > 0) {
            onComplete(pins);
        }
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
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: 'white',
                    px: 3,
                    py: 1.5,
                    borderRadius: '20px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
            >
                <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    {pins.length === 0
                        ? 'Long press to place Pin 1'
                        : `Long press to place Pin ${pins.length + 1}`}
                </Typography>
            </Box>

            {/* Pin Counter */}
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
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#FF2E5B' }}>
                    {pins.length} pin{pins.length !== 1 ? 's' : ''} placed
                </Typography>
            </Box>

            {/* Map */}
            <Box sx={{ flex: 1, pb: '80px' }}>
                <Map
                    ref={mapRef}
                    taskMarkers={markers}
                    userLocation={startLocation}
                    testMode={false}
                    zoom={16}
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
                <Button
                    variant="outlined"
                    onClick={pins.length > 0 ? handleUndo : onCancel}
                    sx={{
                        py: 1.5,
                        px: 3,
                        borderRadius: '16px',
                        borderColor: pins.length > 0 ? '#f97316' : '#6b7280',
                        color: pins.length > 0 ? '#f97316' : '#6b7280',
                        fontWeight: 600,
                        textTransform: 'none'
                    }}
                >
                    {pins.length > 0 ? 'Undo' : 'Back'}
                </Button>

                {pins.length > 0 && (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        sx={{
                            flex: 1,
                            py: 1.5,
                            borderRadius: '16px',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            backgroundColor: '#FF2E5B !important',
                        }}
                    >
                        Done ({pins.length} pin{pins.length !== 1 ? 's' : ''})
                    </Button>
                )}
            </Box>

            {/* Pin Config Dialog */}
            <PinConfigDialog
                open={showConfigDialog}
                pinNumber={pins.length + 1}
                icons={icons}
                defaultIcon={defaultIcon}
                onSave={handlePinConfigSave}
                onCancel={handlePinConfigCancel}
            />

            {/* Toast */}
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
                        ...(toastSeverity === 'success' && {
                            backgroundColor: '#22c55e',
                            color: 'white',
                            '& .MuiAlert-icon': { color: 'white' }
                        })
                    }}
                >
                    {toastMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
