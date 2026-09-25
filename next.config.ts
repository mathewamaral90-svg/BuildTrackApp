import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow the Base44 preview origin to load dev assets/HMR (no-op elsewhere).
  ...(process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? { allowedDevOrigins: ['3000-' + process.env.BASE44_PUBLIC_HOST_SUFFIX] }
    : {}),
}

export default nextConfig
