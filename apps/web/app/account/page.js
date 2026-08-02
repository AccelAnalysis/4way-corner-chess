import { Suspense } from 'react';
import AccountGateway from '../../src/components/AccountGateway';

export const metadata = {
  title: 'Free Kani Account',
  description: 'Save progress, join online rooms, and protect cosmetic purchases without buying gameplay power.',
};

export default function AccountPage() {
  return (
    <Suspense fallback={<main className="grid min-h-[calc(100svh-56px)] place-items-center bg-[#080706] text-amber-300">Loading account options…</main>}>
      <AccountGateway />
    </Suspense>
  );
}
