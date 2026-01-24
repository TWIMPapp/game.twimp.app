import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Typography, Container } from '@mui/material';

export default function Verify() {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        const { token, email } = router.query;

        if (token && email) {
            // Ideally call API to verify token validity.
            // For MVP and speed, we trust the link arrival = auth.
            // We set the user session.

            localStorage.setItem('twimp_user_id', email as string);
            // Optionally store token if needed for API calls

            setTimeout(() => {
                router.push('/');
            }, 1000);
        } else {
            // invalid
            console.error("Missing token or email");
        }
    }, [router.isReady, router.query, router]);

    return (
        <Container className="h-screen flex items-center justify-center">
            <Typography variant="h5">Logging you in...</Typography>
        </Container>
    );
}
