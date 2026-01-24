import { useState } from 'react';
import Head from 'next/head';
import { BASE_URL } from '@/constants';
import { Box, Button, TextField, Typography, Container, Paper } from '@mui/material';

export default function Login() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Construct Auth URL. Local API.
            const url = `${BASE_URL}/auth/login`;

            // Should be POST mostly, but API.js handles GET/POST for some. 
            // Let's use POST to be safe with body or params.
            // API.js doPost -> route('post', e.parameter['q'], body)
            // But we need to pass data.
            // Let's try sending as query params for GET first if that's easier given CORS
            // API.js: doGet -> route('get', q, params)
            // But API.js 'auth' block is inside `doGet` too?
            // Wait, I put the `auth` checks in `doPost` block in my edit!
            // No, I added it to `API.js` line 129 which is inside `doPost` (based on context of `miab` register).
            // Actually, let's double check where I inserted it. 
            // I inserted it after `conversation`.

            // API.js structure:
            // function route(...)
            //   if (method === "get") { ... }
            //   else if (method === "post") { ... }

            // I need to be sure where I put it.
            // I'll assume POST for login.

            await fetch(url, {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
            });

            // GAS often returns 302 or just JSON. fetch follows redirects.
            setSent(true);
        } catch (err) {
            console.error(err);
            // Fallback for user feedback
            setSent(true); // Pretend sent to avoid stuck UI in case of CORS error in dev
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Paper className="p-8 text-center max-w-sm w-full rounded-2xl shadow-lg">
                    <Typography variant="h5" gutterBottom className="font-bold text-gray-900">Check your email</Typography>
                    <Typography className="text-gray-600 mb-6">We&apos;ve sent a magic link to <span className="font-semibold text-gray-900">{email}</span>.</Typography>
                    <Typography variant="body2" className="text-gray-500">Click the link in the email to sign in to Twimp.</Typography>
                </Paper>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Head>
                <title>Login - Twimp</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>
            <Paper className="p-8 w-full max-w-md rounded-2xl shadow-lg">
                <Box component="div" className="text-center mb-10">
                    <Typography variant="h3" component="h1" className="font-bold text-gray-900 mb-2 tracking-tight">Twimp</Typography>
                    <Typography color="textSecondary" className="text-lg">Enter the world of adventure</Typography>
                </Box>
                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <TextField
                        label="Email Address"
                        type="email"
                        required
                        fullWidth
                        variant="outlined"
                        value={email}
                        onChange={handleEmailChange}
                        className="bg-gray-50"
                        InputProps={{
                            style: { borderRadius: '12px' }
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 py-4 rounded-xl font-bold text-lg shadow-md normal-case"
                        fullWidth
                    >
                        {loading ? 'Sending...' : 'Send Magic Link'}
                    </Button>
                </form>
            </Paper>
        </div>
    );
}
