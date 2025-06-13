import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeimScan - 축의금 봉투 스캔 앱',
  description: '축의금 봉투의 내용을 스캔하여 자동으로 기록하는 PWA 애플리케이션',
  generator: 'Next.js',
  applicationName: 'NeimScan',
  referrer: 'origin-when-cross-origin',
  keywords: ['축의금', '봉투', 'OCR', '스캔', 'PWA', '모바일앱'],
  authors: [{ name: 'NeimScan Team' }],
  creator: 'NeimScan Team',
  publisher: 'NeimScan Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'NeimScan',
    title: 'NeimScan - 축의금 봉투 스캔 앱',
    description: '축의금 봉투의 내용을 스캔하여 자동으로 기록하는 PWA 애플리케이션',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NeimScan 앱 스크린샷',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeimScan - 축의금 봉투 스캔 앱',
    description: '축의금 봉투의 내용을 스캔하여 자동으로 기록하는 PWA 애플리케이션',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: [
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
    { rel: 'icon', url: '/icons/icon-32x32.png' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NeimScan',
  },
};

export const viewport: Viewport = {
  themeColor: '#21808d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NeimScan" />
        <meta name="msapplication-TileColor" content="#21808d" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}