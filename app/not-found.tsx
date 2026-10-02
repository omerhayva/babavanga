import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="font-display text-6xl text-gold/60">☾</p>
        <h1 className="mt-6 font-display text-3xl text-mist">Bu sayfa yıldızların arasında kayboldu.</h1>
        <p className="mt-4 text-sm text-ash">
          Aradığın şey burada değil — belki de sorman gereken soru başkadır.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/read"
            className="rounded-xl border border-gold/60 bg-gold/10 px-6 py-3 font-display text-sm tracking-[0.18em] text-gold-pale"
          >
            BİR SORU SOR
          </Link>
          <Link href="/" className="rounded-xl border border-amethyst/30 px-6 py-3 text-sm text-amethyst-soft">
            Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
