"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/', 'Kani Hub'],
  ['/online', 'Online Rooms'],
  ['/shop', 'Coin Shop'],
  ['/account', 'Account'],
];

export default function ProductNav() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <header className="sticky top-0 z-[100] border-b border-amber-400/30 bg-[#0b0b0d]/95 text-white shadow-xl backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <Link href="/" className="flex items-center gap-2 font-black tracking-[0.18em] text-amber-300" aria-label="Kani home">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-amber-300/60 bg-amber-300/10 text-sm">K</span>
          <span className="hidden sm:inline">KANI</span>
        </Link>
        <nav className="flex items-center gap-0.5 overflow-x-auto" aria-label="Kani product navigation">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[11px] font-bold transition hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm ${pathname === href ? 'bg-white/10 text-white' : 'text-stone-300'}`}>
              {label}
            </Link>
          ))}
        </nav>
        <span className="hidden rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 sm:inline">
          Alpha
        </span>
      </div>
    </header>
  );
}
