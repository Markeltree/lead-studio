/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // CSV imports send up to 5,000 rows through a server action.
    serverActions: { bodySizeLimit: '10mb' },
  },
};

export default nextConfig;
