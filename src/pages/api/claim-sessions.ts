import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

// Verifies the caller's NextAuth session here, then forwards the verified
// email (never one from the browser) to the API with a shared secret.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) return res.status(401).json({ error: 'Not signed in' });

  const { anon_id } = req.body || {};
  if (!anon_id || typeof anon_id !== 'string') return res.status(400).json({ error: 'anon_id required' });

  const secret = process.env.CLAIM_SESSIONS_SECRET;
  if (!secret) return res.status(503).json({ error: 'Claiming not configured' });

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const r = await fetch(`${backendUrl}/api/claim-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-twimp-internal-secret': secret },
      body: JSON.stringify({ email, anon_id }),
    });
    const data = await r.json().catch(() => ({}));
    return res.status(r.status).json(data);
  } catch (e) {
    console.error('[claim-sessions] forward failed', e);
    return res.status(502).json({ error: 'Upstream failed' });
  }
}
