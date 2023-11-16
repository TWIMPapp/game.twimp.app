import React from 'react';
import { Box, ThemeProvider } from '@mui/material';
import type { Preview } from '@storybook/react';
import '../src/styles/globals.scss';
import { theme } from '../src/pages/_app';
import MainTabs from '../src/components/MainTabs';

const customViewports = {
  iphone12Pro: {
    name: 'iPhone 12 Pro',
    styles: {
      width: '390px',
      height: '844px'
    }
  }
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    viewport: {
      viewports: customViewports,
      defaultViewport: 'iphone12Pro'
    },
    layout: 'fullscreen',
    decorators: [
      (story) => {
        return (
          // <ThemeProvider theme={theme}>
          // <MainTabs />
          <main className="game">{story()}</main>
          // </ThemeProvider>
        );
      }
    ]
  }
};

export default preview;
