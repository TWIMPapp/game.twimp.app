import { useState } from 'react';
import Head from 'next/head';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    CircularProgress, Chip, TextField, Dialog, DialogContent,
    IconButton, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import logoImg from '@/assets/images/logo.png';

// ============ DESIGN TOKENS ============
const colors = {
    pink: '#FF2E5B',
    pinkLight: '#FF6C88',
    pinkSoft: '#FFF0F3',
    green: '#2DB87A',
    greenLight: '#E8F8F0',
    turquoise: '#3BBFA0',
    yellow: '#FFD166',
    yellowLight: '#FFF8E7',
    bg: '#F8F5F2',
    card: '#FFFFFF',
    text: '#1A1A2E',
    textSoft: '#6B7280',
    textMuted: '#9CA3AF',
};

const FONT = "'Poppins', sans-serif";

// ============ SANDBOX PAGE ============
export default function Sandbox() {
    const [showModal, setShowModal] = useState(false);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: colors.bg, pb: 14 }}>
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </Head>


            {/* ============ HEADER ============ */}
            <SectionLabel label="Header" />
            <Box sx={{
                px: 2, pt: 2, pb: 1.5,
                display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: 'white', mx: 2, borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
                <img src={logoImg.src} alt="Twimp" style={{ height: 38 }} />
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{
                        fontFamily: FONT, fontWeight: 900, fontSize: '1.3rem',
                        color: colors.text, lineHeight: 1.2,
                    }}>
                        twimp
                    </Typography>
                    <Typography sx={{
                        fontFamily: FONT, fontSize: '0.65rem',
                        color: colors.textMuted, fontWeight: 600,
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                    }}>
                        The World is my Playground
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddCircleIcon />}
                    sx={{
                        fontFamily: FONT,
                        borderRadius: '14px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        px: 2,
                        py: 1,
                        backgroundColor: `${colors.green} !important`,
                        boxShadow: '0 4px 12px rgba(45, 184, 122, 0.3)',
                    }}
                >
                    Create
                </Button>
            </Box>

            {/* ============ GRADIENT BARS ============ */}
            <SectionLabel label="Gradient Bars (reusable accent)" />
            <Box sx={{
                mx: 2, mb: 1, borderRadius: '16px', overflow: 'hidden',
                background: `linear-gradient(135deg, ${colors.pink} 0%, ${colors.pinkLight} 100%)`,
                px: 2.5, py: 2,
                display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
                <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: 800, fontSize: '1.5rem', color: 'white',
                    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>
                    twimp
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                    <SearchIcon />
                </IconButton>
            </Box>
            <Box sx={{
                mx: 2, mb: 1, borderRadius: '16px', overflow: 'hidden',
                background: `linear-gradient(135deg, ${colors.green} 0%, ${colors.turquoise} 100%)`,
                px: 2.5, py: 2,
                display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
                <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: 800, fontSize: '1.5rem', color: 'white',
                    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>
                    twimp
                </Typography>
                <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: 600, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)',
                }}>
                    Easter Event
                </Typography>
            </Box>
            <Box sx={{
                mx: 2, borderRadius: '16px', overflow: 'hidden',
                background: `linear-gradient(135deg, ${colors.yellow} 0%, #F59E0B 100%)`,
                px: 2.5, py: 2,
                display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
                <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: 800, fontSize: '1.5rem', color: 'white',
                    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>
                    twimp
                </Typography>
            </Box>

            <SectionLabel label="Featured Card" />
            <Box sx={{ px: 2 }}>
                <FeaturedCardDemo font={FONT} />
            </Box>


            {/* ============ SEARCH BAR ============ */}
            <SectionLabel label="Search Bar" />
            <Box sx={{ px: 2, mb: 2 }}>
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    bgcolor: 'white', borderRadius: '16px', px: 2, py: 1,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '2px solid transparent',
                    transition: 'border-color 0.2s',
                    '&:focus-within': { borderColor: colors.pink },
                }}>
                    <SearchIcon sx={{ color: colors.textMuted, fontSize: 22 }} />
                    <input
                        placeholder="Search adventures..."
                        style={{
                            border: 'none', outline: 'none', flex: 1,
                            fontSize: '0.95rem', fontFamily: FONT,
                            background: 'transparent', color: colors.text,
                        }}
                    />
                    <Box sx={{
                        bgcolor: colors.pink, borderRadius: '10px',
                        width: 34, height: 34, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(255, 46, 91, 0.3)',
                        transition: 'transform 0.15s',
                        '&:hover': { transform: 'scale(1.05)' },
                    }}>
                        <SearchIcon sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                </Box>
            </Box>


            {/* ============ BUTTONS ============ */}
            <SectionLabel label="Buttons" />
            <Box sx={{ px: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
                <Button variant="contained" sx={{
                    fontFamily: FONT,
                    borderRadius: '14px', textTransform: 'none', fontWeight: 700,
                    px: 3, py: 1.2,
                    backgroundColor: `${colors.pink} !important`,
                    boxShadow: '0 4px 14px rgba(255, 46, 91, 0.35)',
                    '&:hover': { boxShadow: '0 6px 20px rgba(255, 46, 91, 0.45)', transform: 'translateY(-1px)' },
                    transition: 'all 0.2s',
                }}>
                    Play Now
                </Button>

                <Button variant="contained" sx={{
                    fontFamily: FONT,
                    borderRadius: '14px', textTransform: 'none', fontWeight: 700,
                    px: 3, py: 1.2,
                    backgroundColor: `${colors.green} !important`,
                    boxShadow: '0 4px 14px rgba(45, 184, 122, 0.35)',
                    '&:hover': { boxShadow: '0 6px 20px rgba(45, 184, 122, 0.45)', transform: 'translateY(-1px)' },
                    transition: 'all 0.2s',
                }}>
                    Create Game
                </Button>

                <Button variant="outlined" sx={{
                    fontFamily: FONT,
                    borderRadius: '14px', textTransform: 'none', fontWeight: 600,
                    px: 3, py: 1.2,
                    borderColor: colors.pink, color: colors.pink, borderWidth: 2,
                    '&:hover': { borderWidth: 2, bgcolor: colors.pinkSoft },
                }}>
                    Share Link
                </Button>

                <Button sx={{
                    fontFamily: FONT,
                    borderRadius: '14px', textTransform: 'none', fontWeight: 600,
                    px: 3, py: 1.2,
                    bgcolor: colors.pinkSoft, color: colors.pink,
                    '&:hover': { bgcolor: '#FFD6E0' },
                }}>
                    Copy Link
                </Button>
            </Box>

            <Box sx={{ px: 2, display: 'flex', gap: 1.5, mb: 1 }}>
                <Button variant="contained" startIcon={<PlayArrowRoundedIcon />} sx={{
                    fontFamily: FONT,
                    borderRadius: '16px', textTransform: 'none', fontWeight: 700,
                    px: 3, py: 1.5, fontSize: '1rem',
                    backgroundColor: `${colors.pink} !important`,
                    boxShadow: '0 4px 14px rgba(255, 46, 91, 0.35)',
                }}>
                    Start Adventure
                </Button>
                <IconButton sx={{
                    bgcolor: colors.yellowLight,
                    width: 48, height: 48,
                    boxShadow: '0 2px 8px rgba(255, 209, 102, 0.3)',
                    '&:hover': { bgcolor: '#FFE9B3' },
                }}>
                    <StarIcon sx={{ color: '#F59E0B' }} />
                </IconButton>
                <IconButton sx={{
                    bgcolor: colors.pinkSoft,
                    width: 48, height: 48,
                    boxShadow: '0 2px 8px rgba(255, 46, 91, 0.15)',
                    '&:hover': { bgcolor: '#FFD6E0' },
                }}>
                    <FavoriteIcon sx={{ color: colors.pink }} />
                </IconButton>
            </Box>


            {/* ============ GAME CARDS ============ */}
            <SectionLabel label="Game Cards" />
            <Box sx={{ px: 2, display: 'flex', gap: 2 }}>
                <GameCard
                    title="Easter Hunt"
                    image="https://images.unsplash.com/photo-1457530378978-8bac673b8062?w=400&q=80"
                    tag="Seasonal"
                    tagColor={colors.green}
                    distance="1.2 mi"
                    font={FONT}
                />
                <GameCard
                    title="City Explorer"
                    image="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=80"
                    tag="Popular"
                    tagColor={colors.pink}
                    distance="0.8 mi"
                    font={FONT}
                />
            </Box>

            {/* Coming soon card */}
            <Box sx={{ px: 2, mt: 2 }}>
                <Card sx={{
                    borderRadius: '20px', overflow: 'hidden', position: 'relative',
                    height: 140, opacity: 0.7,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}>
                    <CardMedia
                        component="img"
                        image="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80"
                        alt="Coming Soon"
                        sx={{ position: 'absolute', inset: 0, height: '100%', objectFit: 'cover', filter: 'grayscale(40%)' }}
                    />
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
                    <CardContent sx={{
                        position: 'relative', zIndex: 1, height: '100%',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 2.5,
                    }}>
                        <Typography sx={{ fontFamily: FONT, fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>
                            Mountain Quest
                        </Typography>
                        <Chip
                            label="COMING SOON"
                            size="small"
                            sx={{
                                fontFamily: FONT,
                                bgcolor: colors.yellow, color: '#92400E', fontWeight: 700,
                                fontSize: '0.65rem', width: 'fit-content', mt: 0.5,
                                letterSpacing: '0.5px',
                            }}
                        />
                    </CardContent>
                </Card>
            </Box>


            {/* ============ CHIPS & BADGES ============ */}
            <SectionLabel label="Chips & Badges" />
            <Box sx={{ px: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label="Active" sx={{ fontFamily: FONT, bgcolor: colors.greenLight, color: colors.green, fontWeight: 700 }} />
                <Chip label="Stopped" sx={{ fontFamily: FONT, bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 700 }} />
                <Chip label="Expired" sx={{ fontFamily: FONT, bgcolor: '#F3F4F6', color: '#6B7280', fontWeight: 700 }} />
                <Chip label="Competitive" sx={{ fontFamily: FONT, bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700 }} />
                <Chip icon={<EmojiEventsIcon sx={{ color: `${colors.yellow} !important` }} />} label="3 / 10 collected" sx={{ fontFamily: FONT, bgcolor: colors.yellowLight, fontWeight: 600 }} />
                <Chip label="Free" sx={{ fontFamily: FONT, bgcolor: colors.green, color: 'white', fontWeight: 700 }} />
            </Box>


            {/* ============ LOADING STATES ============ */}
            <SectionLabel label="Loading States" />
            <Box sx={{ px: 2, display: 'flex', gap: 3, alignItems: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress size={48} thickness={4} sx={{ color: colors.pink }} />
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <img src={logoImg.src} alt="" style={{ height: 24 }} />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                        <Box key={i} sx={{
                            width: 10, height: 10, borderRadius: '50%',
                            bgcolor: colors.pink,
                            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                            '@keyframes pulse': {
                                '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                                '40%': { transform: 'scale(1)', opacity: 1 },
                            },
                        }} />
                    ))}
                </Box>

                <Button variant="contained" disabled sx={{
                    fontFamily: FONT,
                    borderRadius: '14px', textTransform: 'none', fontWeight: 700,
                    backgroundColor: `${colors.pink} !important`, color: 'white !important',
                    opacity: '0.8 !important', px: 3,
                }}>
                    <CircularProgress size={18} sx={{ color: 'white', mr: 1 }} />
                    Creating...
                </Button>
            </Box>


            {/* ============ INPUT ============ */}
            <SectionLabel label="Text Input" />
            <Box sx={{ px: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Name your adventure..."
                    variant="outlined"
                    inputProps={{ style: { fontFamily: FONT } }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            bgcolor: 'white',
                            '& fieldset': { borderColor: '#E5E7EB', borderWidth: 2 },
                            '&:hover fieldset': { borderColor: colors.pinkLight },
                            '&.Mui-focused fieldset': { borderColor: colors.pink },
                        },
                    }}
                />
            </Box>


            {/* ============ MODAL ============ */}
            <SectionLabel label="Modal" />
            <Box sx={{ px: 2 }}>
                <Button variant="contained" onClick={() => setShowModal(true)} sx={{
                    fontFamily: FONT,
                    borderRadius: '14px', textTransform: 'none', fontWeight: 700, px: 3,
                    backgroundColor: `${colors.pink} !important`,
                    boxShadow: '0 4px 14px rgba(255, 46, 91, 0.35)',
                }}>
                    Open Sample Modal
                </Button>
            </Box>

            <Dialog
                open={showModal}
                onClose={() => setShowModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '28px', overflow: 'hidden' } }}
            >
                <Box sx={{
                    background: `linear-gradient(135deg, ${colors.pink} 0%, ${colors.pinkLight} 100%)`,
                    py: 4, px: 3, textAlign: 'center', position: 'relative',
                }}>
                    <IconButton
                        onClick={() => setShowModal(false)}
                        sx={{ position: 'absolute', top: 12, right: 12, color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <EmojiEventsIcon sx={{ fontSize: '3rem', color: colors.yellow, mb: 1 }} />
                    <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.6rem', color: 'white', mb: 1 }}>
                        Congratulations!
                    </Typography>
                    <Typography sx={{ fontFamily: FONT, color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                        You found all the treasures!
                    </Typography>
                </Box>
                <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
                    <Typography sx={{ fontFamily: FONT, color: colors.textSoft, mb: 3, fontSize: '0.95rem' }}>
                        You completed the trail in 12 minutes. Share your achievement!
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                        <Button variant="contained" sx={{
                            fontFamily: FONT,
                            borderRadius: '14px', textTransform: 'none', fontWeight: 700, px: 4,
                            backgroundColor: `${colors.pink} !important`,
                            boxShadow: '0 4px 14px rgba(255, 46, 91, 0.35)',
                        }}>
                            Share
                        </Button>
                        <Button variant="outlined" onClick={() => setShowModal(false)} sx={{
                            fontFamily: FONT,
                            borderRadius: '14px', textTransform: 'none', fontWeight: 600, px: 4,
                            borderColor: colors.pink, color: colors.pink, borderWidth: 2,
                            '&:hover': { borderWidth: 2 },
                        }}>
                            Done
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>


            {/* ============ BOTTOM NAV ============ */}
            <SectionLabel label="Bottom Nav — Floating Create" />
            <Box sx={{ px: 2 }}>
                <Paper sx={{
                    borderRadius: '28px', overflow: 'visible',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                    p: 1, position: 'relative',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', py: 0.5 }}>
                        <IconButton sx={{ color: colors.pink, '&:hover': { bgcolor: colors.pinkSoft } }}>
                            <HomeRoundedIcon sx={{ fontSize: 28 }} />
                        </IconButton>

                        <Box sx={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${colors.pink} 0%, ${colors.pinkLight} 100%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 20px rgba(255, 46, 91, 0.4)',
                            transform: 'translateY(-12px)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-14px)' },
                        }}>
                            <AddCircleIcon sx={{ color: 'white', fontSize: 30 }} />
                        </Box>

                        <IconButton sx={{ color: colors.textMuted, '&:hover': { bgcolor: '#F3F4F6' } }}>
                            <PersonRoundedIcon sx={{ fontSize: 28 }} />
                        </IconButton>
                    </Box>
                </Paper>
            </Box>

        </Box>
    );
}


// ============ HELPER COMPONENTS ============

function SectionLabel({ label }: { label: string }) {
    return (
        <Typography sx={{
            px: 2, pt: 3, pb: 1.5,
            fontWeight: 800, fontSize: '0.7rem',
            color: colors.textMuted, letterSpacing: '1.5px',
            textTransform: 'uppercase',
        }}>
            {label}
        </Typography>
    );
}

function FeaturedCardDemo({ font }: { font: string }) {
    return (
        <Card sx={{
            borderRadius: '24px', overflow: 'hidden', position: 'relative',
            minHeight: 200, cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            '&:hover img': { transform: 'scale(1.05)' },
        }}>
            <CardMedia
                component="img"
                image="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80"
                alt="Forest Adventure"
                sx={{
                    position: 'absolute', inset: 0, height: '100%',
                    objectFit: 'cover', transition: 'transform 0.6s ease',
                }}
            />
            <Box sx={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
            }} />
            <Box sx={{ position: 'absolute', top: 14, left: 14, zIndex: 2, display: 'flex', gap: 0.8 }}>
                <Chip
                    icon={<StarIcon sx={{ color: '#F59E0B !important', fontSize: 14 }} />}
                    label="Featured"
                    size="small"
                    sx={{ fontFamily: font, bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '0.7rem' }}
                />
                <Chip label="Free" size="small" sx={{ fontFamily: font, bgcolor: colors.green, color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
            </Box>
            <CardContent sx={{
                position: 'relative', zIndex: 1, minHeight: 200,
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 2.5,
            }}>
                <Typography sx={{ fontFamily: font, fontWeight: 800, fontSize: '1.4rem', color: 'white', lineHeight: 1.2, mb: 0.3 }}>
                    Forest Mystery Trail
                </Typography>
                <Typography sx={{ fontFamily: font, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', mb: 1.5 }}>
                    Explore the enchanted forest and find all hidden treasures
                </Typography>
                <Button variant="contained" size="small" startIcon={<PlayArrowRoundedIcon />} sx={{
                    fontFamily: font,
                    borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                    backgroundColor: `${colors.pink} !important`,
                    boxShadow: '0 4px 14px rgba(255, 46, 91, 0.4)',
                    width: 'fit-content', px: 2.5,
                }}>
                    Play
                </Button>
            </CardContent>
        </Card>
    );
}

function GameCard({ title, image, tag, tagColor, distance, font }: {
    title: string; image: string; tag: string; tagColor: string; distance: string; font: string;
}) {
    return (
        <Card sx={{
            borderRadius: '20px', overflow: 'hidden', position: 'relative',
            flex: 1, aspectRatio: '1/1', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            '&:hover img': { transform: 'scale(1.05)' },
        }}>
            <CardMedia
                component="img"
                image={image}
                alt={title}
                sx={{
                    position: 'absolute', inset: 0, height: '100%',
                    objectFit: 'cover', transition: 'transform 0.5s ease',
                }}
            />
            <Box sx={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
            }} />
            <Chip
                label={tag}
                size="small"
                sx={{
                    fontFamily: font,
                    position: 'absolute', top: 10, left: 10, zIndex: 2,
                    bgcolor: tagColor, color: 'white', fontWeight: 700,
                    fontSize: '0.65rem',
                }}
            />
            <CardContent sx={{
                position: 'relative', zIndex: 1, height: '100%',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 2,
            }}>
                <Typography sx={{ fontFamily: font, fontWeight: 700, color: 'white', fontSize: '1rem', lineHeight: 1.2 }}>
                    {title}
                </Typography>
                <Typography sx={{ fontFamily: font, color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', mt: 0.3 }}>
                    {distance}
                </Typography>
            </CardContent>
        </Card>
    );
}
