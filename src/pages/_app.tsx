import Loading from '@/components/Loading';
import '@/styles/globals.scss';
import { QueryParams } from '@/types/queryParams';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';

import { Press_Start_2P, MedievalSharp, Creepster } from 'next/font/google';
import Script from 'next/script';

const GTM_ID = 'GTM-PJT9V98';

const family = Press_Start_2P({
  subsets: ['cyrillic'],
  display: 'swap',
  weight: '400'
});

const rpg = MedievalSharp({
  subsets: ['latin'],
  display: 'swap',
  weight: '400'
});

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
      {params ? (
        <main id="game" className={`theme-${params.theme}`}>
          <Component {...pageProps} />
        </main>
      ) : (
        <Loading />
      )}
    </>
  );
}
