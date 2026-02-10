/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  eslint: {
    // Allow production builds even with ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds even with TypeScript errors (we validate separately)
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
