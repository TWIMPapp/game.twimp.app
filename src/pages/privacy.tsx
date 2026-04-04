import { Box, Typography } from '@mui/material';
import PageHeader from '@/components/PageHeader';

const FONT = "'Poppins', sans-serif";

export default function Privacy() {
    return (
        <Box className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12">
            <PageHeader compact />

            <Box sx={{ maxWidth: 640, mx: 'auto', px: 3, py: 4 }}>
                <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.5rem', mb: 1 }}>
                    Privacy Policy
                </Typography>
                <Typography sx={{ fontFamily: FONT, fontSize: '0.85rem', color: '#6b7280', mb: 4 }}>
                    Last updated: April 2026
                </Typography>

                <Section title="Who we are">
                    Twimp is operated by Ethoss Ltd. If you have any questions about how we handle your data,
                    you can contact us at hello@twimp.app.
                </Section>

                <Section title="What we collect">
                    <BulletList items={[
                        'Your name, email address and profile picture — only if you choose to sign in with Google or Facebook. You can play without signing in.',
                        'Your location — while you are actively playing a game. We use GPS to check whether you have reached a pin or egg on the map. We do not track your location in the background or when the app is closed.',
                        'A random identifier stored on your device — this lets us save your game progress between visits without requiring you to create an account.',
                        'Messages you send via the Help form — along with your game session data so we can investigate issues.',
                    ]} />
                </Section>

                <Section title="What we do NOT collect">
                    <BulletList items={[
                        'We do not collect payment information. Twimp is free.',
                        'We do not collect data from children. Games are designed to be played by families together, with a parent or guardian present.',
                        'We do not use tracking cookies or third-party advertising.',
                    ]} />
                </Section>

                <Section title="How we use your data">
                    <BulletList items={[
                        'To save your game progress so you can continue on the same or a different device.',
                        'To check your location during gameplay so the game knows when you have found an egg or reached a pin.',
                        'To respond to help requests.',
                    ]} />
                </Section>

                <Section title="Who we share it with">
                    We do not sell, rent or share your personal data with anyone. Your data is stored securely
                    using industry-standard cloud infrastructure for hosting and database services. Any third-party
                    services we use process data on our behalf and do not use it for their own purposes.
                </Section>

                <Section title="How long we keep it">
                    Game sessions expire automatically after 90 days of inactivity. If you sign in with Google
                    or Facebook, your account information is kept until you ask us to delete it. You can request
                    deletion at any time by emailing hello@twimp.app.
                </Section>

                <Section title="Your rights">
                    You can ask us to show you what data we hold about you, correct it, or delete it entirely.
                    Just email hello@twimp.app and we will respond as quickly as we can.
                </Section>

                <Section title="Changes to this policy">
                    If we make significant changes, we will update this page. We will not reduce your rights
                    without giving you notice.
                </Section>
            </Box>
        </Box>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                {title}
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.7 }}>
                {children}
            </Typography>
        </Box>
    );
}

function BulletList({ items }: { items: string[] }) {
    return (
        <Box component="ul" sx={{ pl: 2.5, mt: 0.5, mb: 0 }}>
            {items.map((item, i) => (
                <Box component="li" key={i} sx={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.7, mb: 0.5 }}>
                    {item}
                </Box>
            ))}
        </Box>
    );
}
