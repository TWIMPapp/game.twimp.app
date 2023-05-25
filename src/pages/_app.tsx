import Loading from '@/components/Loading';
import '@/styles/globals.scss';
import { QueryParams } from '@/types/queryParams';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';

import { Press_Start_2P, MedievalSharp, Creepster } from 'next/font/google';

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
