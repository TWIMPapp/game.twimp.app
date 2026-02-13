// Account page - user profile and authentication
import {
  Box, Button, Container, Typography, TextField, Divider,
  CircularProgress, Tabs, Tab, Chip, Card, CardContent,
  CardActionArea, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, LinearProgress
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import { CustomTrailAPI } from '@/services/API/CustomTrailAPI';

const MAX_GAMES = 5;

interface TrailSummary {
  id: string;
  name: string;
  theme: string;
  pinCount: number;
  mode: string;
  competitive: boolean;
  playCount: number;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

const Account = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Tab state
  const initialTab = router.query.tab === 'games' ? 1 : 0;
  const [tab, setTab] = useState(initialTab);

  // My Games state
  const [trails, setTrails] = useState<TrailSummary[]>([]);
  const [totalTrails, setTotalTrails] = useState(0);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stopConfirmId, setStopConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user]);

  // Update tab when query param changes
  useEffect(() => {
    if (router.query.tab === 'games') setTab(1);
  }, [router.query.tab]);

  const loadGames = useCallback(async () => {
    const creatorId = localStorage.getItem('twimp_user_id');
    if (!creatorId) return;

    setGamesLoading(true);
    try {
      const result = await CustomTrailAPI.getTrailsByCreator(creatorId);
      if (result.ok) {
        setTrails(result.trails || []);
        setTotalTrails(result.totalTrails || 0);
      }
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setGamesLoading(false);
    }
  }, []);

  // Load games when switching to games tab
  useEffect(() => {
    if (tab === 1) loadGames();
  }, [tab, loadGames]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    router.replace(
      { pathname: router.pathname, query: newValue === 1 ? { tab: 'games' } : {} },
      undefined,
      { shallow: true }
    );
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn('google');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await (signIn as any)('facebook');
    } catch (error) {
      console.error('Facebook login failed:', error);
    }
  };

  const handleSaveName = async () => {
    if (!userName.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName }),
      });

      if (response.ok) {
        console.log('Name saved successfully');
      }
    } catch (error) {
      console.error('Failed to save name:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleStopTrail = async (trailId: string) => {
    const creatorId = localStorage.getItem('twimp_user_id');
    if (!creatorId) return;

    setActionLoading(trailId);
    setStopConfirmId(null);
    try {
      await CustomTrailAPI.stopTrail(trailId, creatorId);
      await loadGames();
    } catch (err) {
      console.error('Failed to stop trail:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartTrail = async (trailId: string) => {
    const creatorId = localStorage.getItem('twimp_user_id');
    if (!creatorId) return;

    setActionLoading(trailId);
    try {
      const result = await CustomTrailAPI.startTrail(trailId, creatorId);
      if (!result.ok) {
        alert(result.message || 'Failed to start trail');
      }
      await loadGames();
    } catch (err: any) {
      const msg = err.response?.data?.body?.message || err.response?.data?.message || 'Failed to start trail';
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const isExpired = (trail: TrailSummary) => new Date(trail.expiresAt).getTime() < Date.now();

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 bg-twimp-bg flex items-center justify-center">
        <CircularProgress sx={{ color: '#FF2E5B' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-twimp-bg">
      <PageHeader showCreate onCreateClick={() => router.push('/custom-trail/create')} />
      <Container maxWidth="lg" className="px-4">
        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{
            mb: 3,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' },
            '& .Mui-selected': { color: '#FF2E5B' },
            '& .MuiTabs-indicator': { backgroundColor: '#FF2E5B' }
          }}
        >
          <Tab label="My Profile" />
          <Tab label="My Games" />
        </Tabs>

        {/* ===== My Profile Tab ===== */}
        {tab === 0 && (
          <>
            {!isAuthenticated ? (
              <Box>
                <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                  Create an Account
                </Typography>
                <Typography variant="body2" className="text-gray-600 mb-6">
                  Save your games and keep your progress across devices. Sign in with your Google or Facebook account.
                </Typography>

                <Box className="flex flex-col gap-4 mb-8">
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleGoogleLogin}
                    sx={{
                      backgroundColor: 'white !important',
                      color: '#1f2937',
                      border: '1px solid #e5e7eb',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      py: 1.5,
                      '&:hover': { backgroundColor: '#f3f4f6 !important' }
                    }}
                  >
                    Continue with Google
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleFacebookLogin}
                    sx={{
                      backgroundColor: '#1877F2 !important',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      py: 1.5,
                      '&:hover': { backgroundColor: '#0a66c2 !important' }
                    }}
                  >
                    Continue with Facebook
                  </Button>
                </Box>

                <Divider sx={{ my: 4 }} />

                <Typography variant="body2" className="text-gray-500 text-center">
                  Browse and create games as a guest, or sign in to save your progress!
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" className="font-bold text-gray-800 mb-6">
                  Your Profile
                </Typography>

                <Box className="bg-white rounded-lg p-6 shadow-sm mb-6">
                  <Typography variant="body2" className="text-gray-600 mb-2">
                    Email
                  </Typography>
                  <Typography variant="body1" className="font-medium text-gray-800 mb-4">
                    {user?.email}
                  </Typography>

                  <Typography variant="body2" className="text-gray-600 mb-2">
                    Display Name
                  </Typography>
                  <TextField
                    fullWidth
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 3 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSaveName}
                    disabled={isSaving}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      backgroundColor: '#FF2E5B !important',
                      '&.Mui-disabled': { backgroundColor: '#ccc !important' },
                    }}
                  >
                    {isSaving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Save Name'}
                  </Button>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    borderRadius: '14px',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.2,
                    borderColor: '#FF2E5B',
                    color: '#FF2E5B',
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2, bgcolor: '#FFF0F3' },
                  }}
                >
                  Sign Out
                </Button>
              </Box>
            )}
          </>
        )}

        {/* ===== My Games Tab ===== */}
        {tab === 1 && (
          <Box>
            {/* Game counter */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 600, color: '#374151' }}>
                  {totalTrails} / {MAX_GAMES} games
                </Typography>
                {totalTrails >= MAX_GAMES && (
                  <Chip label="Limit reached" size="small" sx={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 600 }} />
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={(totalTrails / MAX_GAMES) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: totalTrails >= MAX_GAMES ? '#dc2626' : '#FF2E5B'
                  }
                }}
              />
            </Box>

            {/* Create button */}
            <Tooltip title={totalTrails >= MAX_GAMES ? `You've reached the maximum of ${MAX_GAMES} games` : ''}>
              <span>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={totalTrails >= MAX_GAMES}
                  onClick={() => router.push('/custom-trail/create')}
                  sx={{
                    mb: 3,
                    py: 1.5,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    backgroundColor: '#FF2E5B !important',
                    '&.Mui-disabled': { backgroundColor: '#f3f4f6 !important', color: '#9ca3af' }
                  }}
                >
                  Create New Game
                </Button>
              </span>
            </Tooltip>

            {/* Loading state */}
            {gamesLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#FF2E5B' }} />
              </Box>
            )}

            {/* Empty state */}
            {!gamesLoading && trails.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>
                  🗺️
                </Typography>
                <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>
                  You haven&apos;t created any games yet
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  Tap &quot;Create New Game&quot; to get started!
                </Typography>
              </Box>
            )}

            {/* Trail list */}
            {!gamesLoading && trails.map((trail) => {
              const expired = isExpired(trail);
              const loading = actionLoading === trail.id;

              return (
                <Card
                  key={trail.id}
                  sx={{
                    mb: 2,
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    boxShadow: 'none',
                    opacity: expired ? 0.6 : 1
                  }}
                >
                  <CardActionArea
                    onClick={() => router.push(`/custom-trail/status?id=${trail.id}`)}
                    sx={{ p: 0 }}
                  >
                    <CardContent sx={{ pb: '12px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>
                          {trail.name || `Trail ${trail.id}`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {expired ? (
                            <Chip label="Expired" size="small" sx={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontWeight: 600, fontSize: '0.7rem' }} />
                          ) : trail.isActive ? (
                            <Chip label="Active" size="small" sx={{ backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 600, fontSize: '0.7rem' }} />
                          ) : (
                            <Chip label="Stopped" size="small" sx={{ backgroundColor: '#fef3c7', color: '#d97706', fontWeight: 600, fontSize: '0.7rem' }} />
                          )}
                          {trail.competitive && (
                            <Chip label="Competitive" size="small" sx={{ backgroundColor: '#ede9fe', color: '#7c3aed', fontWeight: 600, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          {trail.pinCount} pins
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          {trail.playCount} player{trail.playCount !== 1 ? 's' : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          {trail.mode}
                        </Typography>
                      </Box>

                      {/* Start/Stop button */}
                      <Box
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        sx={{ display: 'flex', justifyContent: 'flex-end' }}
                      >
                        {!expired && trail.isActive && (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={loading}
                            onClick={(e) => { e.preventDefault(); setStopConfirmId(trail.id); }}
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              color: '#dc2626',
                              borderColor: '#fca5a5',
                              '&:hover': { backgroundColor: '#fef2f2', borderColor: '#dc2626' }
                            }}
                          >
                            {loading ? <CircularProgress size={16} /> : 'Stop'}
                          </Button>
                        )}
                        {!expired && !trail.isActive && (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={loading}
                            onClick={(e) => { e.preventDefault(); handleStartTrail(trail.id); }}
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              color: '#16a34a',
                              borderColor: '#86efac',
                              '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#16a34a' }
                            }}
                          >
                            {loading ? <CircularProgress size={16} /> : 'Start'}
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>
      <BottomNav onCreateClick={() => router.push('/custom-trail/create')} />

      {/* Stop confirmation dialog */}
      <Dialog
        open={!!stopConfirmId}
        onClose={() => setStopConfirmId(null)}
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Stop this game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Players will no longer be able to play this game. You can restart it later.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setStopConfirmId(null)}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => stopConfirmId && handleStopTrail(stopConfirmId)}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: '#dc2626',
              '&:hover': { backgroundColor: '#b91c1c' }
            }}
          >
            Stop Game
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Account;
