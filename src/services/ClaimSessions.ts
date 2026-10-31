// Remembers the anonymous player id across a sign-in redirect, then asks the
// server to move that id's game sessions onto the signed-in account.
const PENDING_KEY = 'twimp_pending_claim_id';
const CONSENT_KEY = 'twimp_pending_marketing_consent_at';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function rememberPendingClaim(id?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  const anon = id ?? localStorage.getItem('twimp_user_id');
  if (!anon || !UUID_RE.test(anon)) return null;
  localStorage.setItem(PENDING_KEY, anon);
  return anon;
}

export function getPendingClaim(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PENDING_KEY);
}

/** Opt-in marketing consent: store the time it was given, or clear it. */
export function setPendingConsent(at: string | null): void {
  if (typeof window === 'undefined') return;
  if (at && !isNaN(Date.parse(at))) localStorage.setItem(CONSENT_KEY, new Date(at).toISOString());
  else localStorage.removeItem(CONSENT_KEY);
}

export function getPendingConsent(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CONSENT_KEY);
}

export async function runPendingClaim(): Promise<void> {
  const anon = getPendingClaim();
  if (!anon) return;
  try {
    const res = await fetch('/api/claim-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anon_id: anon, ...(getPendingConsent() ? { marketing_consent_at: getPendingConsent() } : {}) }),
    });
    // 2xx = done; 4xx = will never succeed (e.g. id owned by someone else). Either way stop retrying.
    if (res.status < 500) {
      localStorage.removeItem(PENDING_KEY);
      localStorage.removeItem(CONSENT_KEY);
    }
  } catch {
    // Network error: keep it and try again next load.
  }
}
