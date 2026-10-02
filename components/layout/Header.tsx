'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/questions', label: 'Konular' },
  { href: '/tarot', label: 'Tarot' },
  { href: '/numerology', label: 'Numeroloji' },
  { href: '/how-it-works', label: 'Nasıl Çalışır' },
  { href: '/account', label: 'Hesabım' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-gold/10 bg-night/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 text-gold transition-shadow group-hover:shadow-[0_0_18px_-2px_rgba(212,175,55,0.5)]">
            <span className="animate-glow-pulse">☾</span>
          </span>
          <span className="font-display text-lg tracking-[0.22em] text-mist">
            BABA <span className="text-gold">VANGA</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-sm tracking-wide transition-colors hover:text-gold-pale ${
                pathname === n.href ? 'text-gold' : 'text-ash'
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/read"
            className="rounded-full border border-gold/50 px-4 py-1.5 text-sm text-gold-pale transition-all hover:bg-gold/10 hover:shadow-[0_0_20px_-6px_rgba(212,175,55,0.5)]"
          >
            Soru Sor
          </Link>
        </nav>

        <button
          aria-label="Menü"
          className="grid h-10 w-10 place-items-center rounded-lg border border-gold/20 text-gold md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <nav className="animate-fade-in border-t border-gold/10 bg-night/95 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 text-base ${
                  pathname === n.href ? 'bg-gold/10 text-gold' : 'text-ash'
                }`}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/read"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl border border-gold/50 px-3 py-3 text-center text-base text-gold-pale"
            >
              Bir Soru Sor
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
