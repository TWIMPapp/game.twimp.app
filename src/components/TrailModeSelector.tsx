import { Box, Typography, Button, Dialog } from '@mui/material';
import NearMeIcon from '@mui/icons-material/NearMe';
import RouteIcon from '@mui/icons-material/Route';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

interface TrailModeSelectorProps {
    open: boolean;
    onSelectNearMe: () => void;
    onSelectAlongPath: () => void;
}

export default function TrailModeSelector({ open, onSelectNearMe, onSelectAlongPath }: TrailModeSelectorProps) {
    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    p: 3,
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                }
            }}
        >
            <Box className="text-center">
                <Typography
                    variant="h6"
                    sx={{
                        color: 'white',
                        fontWeight: 700,
                        mb: 3,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    I want to collect eggs...
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={onSelectNearMe}
                        startIcon={<NearMeIcon />}
                        sx={{
                            py: 2,
                            borderRadius: '16px',
                            backgroundColor: '#ffffff !important',
                            color: '#16a34a !important',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                            '&:hover': {
                                backgroundColor: '#f0fdf4 !important'
                            }
                        }}
                    >
                        Near Me
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={onSelectAlongPath}
                        startIcon={<RouteIcon />}
                        sx={{
                            py: 2,
                            borderRadius: '16px',
                            backgroundColor: '#ffffff !important',
                            color: '#16a34a !important',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                            '&:hover': {
                                backgroundColor: '#f0fdf4 !important'
                            }
                        }}
                    >
                        Along a Path
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 1, mt: 2 }}>
                    <LightbulbIcon sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem', mt: 0.25 }} />
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: 500,
                            textAlign: 'left'
                        }}
                    >
                        Going to the shops?<br />
                        Choose &quot;Along a Path&quot; to find eggs on the way.
                    </Typography>
                </Box>
            </Box>
        </Dialog>
    );
}
