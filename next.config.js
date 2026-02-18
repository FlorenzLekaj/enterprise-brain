/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Required fix for pdf-parse in Next.js (prevents canvas/encoding errors)
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    return config
  },
}

module.exports = nextConfig
