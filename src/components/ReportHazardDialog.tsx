import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, CircularProgress
} from '@mui/material';

const HAZARD_CATEGORIES = [
    { id: 'water', label: 'Water / Sea', emoji: '🌊' },
    { id: 'private_property', label: 'Private Property', emoji: '🔒' },
    { id: 'busy_road', label: 'Busy Road', emoji: '🚗' },
    { id: 'other_unsafe', label: 'Other Unsafe', emoji: '⚠️' },
];

interface ReportHazardDialogProps {
    open: boolean;
    onClose: () => void;
    onReport: (category: string) => Promise<void>;
}

export default function ReportHazardDialog({ open, onClose, onReport }: ReportHazardDialogProps) {
    const [step, setStep] = useState<'confirm' | 'categorise'>('confirm');
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        setStep('confirm');
        setSubmitting(false);
        onClose();
    };

    const handleReport = async (category: string) => {
        setSubmitting(true);
        try {
            await onReport(category);
        } finally {
            setSubmitting(false);
            setStep('confirm');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: 360 } }}
        >
            {step === 'confirm' && (
                <>
                    <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
                        Can't reach this?
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#6b7280' }}>
                            If this location is unreachable or unsafe, we'll move it somewhere new.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
                        <Button
                            onClick={handleClose}
                            sx={{ textTransform: 'none', color: '#6b7280' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => setStep('categorise')}
                            sx={{
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 3,
                                backgroundColor: '#ef4444 !important',
                            }}
                        >
                            Report
                        </Button>
                    </DialogActions>
                </>
            )}

            {step === 'categorise' && (
                <>
                    <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
                        Why can't you get there?
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {HAZARD_CATEGORIES.map((cat) => (
                                <Button
                                    key={cat.id}
                                    variant="outlined"
                                    onClick={() => handleReport(cat.id)}
                                    disabled={submitting}
                                    sx={{
                                        borderRadius: '16px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        py: 1.5,
                                        fontSize: '1rem',
                                        borderColor: '#d1d5db',
                                        color: '#374151',
                                        justifyContent: 'flex-start',
                                        gap: 1.5,
                                        '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                                    }}
                                >
                                    <span style={{ fontSize: '1.4rem' }}>{cat.emoji}</span>
                                    {cat.label}
                                    {submitting && (
                                        <CircularProgress size={16} sx={{ ml: 'auto', color: '#9ca3af' }} />
                                    )}
                                </Button>
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button
                            onClick={handleClose}
                            disabled={submitting}
                            sx={{ textTransform: 'none', color: '#6b7280' }}
                        >
                            Cancel
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}
