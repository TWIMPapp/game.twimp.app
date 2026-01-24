import { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Card, CardContent, Divider, Switch, FormControlLabel } from '@mui/material';
import { UniversalAPI } from '@/services/API';
import BottomNav from '@/components/BottomNav';

export default function TesterApp() {
    const [mockEnabled, setMockEnabled] = useState(false);
    const [mockLat, setMockLat] = useState('50.72');
    const [mockLng, setMockLng] = useState('-1.87');
    const [status, setStatus] = useState<any>(null);
    const userId = typeof window !== 'undefined' ? localStorage.getItem('twimp_user_id') : null;

    useEffect(() => {
        if (!userId) return;
        const fetchStatus = async () => {
            const res: any = await UniversalAPI.start(userId, parseFloat(mockLat), parseFloat(mockLng));
            setStatus(res.session);
        };
        fetchStatus();
    }, [userId]);

    const handleTeleport = async () => {
        if (!status?.currentEgg) return;
        setMockLat(status.currentEgg.lat.toString());
        setMockLng(status.currentEgg.lng.toString());
        // Trigger AWTY at new location
        await UniversalAPI.awty(userId!, status.currentEgg.lat, status.currentEgg.lng);
    };

    const handleFastForward = () => {
        // This would require a backend endpoint to "warp" time, 
        // or we can just simulate it by setting current level +1
    };

    return (
        <Box className="min-h-screen bg-gray-900 text-white p-6 pb-24">
            <Typography variant="h4" className="font-black mb-6 text-yellow-400">Twimp Debugger</Typography>

            <Card className="bg-gray-800 text-white mb-6 rounded-3xl border border-gray-700">
                <CardContent>
                    <Typography variant="h6" className="mb-4">GPS Mocking</Typography>
                    <FormControlLabel
                        control={<Switch checked={mockEnabled} onChange={(e) => setMockEnabled(e.target.checked)} />}
                        label="Enable Mock Location"
                        className="mb-4"
                    />
                    <Box className="flex gap-4">
                        <TextField
                            label="Lat"
                            value={mockLat}
                            onChange={(e) => setMockLat(e.target.value)}
                            sx={{ input: { color: 'white' }, label: { color: 'gray' } }}
                        />
                        <TextField
                            label="Lng"
                            value={mockLng}
                            onChange={(e) => setMockLng(e.target.value)}
                            sx={{ input: { color: 'white' }, label: { color: 'gray' } }}
                        />
                    </Box>
                </CardContent>
            </Card>

            <Card className="bg-gray-800 text-white mb-6 rounded-3xl border border-gray-700">
                <CardContent>
                    <Typography variant="h6" className="mb-4">Session State (Egg Hunt)</Typography>
                    <Typography variant="body2" className="text-gray-400 font-mono bg-black/30 p-4 rounded-xl mb-4">
                        Level: {status?.currentLevel}<br />
                        Score: {status?.score}<br />
                        Egg: {status?.currentEgg?.lat.toFixed(4)}, {status?.currentEgg?.lng.toFixed(4)}<br />
                        Expires: {new Date(status?.currentEgg?.expireTime).toLocaleTimeString()}
                    </Typography>

                    <Box className="flex flex-col gap-3">
                        <Button
                            variant="contained"
                            color="warning"
                            onClick={handleTeleport}
                            sx={{ borderRadius: '12px' }}
                        >
                            Teleport to Current Egg 🚀
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            sx={{ borderRadius: '12px' }}
                        >
                            Reset Universal Session ♻️
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Divider className="bg-gray-700 my-6" />

            <Typography variant="caption" className="text-gray-500">
                Use this tool to verify spawning logic. The mock coordinates will be sent to the backend during AWTY calls if active.
            </Typography>

            <BottomNav />
        </Box>
    );
}
