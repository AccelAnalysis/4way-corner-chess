import './globals.css';
import ProductNav from '../src/components/ProductNav';

export const metadata = {
  title: 'Kani: 4-Way Corner Chess',
  description: 'Four corners. One crown. Online rooms, cosmetic progression, and Kani Coin test checkout.',
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
