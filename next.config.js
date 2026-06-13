/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // Static HTML export for Firebase Hosting
  trailingSlash: true,        // Required for SPA routing on Firebase
  reactStrictMode: true,
  images: {
    unoptimized: true,        // Required for static export
    remotePatterns: [
      { protocol:'https', hostname:'firebasestorage.googleapis.com' },
      { protocol:'https', hostname:'*.supabase.co' },
    ],
  },
  typescript: { ignoreBuildErrors: true },  // Legacy files — OK for deployment
  eslint:     { ignoreDuringBuilds: true  },
};
module.exports = nextConfig;