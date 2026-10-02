import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategories } from '@/lib/db/content';
import QuestionStarter from '@/components/home/QuestionStarter';
import { cleanString } from '@/lib/security/validate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Konular',
  description:
    'Aşk, ilişki, evlilik, para, kariyer, gelecek, aile, karar ve daha fazlası — hangi konuda soru sormak istersin?',
  openGraph: { title: 'Konular | Baba Vanga', description: 'Hangi konuda soru sormak istersin?' },
};

export default function QuestionsPage({ searchParams }: { searchParams: { k?: string } }) {
  const categories = getCategories();
  const active = searchParams.k ? cleanString(searchParams.k, 30, 'konu') : null;
  const activeCat = categories.find((c) => c.id === active) ?? null;

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="font-display text-[11px] tracking-widest2 text-gold/70">KONULAR</p>
        <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">
          {activeCat ? `${activeCat.name} hakkında bir soru sor` : 'Hangi konuda soru sormak istersin?'}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ash">
          Konu seçmek zorunda değilsin — ana sayfadan serbestçe de yazabilirsin.
          Konu seçersen sistem sorularını doğrudan o alana göre şekillendirir.
        </p>
      </div>

      {activeCat && (
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="mb-4 text-center text-sm text-ash">
            <span className="mr-2 text-xl text-gold/90">{activeCat.glyph}</span>
            {activeCat.description}
          </div>
          <QuestionStarter category={activeCat.id} />
        </div>
      )}

      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/questions?k=${c.id}`}
            className={`card-hover rounded-2xl border p-5 ${
              activeCat?.id === c.id
                ? 'border-gold/60 bg-gold/5 shadow-[0_0_24px_-8px_rgba(212,175,55,0.4)]'
                : 'border-gold/10 bg-veil/40'
            }`}
          >
            <span className="text-xl text-gold/90">{c.glyph}</span>
            <div className="mt-3 font-display text-sm text-mist sm:text-base">{c.name}</div>
            <p className="mt-1 hidden text-[11px] leading-relaxed text-ash/80 sm:block">
              {c.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
