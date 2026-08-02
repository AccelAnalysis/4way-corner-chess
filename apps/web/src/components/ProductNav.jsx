import Link from 'next/link';

const links = [
  ['/', 'Kani Hub'],
  ['/online', 'Online Rooms'],
  ['/shop', 'Coin Shop'],
];

export default function ProductNav() {
  return (
    <header className="sticky top-0 z-[100] border-b border-amber-400/30 bg-[#0b0b0d]/95 text-white shadow-xl backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-black tracking-[0.18em] text-amber-300" aria-label="Kani home">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-amber-300/60 bg-amber-300/10 text-sm">K</span>
          <span className="hidden sm:inline">KANI</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Kani product navigation">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full px-3 py-2 text-xs font-bold text-stone-200 transition hover:bg-white/10 hover:text-white sm:text-sm">
              {label}
            </Link>
          ))}
        </nav>
        <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
          Alpha
        </span>
      </div>
    </header>
  );
}
