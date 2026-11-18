import { Box, Typography } from '@mui/material';
import { Game } from '@/types';
import { PartnerPill, visiblePartner } from '@/components/PartnerPill';

// Shared text layout for the full-width home cards (TrailCard and FeaturedCard).
//
//   ┌──────────────────────────────────────┐
//   │ [partner logo / "with X"]            │  top-left, only for non-Twimp partners
//   │                                      │
//   │ FREE ADVENTURE                       │  small label above the title
//   │ Trail title that can wrap   [0.4 mi] │  title bottom-left, distance bottom-right
//   └──────────────────────────────────────┘
//
// The title column is flex: 1 with minWidth 0, and the distance badge never
// shrinks, so long titles wrap inside their own column and can't run under the
// badge. When a partner pill is shown the text block reserves top padding, so a
// very tall title makes the card taller instead of sliding under the pill.

// Pill: 12px from the top + up to ~44px tall (32px logo + padding) + 12px gap.
const PILL_CLEARANCE = 68;

interface CardOverlayProps {
    game: Game;
    /** Status label above the title (e.g. "Free Adventure"); omit for none. */
    label?: string;
    /** Distance badge text (e.g. "0.4 mi"); omit for none. */
    distance?: string | null;
    titleVariant?: 'h5' | 'h6';
    titleSize?: string;
    padding?: number;
}

export function CardOverlay({ game, label, distance, titleVariant = 'h6', titleSize = '1.3rem', padding = 2.5 }: CardOverlayProps) {
    const hasPartner = !!visiblePartner(game.partner);
    return (
        <>
            <PartnerPill partner={game.partner} size="md" />
            <Box
                data-testid="card-text"
                sx={{
                    position: 'relative',
                    zIndex: 10,
                    mt: 'auto',
                    p: padding,
                    pt: hasPartner ? `${PILL_CLEARANCE}px` : padding,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 1.5,
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {label && (
                        <Typography
                            data-testid="card-label"
                            component="div"
                            sx={{ opacity: 0.9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '10px', lineHeight: 1.4, mb: 0.5 }}
                        >
                            {label}
                        </Typography>
                    )}
                    <Typography
                        data-testid="card-title"
                        variant={titleVariant}
                        component="h3"
                        sx={{ fontFamily: "'Noto Sans', sans-serif", fontWeight: 800, fontSize: titleSize, lineHeight: 1.2, overflowWrap: 'anywhere' }}
                    >
                        {game.name}
                    </Typography>
                </Box>
                {distance && (
                    <Typography
                        data-testid="card-distance"
                        variant="caption"
                        sx={{ flexShrink: 0, whiteSpace: 'nowrap', opacity: 0.9, fontWeight: 500, backgroundColor: 'rgba(255,255,255,0.2)', px: 1, py: 0.25, borderRadius: '999px', backdropFilter: 'blur(4px)', mb: '2px' }}
                    >
                        {distance}
                    </Typography>
                )}
            </Box>
        </>
    );
}
