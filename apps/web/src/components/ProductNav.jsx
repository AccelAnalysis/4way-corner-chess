"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [['/', 'Play'], ['/online', 'Online'], ['/shop', 'Shop'], ['/account', 'Account']];

export default function ProductNav() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <header className="sticky top-0 z-[100] border-b border-[#d7c19e] bg-[#f7f0e5]/95 text-[#32281f] backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="kani-heading text-xl text-[#865022]" aria-label="Kani home">KANI</Link>
        <nav className="flex items-center gap-4 overflow-x-auto text-sm sm:gap-7" aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 py-4 transition-colors ${pathname === href ? 'border-amber-300 text-[#865022]' : 'border-transparent text-[#604e3a] hover:text-[#865022]'}`}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
