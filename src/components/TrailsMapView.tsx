import { GoogleMap, LoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useState, useRef, useCallback } from 'react';
import { Game } from '@/types';
import { Box, Button, Card, CardMedia, Typography } from '@mui/material';

const containerStyle = {
    width: '100%',
    height: 'calc(100vh - 120px)',
    position: 'relative' as 'relative'
};

interface TrailsMapViewProps {
    games: Game[];
    onPlayGame: (game: Game) => void;
}

export default function TrailsMapView({ games, onPlayGame }: TrailsMapViewProps) {
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;

        // Calculate bounds to fit all markers
        if (games.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            games.forEach(game => {
                if (game.lat && game.lng) {
                    bounds.extend({ lat: game.lat, lng: game.lng });
                }
            });
            map.fitBounds(bounds);

            // Set a reasonable zoom level if only one marker
            if (games.length === 1) {
                map.setZoom(12);
            }
        } else {
            // Default to user's location if no games
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCenter(userLocation);
                    map.panTo(userLocation);
                    map.setZoom(12);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Default to London if geolocation fails
                    const defaultLocation = { lat: 51.5074, lng: -0.1278 };
                    setCenter(defaultLocation);
                    map.panTo(defaultLocation);
                    map.setZoom(6);
                }
            );
        }
    }, [games]);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    // Filter games that have valid coordinates
    const gamesWithLocation = games.filter(game => game.lat && game.lng);

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <LoadScript googleMapsApiKey="AIzaSyCPlJtyG0WSQJbM48Nbi980bzBixe2hbYQ">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    zoom={12}
                    center={center || { lat: 51.5074, lng: -0.1278 }}
                    options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true,
                        clickableIcons: false,
                        styles: [
                            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] }
                        ],
                    }}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                >
                    {gamesWithLocation.map((game) => (
                        <MarkerF
                            key={game.ref}
                            position={{ lat: game.lat!, lng: game.lng! }}
                            onClick={() => setSelectedGame(game)}
                            title={game.name}
                        />
                    ))}

                    {selectedGame && selectedGame.lat && selectedGame.lng && (
                        <InfoWindowF
                            position={{ lat: selectedGame.lat, lng: selectedGame.lng }}
                            onCloseClick={() => setSelectedGame(null)}
                        >
                            <Card sx={{ maxWidth: 300, boxShadow: 'none' }}>
                                {selectedGame.image_url && (
                                    <CardMedia
                                        component="img"
                                        height="140"
                                        image={selectedGame.image_url}
                                        alt={selectedGame.name}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                )}
                                <Box sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', flex: 1, fontFamily: "'Noto Sans', sans-serif" }}>
                                            {selectedGame.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: "'Noto Sans', sans-serif" }}>
                                        {selectedGame.description?.substring(0, 100)}
                                        {selectedGame.description && selectedGame.description.length > 100 ? '...' : ''}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => onPlayGame(selectedGame)}
                                        sx={{
                                            backgroundColor: '#FF2E5B !important',
                                            borderRadius: '16px',
                                            fontWeight: 'bold',
                                            py: 1.5,
                                            textTransform: 'none',
                                            '&:hover': {
                                                backgroundColor: '#E0264D !important'
                                            }
                                        }}
                                    >
                                        Play Now
                                    </Button>
                                </Box>
                            </Card>
                        </InfoWindowF>
                    )}
                </GoogleMap>
            </LoadScript>
        </Box>
    );
}
