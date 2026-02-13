# Authentication & Authorization System

## Architecture Overview

This document outlines the authentication and authorization system for Twimp v2.0, designed to encourage user registration whilst maintaining guest access.

### Access Model

#### **ANONYMOUS USERS can:**
- Browse all public games
- Play any game
- Create a game locally (kept in session/localStorage, not persistent)

#### **LOGGED-IN USERS can:**
- Everything above, plus:
- **Save games** (requires login)
- **Publish/share games** (requires login, protects feed from spam/bots)
- View their profile & saved games
- Edit/delete their own games

### Technology Stack

- **Frontend**: Next.js with NextAuth.js (JWT-based sessions)
- **OAuth Providers**: Google OAuth 2.0 + Apple Sign In
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL

### Database Schema

#### `users` table
```sql
- id (UUID, Primary Key)
- email (TEXT, UNIQUE)
- name (TEXT)
- google_id (TEXT, UNIQUE)
- apple_id (TEXT, UNIQUE)
- provider (TEXT) -- 'google' or 'apple'
- avatar_url (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### `user_games` table
```sql
- id (UUID, Primary Key)
- creator_id (UUID, FK to users.id)
- name (TEXT)
- description (TEXT)
- ref (TEXT, UNIQUE) -- URL slug
- game_type (TEXT) -- 'trail', 'custom', etc.
- image_url (TEXT)
- is_published (BOOLEAN) -- Controls visibility
- is_public (BOOLEAN) -- Can be shared
- latitude, longitude (DECIMAL)
- config (JSONB) -- Game-specific config
- created_at, updated_at (TIMESTAMPTZ)
```

### Authentication Flow

1. **User lands on site** → Can browse & play games anonymously
2. **User tries to save/publish a game** → Show `LoginRequiredModal`
3. **User clicks Google/Apple** → Redirected to OAuth provider
4. **OAuth callback** → NextAuth creates JWT session
5. **Backend `signIn` event** → Creates user record in `users` table
6. **Session persists** → JWT token stored in httpOnly cookie

### Environment Variables Required

**Frontend (.env.local):**
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
NEXT_PUBLIC_APPLE_CLIENT_ID=<apple-client-id>
APPLE_CLIENT_SECRET=<apple-client-secret>
BACKEND_URL=http://localhost:3001
```

**Backend (.env):**
```
SUPABASE_URL=<supabase-url>
SUPABASE_ANON_KEY=<supabase-key>
```

### API Endpoints

#### User Management

**POST /api/users**
- Create new user (called from NextAuth signIn event)
- Body: `{ email, name, avatar_url, provider, provider_id }`
- Returns: User record

**GET /api/users?email=**
- Fetch user by email
- Returns: User record

**PUT /api/users**
- Update user profile (name, avatar, etc.)
- Body: `{ email, name }`
- Returns: Updated user record

**GET /api/users/:id/games**
- List all games created by user
- Returns: Array of user_games

#### Game Management

**POST /api/games**
- Create/save game (requires login)
- Body: `{ name, description, config, ...}`
- Returns: Game record with `is_published=false`

**PUT /api/games/:id**
- Update game (only by creator)
- Body: `{ name, description, config, ...}`
- Returns: Updated game record

**PATCH /api/games/:id/publish**
- Publish game (make visible to others)
- Returns: Updated game with `is_published=true`

**DELETE /api/games/:id**
- Delete game (only by creator & not published)
- Returns: 204 No Content

### Frontend Components

#### `LoginRequiredModal`
Shows when user tries to save/share without auth.
- Props: `open`, `onClose`, `action` ('save', 'share', 'publish')
- Provides Google & Apple sign-in buttons

#### Auth Context (`useAuth`)
Provides auth state & methods to all components.
```typescript
{
  isAuthenticated: boolean,
  user: { id, email, name, image },
  isLoading: boolean,
  signIn: (provider) => Promise<void>,
  signOut: () => Promise<void>
}
```

### Usage Examples

#### Check if user is logged in:
```typescript
const { isAuthenticated } = useAuth();

if (!isAuthenticated) {
  // Show login modal
}
```

#### Save a game (with login gate):
```typescript
const { isAuthenticated, user } = useAuth();
const [showLoginModal, setShowLoginModal] = useState(false);

const handleSaveGame = () => {
  if (!isAuthenticated) {
    setShowLoginModal(true);
    return;
  }
  
  // Proceed with save
  const response = await fetch('/api/games', {
    method: 'POST',
    body: JSON.stringify({ name, config })
  });
};
```

### Security Considerations

1. **JWT Tokens**: Stored in httpOnly cookies (secure by default)
2. **CORS**: Configured to allow only twimp.app domains
3. **Rate Limiting**: Implement on OAuth endpoints to prevent spam
4. **User Isolation**: RLS policies ensure users can only access their own data
5. **Provider Verification**: OAuth tokens verified before creating users

### Next Steps

1. Set up OAuth credentials in Google Cloud Console & Apple Developer
2. Deploy backend endpoints to Vercel
3. Create game creation/editing UI with login gates
4. Implement user games dashboard
5. Add rate limiting & spam detection
6. Set up production environment variables
