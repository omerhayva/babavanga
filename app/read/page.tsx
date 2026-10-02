import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { store } from '@/lib/db/store';
import { buildCurrentStep } from '@/lib/question-engine/flow';
import { canAccessOwner } from '@/lib/auth/session';
import FlowClient from '@/components/read/FlowClient';
import QuestionStarter from '@/components/home/QuestionStarter';
import { cleanId } from '@/lib/security/validate';
import type { QuestionSession } from '@/lib/types/models';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sorunu Yanıtla',
  description: 'İnteraktif soru akışı: cevapların, sembollerin ve kartların birleşimiyle kişisel yorumun oluşur.',
  robots: { index: false, follow: false },
};

async function ReadInner({ searchParams }: { searchParams: { s?: string } }) {
  const sid = searchParams.s ? cleanId(searchParams.s, 'oturum') : null;
  const session = sid ? await store.get<QuestionSession>('sessions', sid) : null;

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <h1 className="font-display text-3xl text-mist sm:text-4xl">
            Sorunu yaz, <span className="text-gold">gerisini sisteme bırak</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ash">
            Oturumun bulunamadı ya da süresi geçti. Yeni bir soru ile başla.
          </p>
        </div>
        <div className="mt-10">
          <QuestionStarter />
        </div>
        <p className="mt-8 text-center text-sm text-ash">
          <Link href="/questions" className="text-gold/80 underline underline-offset-2">
            Konulardan seçerek başla
          </Link>
        </p>
      </div>
    );
  }

  if (!canAccessOwner(session.ownerId)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="font-display text-2xl text-mist">Bu oturum sana ait değil.</p>
        <p className="mt-3 text-sm text-ash">
          Yorumlarını yalnızca sen görebilirsin.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl border border-gold/50 px-6 py-3 text-sm text-gold-pale"
        >
          Ana sayfa
        </Link>
      </div>
    );
  }

  return (
    <FlowClient
      sessionId={session.id}
      initialStep={buildCurrentStep(session)}
      question={session.question}
    />
  );
}

export default function ReadPage({ searchParams }: { searchParams: { s?: string } }) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[50vh] place-items-center">
          <p className="shimmer-text font-display text-xl">Kapılar açılıyor…</p>
        </div>
      }
    >
      <ReadInner searchParams={searchParams} />
    </Suspense>
  );
}
