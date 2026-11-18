import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { Game } from '@/types';
import { PartnerPill, visiblePartner } from '@/components/PartnerPill';

// Shared text layout for the full-width home cards (TrailCard and FeaturedCard).
//
//   ┌──────────────────────────────────────┐
//   │ [partner logo / "with X"]   [0.4 mi] │  top row: partner left (non-Twimp only), distance right
//   │                                      │
//   │ [label slot: empty for now]          │  optional, e.g. a price later
//   │ Trail title that can wrap across the │  title spans the full width at the bottom
//   │ whole card                           │
//   └──────────────────────────────────────┘
//
// Top row: the pill sits in a flex: 1 / minWidth 0 box, so a wide pill shrinks
// (text truncates with an ellipsis, a logo scales down) instead of running into
// the badge, which never shrinks. Whenever the top row has anything in it, the
// bottom text block reserves top padding, so a very long title makes the card
// taller instead of climbing into the top corners.

// Top row: 12px inset + up to ~44px tall (32px logo + padding) + 12px gap.
const TOP_ROW_CLEARANCE = 68;

interface CardOverlayProps {
    game: Game;
    /**
     * Optional small label above the title (bottom-left), e.g. a price later.
     * No card passes one yet; when empty the slot takes no space.
     */
    label?: ReactNode;
    /** Distance badge text (e.g. "0.4 mi"); omit for none. */
    distance?: string | null;
    titleVariant?: 'h5' | 'h6';
    titleSize?: string;
    padding?: number;
}

export function CardOverlay({ game, label, distance, titleVariant = 'h6', titleSize = '1.3rem', padding = 2.5 }: CardOverlayProps) {
    const hasPartner = !!visiblePartner(game.partner);
    const hasTopRow = hasPartner || !!distance;
    return (
        <>
            {hasTopRow && (
                <Box
                    data-slot="card-top-row"
                    sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        right: 12,
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        pointerEvents: 'none',
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
                        <PartnerPill partner={game.partner} size="md" />
                    </Box>
                    {distance && (
                        <Typography
                            data-testid="card-distance"
                            variant="caption"
                            sx={{
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                color: 'white',
                                fontWeight: 600,
                                lineHeight: 1.5,
                                backgroundColor: 'rgba(0,0,0,0.45)',
                                px: 1.25,
                                py: 0.5,
                                borderRadius: '999px',
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            {distance}
                        </Typography>
                    )}
                </Box>
            )}
            <Box
                data-testid="card-text"
                sx={{
                    position: 'relative',
                    zIndex: 10,
                    mt: 'auto',
                    p: padding,
                    pt: hasTopRow ? `${TOP_ROW_CLEARANCE}px` : padding,
                    color: 'white',
                }}
            >
                <Box
                    data-slot="card-label"
                    sx={{
                        opacity: 0.9,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        fontSize: '11px',
                        lineHeight: 1.4,
                        mb: 0.5,
                        overflowWrap: 'anywhere',
                        // Empty slot: no height, no margin, so the title sits at the bottom.
                        '&:empty': { display: 'none' },
                    }}
                >
                    {label}
                </Box>
                <Typography
                    data-testid="card-title"
                    variant={titleVariant}
                    component="h3"
                    sx={{ fontFamily: "'Noto Sans', sans-serif", fontWeight: 800, fontSize: titleSize, lineHeight: 1.2, overflowWrap: 'anywhere' }}
                >
                    {game.name}
                </Typography>
            </Box>
        </>
    );
}
