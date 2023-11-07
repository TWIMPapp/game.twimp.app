const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  webpack: (config) => {
    if (process.env.NEXT_OUTPUT_MODE !== "export" || !config.module) {
      return config;
    }
    config.module.rules?.push({
      test: /src\/app\/stories/,
      loader: "ignore-loader",
    });
    return config;
  },
}

module.exports = nextConfig
