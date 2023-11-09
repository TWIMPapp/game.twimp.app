import Loading from '../components/Loading';
import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import {
  useEffect,
  useState,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  JSXElementConstructor
} from 'react';
import { Press_Start_2P, MedievalSharp } from 'next/font/google';
import Script from 'next/script';
import Head from 'next/head';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import BackpackIcon from '@mui/icons-material/Backpack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MapIcon from '@mui/icons-material/Map';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Page } from '@/typings/Page.enum';
import QueryParams from '@/typings/QueryParams';

export const TabBarHeight = 88;

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

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6c88'
    }
  }
});

function samePageLinkNavigation(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 || // ignore everything but left-click
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return false;
  }
  return true;
}

interface LinkTabProps {
  icon?: ReactElement<any, string | JSXElementConstructor<any>>;
  label?: string;
  href?: string;
}

function LinkTab(props: LinkTabProps) {
  return <Tab component="a" icon={props.icon} aria-label={props.label} {...props} />;
}

const PageMap = {
  [Page.InventoryTab]: 0,
  [Page.MapTab]: 2
};

export default function App({ Component, pageProps }: AppProps) {
  const [params, setParams] = useState<QueryParams>();
  const [activeTab, setActiveTab] = useState(
    Component.displayName && (PageMap as any)[Component.displayName] > -1
      ? (PageMap as any)[Component.displayName]
      : 1
  );

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      setParams(_params);
    };

    fetchData();
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    // event.type can be equal to focus with selectionFollowsFocus.
    if (
      event.type !== 'click' ||
      (event.type === 'click' &&
        samePageLinkNavigation(event as React.MouseEvent<HTMLAnchorElement, MouseEvent>))
    ) {
      setActiveTab(newValue);
    }
  };

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
        <>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
            ></meta>
          </Head>
          <ThemeProvider theme={theme}>
            <main className={`game theme-${params.theme}`}>
              <Tabs
                className="game__tabs"
                value={activeTab}
                onChange={handleChange}
                aria-label="tabs"
                variant="fullWidth"
                sx={{ height: `${TabBarHeight}px` }}
              >
                <LinkTab icon={<BackpackIcon />} aria-label="Inventory" href="/task/inventoryTab" />
                {/* TODO: Route to handler */}
                <LinkTab icon={<AssignmentIcon />} aria-label="Task" href="/task/multi" />
                <LinkTab icon={<MapIcon />} aria-label="Map" href="/task/mapTab" />
              </Tabs>
              <Component {...pageProps} />
            </main>
          </ThemeProvider>
        </>
      ) : (
        <Loading />
      )}
    </>
  );
}
