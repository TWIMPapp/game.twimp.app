import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="h-full w-full">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8"></meta>
        <meta name="referrer" content="same-origin"></meta>
      </Head>
      <body>
        <Main />
        <NextScript />
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PJT9V98" height="0" width="0" style="display: none; visibility: hidden;" />`
          }}
        />
      </body>
    </Html>
  );
}
