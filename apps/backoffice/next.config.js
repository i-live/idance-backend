/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features for better performance
    optimizePackageImports: ['lucide-react'],
  },
  // Configure for Cloudflare Workers deployment (not static export)
  images: {
    unoptimized: true,
  },
  // Environment variables for client-side
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
}

module.exports = nextConfig