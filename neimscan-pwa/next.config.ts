import type { NextConfig } from 'next'
import type { Configuration } from 'webpack'

const nextConfig: NextConfig = {
  experimental: {
    // Next.js 15 실험적 기능
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // PWA 설정을 위한 헤더 구성
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },

  // 이미지 최적화 설정
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // TypeScript 설정
  typescript: {
    // 빌드 시 타입 체크 무시 여부 (개발 중에만 true로)
    ignoreBuildErrors: false,
  },

  // Webpack 설정
  webpack: (
    config: Configuration,
    context: { isServer: boolean }
  ): Configuration => {
    if (!context.isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
        },
      }
    }
    return config
  },
}

export default nextConfig
