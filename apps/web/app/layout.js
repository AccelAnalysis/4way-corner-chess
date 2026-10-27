import './globals.css';
import ProductNav from '../src/components/ProductNav';
import PwaRegistration from '../src/components/PwaRegistration';

export const metadata = {
  applicationName: 'KANI',
  title: 'KANI — Four-Way Chess',
  description: 'Capture the king. Command the army.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icons/192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/180.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KANI',
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7f0e5',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PwaRegistration />
        <ProductNav />
        {children}
      </body>
    </html>
  );
}
