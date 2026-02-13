import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    TextField,
    Switch,
    FormControlLabel,
    Grid
} from '@mui/material';
import { ThemeIcon } from './EnhancedTrailDesigner';

interface PinConfig {
    icon: string;
    colour: string;
    visible: boolean;
    question?: string;
    answer?: string;
    successMessage?: string;
}

interface PinConfigDialogProps {
    open: boolean;
    pinNumber: number;
    icons: ThemeIcon[];
    defaultIcon: string;
    onSave: (config: PinConfig) => void;
    onCancel: () => void;
}

// Icon definitions - emoji and label for each icon type
const ICON_DISPLAY: Record<string, { emoji: string; label: string }> = {
    egg_red: { emoji: '🔴', label: 'Red Egg' },
    egg_blue: { emoji: '🔵', label: 'Blue Egg' },
    egg_green: { emoji: '🟢', label: 'Green Egg' },
    egg_gold: { emoji: '🟡', label: 'Gold Egg' },
    egg_orange: { emoji: '🟠', label: 'Orange Egg' },
    basket: { emoji: '🧺', label: 'Basket' },
    treasure_chest: { emoji: '📦', label: 'Treasure' },
    question_mark: { emoji: '❓', label: 'Mystery' },
    heart_red: { emoji: '❤️', label: 'Red Heart' },
    heart_pink: { emoji: '💗', label: 'Pink Heart' },
    rose: { emoji: '🌹', label: 'Rose' },
    love_letter: { emoji: '💌', label: 'Love Letter' },
    pin: { emoji: '📍', label: 'Pin' },
    star: { emoji: '⭐', label: 'Star' },
    flag: { emoji: '🏁', label: 'Flag' },
    gift: { emoji: '🎁', label: 'Gift' }
};

export default function PinConfigDialog({
    open,
    pinNumber,
    icons,
    defaultIcon,
    onSave,
    onCancel
}: PinConfigDialogProps) {
    const [selectedIcon, setSelectedIcon] = useState(defaultIcon);
    const [visible, setVisible] = useState(true);
    const [hasQuestion, setHasQuestion] = useState(false);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSave = () => {
        const iconObj = icons.find(i => i.name === selectedIcon);
        onSave({
            icon: selectedIcon,
            colour: iconObj?.colour || 'red',
            visible,
            question: hasQuestion && question.trim() ? question.trim() : undefined,
            answer: hasQuestion && answer.trim() ? answer.trim() : undefined,
            successMessage: successMessage.trim() || undefined
        });
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '24px', p: 1 }
            }}
        >
            <DialogTitle sx={{ fontWeight: 700 }}>
                Configure Pin {pinNumber}
            </DialogTitle>

            <DialogContent>
                {/* Icon Selection */}
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Icon</Typography>
                <Grid container spacing={1} sx={{ mb: 3 }}>
                    {icons.map((icon) => (
                        <Grid item key={icon.name}>
                            <Button
                                variant={selectedIcon === icon.name ? 'contained' : 'outlined'}
                                onClick={() => setSelectedIcon(icon.name)}
                                sx={{
                                    minWidth: 'auto',
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: '12px',
                                    fontSize: '1.5rem',
                                    borderColor: selectedIcon === icon.name ? undefined : '#e5e7eb',
                                    backgroundColor: selectedIcon === icon.name ? '#FF2E5B !important' : undefined
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                                    <span>{ICON_DISPLAY[icon.name]?.emoji || '📍'}</span>
                                    <Typography sx={{ fontSize: '0.6rem', color: selectedIcon === icon.name ? 'white' : '#6b7280' }}>
                                        {ICON_DISPLAY[icon.name]?.label || icon.name}
                                    </Typography>
                                </Box>
                            </Button>
                        </Grid>
                    ))}
                </Grid>

                {/* Visibility */}
                <FormControlLabel
                    control={
                        <Switch
                            checked={visible}
                            onChange={(e) => setVisible(e.target.checked)}
                        />
                    }
                    label={
                        <Box>
                            <Typography sx={{ fontWeight: 600 }}>Show on map</Typography>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {visible
                                    ? 'Pin will be visible to players'
                                    : 'Hidden - players must follow clues to find it'}
                            </Typography>
                        </Box>
                    }
                    sx={{ mb: 2, ml: 0 }}
                />

                {/* Question Toggle */}
                <FormControlLabel
                    control={
                        <Switch
                            checked={hasQuestion}
                            onChange={(e) => setHasQuestion(e.target.checked)}
                        />
                    }
                    label={
                        <Typography sx={{ fontWeight: 600 }}>Ask a question on arrival</Typography>
                    }
                    sx={{ mb: 1, ml: 0 }}
                />

                {hasQuestion && (
                    <Box sx={{ mb: 2, pl: 2 }}>
                        <TextField
                            fullWidth
                            label="Question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                            placeholder="e.g. What year was this building built?"
                            sx={{ mb: 1.5 }}
                            inputProps={{ maxLength: 200 }}
                            helperText={`${question.length}/200`}
                        />
                        <TextField
                            fullWidth
                            label="Answer"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value.slice(0, 200))}
                            placeholder="e.g. 1842"
                            inputProps={{ maxLength: 200 }}
                            helperText={`${answer.length}/200`}
                        />
                    </Box>
                )}

                {/* Success Message */}
                <Typography sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                    Message on collection
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 1 }}>
                    This message will be shown when the player collects this pin.
                    For hidden pins, use this as a clue to the next location!
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={successMessage}
                    onChange={(e) => setSuccessMessage(e.target.value.slice(0, 200))}
                    placeholder="e.g. Well done! Now head to where we first met..."
                    inputProps={{ maxLength: 200 }}
                    helperText={`${successMessage.length}/200`}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onCancel}
                    sx={{ borderRadius: '12px', textTransform: 'none', color: '#6b7280' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 4,
                        backgroundColor: '#FF2E5B !important',
                    }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
