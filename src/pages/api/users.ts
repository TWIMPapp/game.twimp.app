import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, image, provider, proverId } = req.body;

    if (!email || !provider) {
      return res.status(400).json({ error: 'Email and provider are required' });
    }

    // Call backend API to save user
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        avatar_url: image,
        provider,
        provider_id: proverId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save user to database');
    }

    const userData = await response.json();
    return res.status(201).json(userData);
  } catch (error) {
    console.error('User creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
