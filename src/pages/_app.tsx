import Loading from '../components/Loading';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
// import { Press_Start_2P, MedievalSharp } from 'next/font/google';
import Script from 'next/script';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import QueryParams from '@/typings/QueryParams';
import MainTabs from '@/components/MainTabs';

import '@/styles/globals.scss';

const GTM_ID = 'GTM-PJT9V98';

// const family = Press_Start_2P({
//   subsets: ['cyrillic'],
//   display: 'swap',
//   weight: '400'
// });

// const rpg = MedievalSharp({
//   subsets: ['latin'],
//   display: 'swap',
//   weight: '400'
// });

export const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6c88'
    },
    secondary: {
      main: '#59a7a7'
    }
  }
});

const isTaskPath =
  typeof window !== 'undefined' ? window?.location?.pathname.includes('/task') : false;

export default function App({ Component, pageProps }: AppProps) {
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
    <>
      {/* <style jsx global>{`
        #game.theme-family {
          font-family: ${family.style.fontFamily};
        }

        #game.theme-rpg {
          font-family: ${rpg.style.fontFamily};
        }
      `}</style> */}
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}
      </Script>
      <Script id="crisp" strategy="afterInteractive">
        {`window.$crisp=[];window.CRISP_WEBSITE_ID="8660295b-581a-4dc3-ba91-24c10dc89ab9";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}
      </Script>
      {params ? (
        <>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
            ></meta>
          </Head>
          <ThemeProvider theme={theme}>
            <main className={`game theme-${params.theme}`}>
              <MainTabs hidden={!isTaskPath}>
                <Component {...pageProps} />
              </MainTabs>
            </main>
          </ThemeProvider>
        </>
      ) : (
        <Loading />
      )}
    </>
  );
}
