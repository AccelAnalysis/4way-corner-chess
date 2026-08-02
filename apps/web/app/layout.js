import './globals.css';
import ProductNav from '../src/components/ProductNav';

export const metadata = {
  title: 'Kani: 4-Way Corner Chess',
  description: 'Play free before creating an account. Capture kings, command armies, and personalize the board without pay-to-win mechanics.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ProductNav />
        {children}
      </body>
    </html>
  );
}
