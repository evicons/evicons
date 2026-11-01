import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Resolve everything from this app, never from the monorepo root.
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
}

export default nextConfig
