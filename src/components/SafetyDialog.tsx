import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

interface SafetyDialogProps {
    open: boolean;
    onAcknowledge: () => void;
}

export default function SafetyDialog({ open, onAcknowledge }: SafetyDialogProps) {
    const [acknowledged, setAcknowledged] = useState(false);

    const handleAcknowledge = () => {
        if (acknowledged) {
            onAcknowledge();
            // Reset checkbox after a small delay so dialog closes first
            setTimeout(() => setAcknowledged(false), 100);
        }
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle
                component="div"
                sx={{
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                    color: 'white',
                    textAlign: 'center',
                    py: 3
                }}
            >
                <Typography variant="h5" component="p" fontWeight="bold">
                    Safety Information
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                    Please read before playing
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: '37px', pb: 3 }}>
                {/* Section 1: General Safety */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box
                            sx={{
                                backgroundColor: '#FFF3E0',
                                borderRadius: '10px',
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <WarningAmberIcon sx={{ color: '#E65100', fontSize: 24 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Your Responsibility
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Twimp has no knowledge of where you are choosing to play this game. We have not checked the area and we don&apos;t know what hazards may exist. As a parent or guardian, please check the play area to confirm it is safe for your family before starting.
                    </Typography>
                </Box>

                {/* Section 2: Roads & Hazards */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box
                            sx={{
                                backgroundColor: '#E3F2FD',
                                borderRadius: '10px',
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <DirectionsCarIcon sx={{ color: '#1565C0', fontSize: 24 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Roads & Unsafe Areas
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Eggs may appear in roads, water, or other unsafe locations. The collection radius is 20 metres, so you can always collect an egg from a nearby safe path without entering dangerous areas. If an egg spawns somewhere completely inaccessible, use the hazard button to respawn it.
                    </Typography>
                </Box>

                {/* Section 3: Parental Guidance */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box
                            sx={{
                                backgroundColor: '#F3E5F5',
                                borderRadius: '10px',
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <FamilyRestroomIcon sx={{ color: '#7B1FA2', fontSize: 24 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Play Together
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        This game is designed for families to enjoy together. It is not intended to be handed to a child to play unsupervised. Always accompany your children and remind everyone not to look at the screen while walking.
                    </Typography>
                </Box>

                {/* Acknowledgment Checkbox */}
                <Box
                    sx={{
                        backgroundColor: '#FFF8E1',
                        borderRadius: '12px',
                        p: 2,
                        border: '1px solid #FFE082'
                    }}
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                                sx={{
                                    color: '#F57C00',
                                    '&.Mui-checked': {
                                        color: '#E65100'
                                    }
                                }}
                            />
                        }
                        label={
                            <Typography variant="body2" fontWeight="medium">
                                I understand that as the parent or guardian, I am responsible for ensuring the safety of my family while playing this game.
                            </Typography>
                        }
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    fullWidth
                    variant="contained"
                    disabled={!acknowledged}
                    onClick={handleAcknowledge}
                    sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        background: acknowledged
                            ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                            : undefined,
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                >
                    Start Playing
                </Button>
            </DialogActions>
        </Dialog>
    );
}
