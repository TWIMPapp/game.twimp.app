import Loading from '../components/Loading';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/AuthContext';
import QueryParams from '@/typings/QueryParams';

import '@/styles/globals.scss';

const GTM_ID = 'GTM-PJT9V98';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#FF2E5B'
    },
    secondary: {
      main: '#2DB87A'
    }
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
});

const isTaskPath =
  typeof window !== 'undefined' ? window?.location?.pathname.includes('/task') : false;

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const [params, setParams] = useState<QueryParams>();

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      setParams(_params);
    };

    fetchData();
  }, []);

  return (
    <SessionProvider session={session}>
      <AuthProvider>
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
          </Script>
          {params ? (
            <>
              <Head>
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
                ></meta>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
              </Head>
              <ThemeProvider theme={theme}>
                <main className={`game`}>
                  <Component {...pageProps} />
                </main>
              </ThemeProvider>
            </>
          ) : (
            <Loading />
          )}
        </>
      </AuthProvider>
    </SessionProvider>
  );
}
