import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata = { title: 'Offline · KANI' };
export default function Offline() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-[#f7f0e5] px-6 text-center text-[#32281f]">
      <section className="max-w-md">
        <WifiOff className="mx-auto text-[#9a6c3c]" size={44} strokeWidth={1.5}/>
        <h1 className="mt-6 text-4xl">You're offline.</h1>
        <p className="mt-3 text-[#615244]">Reconnect for online games.</p>
        <Link className="kani-action mt-7" href="/">Try KANI</Link>
      </section>
    </main>
  );
}
