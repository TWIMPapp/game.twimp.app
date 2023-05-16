import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    // html with responsive settings
    <Html lang="en" className="h-full w-full">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
