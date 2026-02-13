import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session to authenticate the user
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to create a game.' });
    }

    const { name, description } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Game name is required' });
    }

    if (name.trim().length < 3 || name.trim().length > 50) {
      return res.status(400).json({
        error: 'Game name must be between 3 and 50 characters',
      });
    }

    if (description && description.length > 500) {
      return res.status(400).json({
        error: 'Description must be less than 500 characters',
      });
    }

    // Call backend API to save game
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description?.trim() || '',
        creator_email: session.user.email,
        creator_id: (session.user as any).id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      throw new Error(
        errorData?.error || 'Failed to create game in database'
      );
    }

    const gameData = await response.json();
    return res.status(201).json(gameData);
  } catch (error) {
    console.error('Error creating game:', error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create game. Please try again.',
    });
  }
}
