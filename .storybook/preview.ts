import type { Preview } from '@storybook/react';
import 'tailwindcss/tailwind.css';

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
    layout: 'fullscreen'
  }
};

export default preview;
