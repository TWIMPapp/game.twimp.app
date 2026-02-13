import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirect to the account page which handles sign-in
export default function SignIn() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/user/who');
    }, [router]);

    return null;
}
