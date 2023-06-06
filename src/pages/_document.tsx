import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="h-full w-full">
      <Head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"></meta>
        <meta name="referrer" content="origin-when-cross-origin"></meta>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        ></meta>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
