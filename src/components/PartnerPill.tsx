import { useState } from 'react';
import { Box, Link, Typography } from '@mui/material';
import { GamePartner } from '@/types';

// Partner branding for externally sourced walks (partners table via /list).
//
// PartnerPill: small white pill for the top-left of a home card image.
//   - logo_url set and loads → the logo on a white pill (alt = partner name)
//   - otherwise               → text "with <name>" on the same pill
// PartnerCredit: "In partnership with [logo] Name" line for the intro screen,
//   linking to the partner's site when there is a url.

/**
 * The partner to show, or null. Twimp's own trails are not "partner" walks, so a
 * partner whose slug or name is 'twimp' (any case) counts as no partner.
 */
export function visiblePartner(partner?: GamePartner | null): GamePartner | null {
  if (!partner?.name || !partner.name.trim()) return null;
  const isTwimp = (v?: string | null) => (v || '').trim().toLowerCase() === 'twimp';
  if (isTwimp(partner.slug) || isTwimp(partner.name)) return null;
  return partner;
}

/** Logo image that reports a load failure so callers can fall back to text. */
function PartnerLogo({ partner, height, onError }: { partner: GamePartner; height: number; onError: () => void }) {
  return (
    <Box
      component="img"
      src={partner.logo_url || undefined}
      alt={partner.name}
      onError={onError}
      sx={{ display: 'block', height, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
    />
  );
}

export function PartnerPill({ partner: raw, size = 'sm' }: { partner?: GamePartner | null; size?: 'sm' | 'md' }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const partner = visiblePartner(raw);
  if (!partner) return null;
  const showLogo = !!partner.logo_url && !logoFailed;
  const logoHeight = size === 'md' ? 32 : 24;

  return (
    <Box
      data-testid="partner-pill"
      sx={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 20,
        maxWidth: 'calc(100% - 24px)',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: '999px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        px: 1.25,
        py: showLogo ? 0.5 : 0.4,
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {showLogo ? (
        <PartnerLogo partner={partner} height={logoHeight} onError={() => setLogoFailed(true)} />
      ) : (
        <Typography
          component="span"
          sx={{
            color: '#1f2937',
            fontWeight: 700,
            fontSize: size === 'md' ? '0.75rem' : '0.68rem',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          with {partner.name}
        </Typography>
      )}
    </Box>
  );
}

export function PartnerCredit({ partner: raw }: { partner?: GamePartner | null }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const partner = visiblePartner(raw);
  if (!partner) return null;
  const showLogo = !!partner.logo_url && !logoFailed;

  // Caption on its own line, then [logo] Name, so it never wraps mid-row on a phone.
  const inner = (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.75 }}>
        In partnership with
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        {showLogo && (
          <Box sx={{ flexShrink: 0, backgroundColor: '#fff', borderRadius: 1, px: 0.75, py: 0.5, border: '1px solid rgba(0,0,0,0.08)' }}>
            <PartnerLogo partner={partner} height={40} onError={() => setLogoFailed(true)} />
          </Box>
        )}
        <Typography component="span" variant="body1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
          {partner.name}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box data-testid="partner-credit" sx={{ mb: 2 }}>
      {partner.url ? (
        <Link href={partner.url} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </Box>
  );
}

/** Credits / attribution block shown at the end of the intro description. */
export function CreditsBlock({ credits }: { credits?: string | null }) {
  if (!credits || !credits.trim()) return null;
  return (
    <Box data-testid="credits-block" sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em' }}>
        Credits
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
        {credits.trim()}
      </Typography>
    </Box>
  );
}
