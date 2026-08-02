import './globals.css';

export const metadata = {
  title: 'Kani: 4-Way Corner Chess',
  description: 'Four corners. One crown. A product-grade evolution of 4-Way Corner Chess.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
