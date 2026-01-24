import { Box, Typography, IconButton } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export interface TutorialStep {
    message: string;
    action?: () => void;
}

interface TutorialOverlayProps {
    step: number;
    steps: TutorialStep[];
    onNext: () => void;
    onComplete: () => void;
}

export default function TutorialOverlay({ step, steps, onNext, onComplete }: TutorialOverlayProps) {
    const currentStep = steps[step];
    const isLastStep = step === steps.length - 1;

    const handleNext = () => {
        // Execute the action for the current step (which animates to next view)
        if (currentStep.action) {
            currentStep.action();
        }

        if (isLastStep) {
            onComplete();
        } else {
            onNext();
        }
    };

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                pointerEvents: 'none',
            }}
        >
            {/* Tutorial bubble */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '120px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxWidth: '320px',
                    width: '90%',
                    pointerEvents: 'auto',
                }}
            >
                {/* Speech bubble */}
                <Box
                    sx={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        padding: '16px 20px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    {/* Message */}
                    <Typography
                        sx={{
                            flex: 1,
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            color: '#333',
                            lineHeight: 1.4,
                        }}
                    >
                        {currentStep.message}
                    </Typography>

                    {/* Next button */}
                    <IconButton
                        onClick={handleNext}
                        sx={{
                            backgroundColor: '#FF6A88',
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            flexShrink: 0,
                            '&:hover': {
                                backgroundColor: '#ff4f73',
                            },
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>

                    {/* Speech bubble tail */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: '-10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '12px solid transparent',
                            borderRight: '12px solid transparent',
                            borderTop: '12px solid white',
                        }}
                    />
                </Box>

                {/* Step indicator dots */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '16px',
                    }}
                >
                    {steps.map((_, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: idx === step ? '#FF6A88' : 'rgba(255, 255, 255, 0.5)',
                                transition: 'background-color 0.3s ease',
                            }}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
