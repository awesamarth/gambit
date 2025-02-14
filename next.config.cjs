/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    // Ignore optional ws deps
    config.ignoreWarnings = [
      { module: /node_modules\/ws\/lib\// }
    ];
    return config;
  },
};

module.exports = nextConfig;