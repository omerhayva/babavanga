'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Question, QuestionCategoryDef, Fragment, TarotCardData,
  NumerologyNumberData, SymbolData, ScoreMap,
} from '@/lib/types/models';

interface AdminData {
  questions: Question[];
  fragments: Fragment[];
  categories: QuestionCategoryDef[];
  tarot: TarotCardData[];
  numerology: Record<string, NumerologyNumberData>;
  symbols: SymbolData[];
  stats: {
    sessions: number; readings: number; users: number; payments: number;
    events: {
      totals: Record<string, number>;
      last24h: Record<string, number>;
      recent: Array<{ id: string; type: string; at: number }>;
      completionRate: number;
    };
  };
}

type Tab = 'dashboard' | 'questions' | 'fragments' | 'tarot' | 'numerology' | 'categories' | 'symbols';

const TABS: Array<[Tab, string]> = [
  ['dashboard', 'Panel'],
  ['questions', 'Sorular'],
  ['fragments', 'Yorum Parçaları'],
  ['tarot', 'Tarot Kartları'],
  ['numerology', 'Numeroloji'],
  ['categories', 'Kategoriler'],
  ['symbols', 'Semboller'],
];

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/content', { cache: 'no-store' });
    if (res.status === 401) { router.refresh(); return; }
    setData(await res.json());
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function mutate(action: string, payload: Record<string, unknown>) {
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFlash(`⚠ ${json.error ?? 'İşlem başarısız'}`);
    } else {
      setFlash('✓ Kaydedildi — site anında güncel içerikle çalışır.');
      await load();
    }
    setTimeout(() => setFlash(null), 3500);
  }

  if (!data) {
    return <div className="grid min-h-[50vh] place-items-center"><p className="shimmer-text font-display text-xl">Yükleniyor…</p></div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-mist">
          Yönetim Paneli <span className="text-sm font-normal text-ash">— kod değiştirmeden içerik yönetimi</span>
        </h1>
        <div className="flex gap-2">
          <a href="/" target="_blank" className="rounded-lg border border-amethyst/30 px-4 py-2 text-xs text-amethyst-soft">
            Siteyi gör ↗
          </a>
          <button
            onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.refresh(); }}
            className="rounded-lg border border-gold/30 px-4 py-2 text-xs text-gold-pale"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5 border-b border-gold/10 pb-3">
        {TABS.map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3.5 py-2 text-sm transition-colors ${
              tab === t ? 'border border-gold/60 bg-gold/10 text-gold-pale' : 'text-ash hover:text-mist'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {flash && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold-pale">
          {flash}
        </div>
      )}

      <div className="mt-8">
        {tab === 'dashboard' && <Dashboard data={data} />}
        {tab === 'questions' && <QuestionsTab data={data} mutate={mutate} />}
        {tab === 'fragments' && <FragmentsTab data={data} mutate={mutate} />}
        {tab === 'tarot' && <TarotTab data={data} mutate={mutate} />}
        {tab === 'numerology' && <NumerologyTab data={data} mutate={mutate} />}
        {tab === 'categories' && <CategoriesTab data={data} mutate={mutate} />}
        {tab === 'symbols' && <SymbolsTab data={data} mutate={mutate} />}
      </div>
    </div>
  );
}

/* ================================================================= Dashboard */
function Dashboard({ data }: { data: AdminData }) {
  const s = data.stats;
  const totals = Object.entries(s.events.totals).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Oturum" value={s.sessions} />
        <StatCard label="Tamamlanan Yorum" value={s.readings} />
        <StatCard label="Kullanıcı" value={s.users} />
        <StatCard label="Ödeme (mock)" value={s.payments} />
      </div>

      <div className="rounded-2xl border border-gold/10 bg-veil/40 p-6">
        <h2 className="font-display text-lg text-mist">Dönüşüm</h2>
        <p className="mt-2 text-sm text-ash">
          Soru başlatma → yorum tamamlama: <span className="text-gold-pale">%{s.events.completionRate}</span>
        </p>
        <div className="mt-4 space-y-1.5">
          {totals.map(([type, count]) => (
            <div key={type} className="flex items-center gap-3 text-xs">
              <span className="w-44 shrink-0 text-ash">{type}</span>
              <div className="score-bar flex-1">
                <div style={{ width: `${Math.min(100, (count / (totals[0]?.[1] || 1)) * 100)}%` }} />
              </div>
              <span className="w-10 text-right tabular-nums text-gold/80">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gold/10 bg-veil/40 p-6">
        <h2 className="font-display text-lg text-mist">Son olaylar (anonim)</h2>
        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto text-xs">
          {s.events.recent.map((e) => (
            <div key={e.id} className="flex justify-between border-b border-gold/5 py-1.5 text-ash">
              <span>{e.type}</span>
              <span className="text-ash/50">{new Date(e.at).toLocaleString('tr-TR')}</span>
            </div>
          ))}
          {s.events.recent.length === 0 && <p className="text-ash/60">Henüz olay yok.</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-veil/50 p-5">
      <p className="text-[10px] tracking-widest text-ash/70">{label.toUpperCase()}</p>
      <p className="mt-2 font-display text-3xl text-gold-pale">{value}</p>
    </div>
  );
}

/* ================================================================= Sorular */
function QuestionsTab({ data, mutate }: { data: AdminData; mutate: (a: string, p: Record<string, unknown>) => Promise<void> }) {
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const questions = useMemo(() => [...data.questions].sort((a, b) => a.order - b.order), [data.questions]);

  if (editing) {
    return (
      <QuestionEditor
        question={editing === 'new' ? null : editing}
        categories={data.categories}
        onSave={async (q) => { await mutate('question-upsert', q as unknown as Record<string, unknown>); setEditing(null); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => setEditing('new')}
        className="rounded-xl border border-gold/60 bg-gold/10 px-5 py-2.5 text-sm text-gold-pale"
      >
        + Yeni Soru Ekle
      </button>
      <p className="mt-3 text-xs text-ash/60">
        {questions.length} soru. Aşama (stage): core = kategori girişi, depth = dal sorusu, generic = adaptif yedek havuz.
      </p>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-gold/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-veil/70 text-ash">
            <tr>
              <th className="px-3 py-2.5">ID</th><th className="px-3 py-2.5">Kategori</th>
              <th className="px-3 py-2.5">Soru</th><th className="px-3 py-2.5">Tip</th>
              <th className="px-3 py-2.5">Aşama</th><th className="px-3 py-2.5">Sıra</th><th />
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="border-t border-gold/5 hover:bg-veil/30">
                <td className="px-3 py-2.5 font-mono text-gold/70">{q.id}</td>
                <td className="px-3 py-2.5 text-ash">{q.category}</td>
                <td className="max-w-xs truncate px-3 py-2.5 text-mist/90">{q.text}</td>
                <td className="px-3 py-2.5 text-ash">{q.type}</td>
                <td className="px-3 py-2.5 text-ash">{q.stage ?? 'core'}</td>
                <td className="px-3 py-2.5 tabular-nums text-ash">{q.order}</td>
                <td className="px-3 py-2.5 text-right">
                  <button onClick={() => setEditing(q)} className="text-amethyst-soft hover:underline">düzenle</button>
                  <button
                    onClick={() => confirm(`"${q.id}" silinsin mi?`) && mutate('question-delete', { id: q.id })}
                    className="ml-3 text-red-300/80 hover:underline"
                  >sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function parseScores(s: string): ScoreMap | undefined {
  const out: ScoreMap = {};
  let any = false;
  for (const part of s.split(',').map((x) => x.trim()).filter(Boolean)) {
    const m = /^([a-z]+)\s*=\s*(-?\d+(?:\.\d+)?)$/i.exec(part);
    if (m) { (out as Record<string, number>)[m[1]] = Number(m[2]); any = true; }
  }
  return any ? out : undefined;
}

function stringifyScores(s?: ScoreMap): string {
  if (!s) return '';
  return Object.entries(s).map(([k, v]) => `${k}=${v}`).join(', ');
}

function QuestionEditor({
  question, categories, onSave, onCancel,
}: {
  question: Question | null;
  categories: QuestionCategoryDef[];
  onSave: (q: Question) => void;
  onCancel: () => void;
}) {
  const [id, setId] = useState(question?.id ?? '');
  const [category, setCategory] = useState(question?.category ?? 'general');
  const [text, setText] = useState(question?.text ?? '');
  const [helperText, setHelperText] = useState(question?.helperText ?? '');
  const [type, setType] = useState<Question['type']>(question?.type ?? 'single');
  const [order, setOrder] = useState(question?.order ?? 500);
  const [stage, setStage] = useState<NonNullable<Question['stage']>>(question?.stage ?? 'core');
  const [weight, setWeight] = useState(question?.weight ?? 2);
  const [nextQuestion, setNextQuestion] = useState(question?.nextQuestion ?? '');
  const [tags, setTags] = useState((question?.tags ?? []).join(', '));
  const [scoring, setScoring] = useState(stringifyScores(question?.scoring));
  const [scaleLabels, setScaleLabels] = useState((question?.scaleLabels ?? ['', '']).join(' | '));
  const [minSel, setMinSel] = useState(question?.minSelected ?? 1);
  const [maxSel, setMaxSel] = useState(question?.maxSelected ?? 3);

  // seçenekler: `değer | Etiket | next:soru_id | s:change=3,risk=-1`
  const [optionsText, setOptionsText] = useState(
    (question?.options ?? []).map((o) => {
      const parts = [o.value, o.label];
      if (o.next) parts.push(`next:${o.next}`);
      if (o.scores && Object.keys(o.scores).length) parts.push(`s:${stringifyScores(o.scores)}`);
      return parts.join(' | ');
    }).join('\n'),
  );
  // koşullar: `soruid in a,b | next:x` veya `score:change>=6 | next:y`
  const [conditionsText, setConditionsText] = useState(
    (question?.conditions ?? []).map((c) => {
      let cond = '';
      if (c.questionId) {
        cond = `${c.questionId} ${c.in ? `in ${c.in.join(',')}` : `notIn ${(c.notIn ?? []).join(',')}`}`;
      } else if (c.scoreKey) {
        cond = `score:${c.scoreKey}>=${c.minScore ?? 0}`;
      }
      return `${cond} | next:${c.next}`;
    }).join('\n'),
  );

  function build(): Question {
    const options = optionsText.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const seg = line.split('|').map((x) => x.trim());
      const opt: Question['options'][0] = { value: seg[0], label: seg[1] ?? seg[0] };
      for (const extra of seg.slice(2)) {
        if (extra.startsWith('next:')) opt.next = extra.slice(5).trim();
        if (extra.startsWith('s:')) opt.scores = parseScores(extra.slice(2));
      }
      return opt;
    });
    const conditions = conditionsText.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const [condPart, nextPart] = line.split('|').map((x) => x.trim());
      const next = (nextPart ?? '').replace(/^next:/, '').trim();
      const cond: NonNullable<Question['conditions']>[0] = { next };
      if (condPart.startsWith('score:')) {
        const m = /^score:([a-z]+)(>=|<=)(-?\d+)$/i.exec(condPart);
        if (m) {
          cond.scoreKey = m[1] as Question['conditions'] extends undefined ? never : NonNullable<Question['conditions']>[0]['scoreKey'];
          if (m[2] === '>=') cond.minScore = Number(m[3]);
          else cond.maxScore = Number(m[3]);
        }
      } else {
        const m = /^(\S+)\s+(in|notIn)\s+(.+)$/.exec(condPart);
        if (m) {
          cond.questionId = m[1];
          if (m[2] === 'in') cond.in = m[3].split(',').map((x) => x.trim()).filter(Boolean);
          else cond.notIn = m[3].split(',').map((x) => x.trim()).filter(Boolean);
        }
      }
      return cond;
    }).filter((c) => c.next && (c.questionId || c.scoreKey));

    const labels = scaleLabels.split('|').map((x) => x.trim());
    return {
      id, category, text, helperText: helperText || undefined, type,
      options, conditions: conditions.length ? conditions : undefined,
      nextQuestion: nextQuestion || undefined,
      weight, tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      scoring: parseScores(scoring),
      required: true, order, stage,
      minSelected: type === 'multi' ? minSel : undefined,
      maxSelected: type === 'multi' ? maxSel : undefined,
      scaleLabels: type === 'scale' && labels.length === 2 && labels[0] ? labels as [string, string] : undefined,
    };
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-veil/40 p-6">
      <h2 className="font-display text-xl text-mist">{question ? `Soruyu düzenle: ${question.id}` : 'Yeni soru'}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="ID (örn: love_010)">
          <input className="field" value={id} onChange={(e) => setId(e.target.value)} disabled={!!question} />
        </Field>
        <Field label="Kategori">
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
          </select>
        </Field>
        <Field label="Soru metni" wide>
          <textarea className="field" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Field label="Yardım metni (opsiyonel)" wide>
          <input className="field" value={helperText} onChange={(e) => setHelperText(e.target.value)} />
        </Field>
        <Field label="Tip">
          <select className="field" value={type} onChange={(e) => setType(e.target.value as Question['type'])}>
            <option value="single">single (tek seçim)</option>
            <option value="multi">multi (çoklu)</option>
            <option value="scale">scale (1-5 ölçek)</option>
            <option value="number">number (0-9)</option>
          </select>
        </Field>
        <Field label="Aşama (stage)">
          <select className="field" value={stage} onChange={(e) => setStage(e.target.value as NonNullable<Question['stage']>)}>
            <option value="core">core</option>
            <option value="depth">depth</option>
            <option value="generic">generic</option>
          </select>
        </Field>
        <Field label="Sıra (order)"><input type="number" className="field" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></Field>
        <Field label="Ağırlık (1-5)"><input type="number" min={1} max={5} className="field" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></Field>
        <Field label="Varsayılan sonraki soru ID (opsiyonel)">
          <input className="field" value={nextQuestion} onChange={(e) => setNextQuestion(e.target.value)} />
        </Field>
        <Field label="Etiketler (virgüllü)">
          <input className="field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="love, longing" />
        </Field>
        {type === 'scale' && (
          <>
            <Field label="Ölçek uçları (sol | sağ)" wide>
              <input className="field" value={scaleLabels} onChange={(e) => setScaleLabels(e.target.value)} placeholder="Hiç inanmıyorum | Kesinlikle inanıyorum" />
            </Field>
            <Field label="Ölçek skor katsayıları (scale için)" wide>
              <input className="field" value={scoring} onChange={(e) => setScoring(e.target.value)} placeholder="hope=2.5, confidence=1.5" />
            </Field>
          </>
        )}
        {type !== 'scale' && (
          <Field label="Soru sabit skorları (opsiyonel)" wide>
            <input className="field" value={scoring} onChange={(e) => setScoring(e.target.value)} placeholder="change=2, risk=1" />
          </Field>
        )}
        {type === 'multi' && (
          <>
            <Field label="Min seçim"><input type="number" className="field" value={minSel} onChange={(e) => setMinSel(Number(e.target.value))} /></Field>
            <Field label="Maks seçim"><input type="number" className="field" value={maxSel} onChange={(e) => setMaxSel(Number(e.target.value))} /></Field>
          </>
        )}
        {type !== 'scale' && (
          <Field label={`Seçenekler — her satır: değer | Etiket ${'| next:soru_id'.replace('|', '')}| next:soru_id | s:skor=değer`} wide>
            <textarea className="field font-mono text-xs" rows={6} value={optionsText} onChange={(e) => setOptionsText(e.target.value)}
              placeholder={'ozlem | Özlem | next:love_002 | s:relationship=3,hope=1\nkorku | Korku | s:risk=3,hope=-2'} />
          </Field>
        )}
        <Field label="Koşullar (opsiyonel) — her satır: soru_id in deger1,deger2 | next:hedef_id" wide>
          <textarea className="field font-mono text-xs" rows={3} value={conditionsText} onChange={(e) => setConditionsText(e.target.value)}
            placeholder={'love_001 in ozlem,korku | next:love_007\nscore:risk>=8 | next:gnr_001'} />
        </Field>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={() => onSave(build())} className="rounded-xl border border-gold/60 bg-gold/10 px-6 py-2.5 text-sm text-gold-pale">
          Kaydet
        </button>
        <button onClick={onCancel} className="rounded-xl border border-ash/20 px-6 py-2.5 text-sm text-ash">Vazgeç</button>
      </div>
    </div>
  );
}

/* ================================================================= Parçalar */
function FragmentsTab({ data, mutate }: { data: AdminData; mutate: (a: string, p: Record<string, unknown>) => Promise<void> }) {
  const [editing, setEditing] = useState<Fragment | 'new' | null>(null);

  if (editing) {
    return (
      <FragmentEditor
        fragment={editing === 'new' ? null : editing}
        onSave={async (f) => { await mutate('fragment-upsert', f as unknown as Record<string, unknown>); setEditing(null); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => setEditing('new')}
        className="rounded-xl border border-gold/60 bg-gold/10 px-5 py-2.5 text-sm text-gold-pale"
      >
        + Yeni Yorum Parçası
      </button>
      <p className="mt-3 text-xs text-ash/60">{data.fragments.length} parça.</p>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-gold/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-veil/70 text-ash">
            <tr>
              <th className="px-3 py-2.5">ID</th><th className="px-3 py-2.5">Bölüm</th>
              <th className="px-3 py-2.5">Kategoriler</th><th className="px-3 py-2.5">Etiketler</th>
              <th className="px-3 py-2.5">Metin</th><th />
            </tr>
          </thead>
          <tbody>
            {data.fragments.map((f) => (
              <tr key={f.id} className="border-t border-gold/5 hover:bg-veil/30">
                <td className="px-3 py-2.5 font-mono text-gold/70">{f.id}</td>
                <td className="px-3 py-2.5 text-ash">{f.section}</td>
                <td className="px-3 py-2.5 text-ash">{f.categories?.join(',') || '—'}</td>
                <td className="px-3 py-2.5 text-ash">{f.tags?.join(',') || '—'}</td>
                <td className="max-w-md truncate px-3 py-2.5 text-mist/80">{f.text}</td>
                <td className="px-3 py-2.5 text-right">
                  <button onClick={() => setEditing(f)} className="text-amethyst-soft hover:underline">düzenle</button>
                  <button
                    onClick={() => confirm(`"${f.id}" silinsin mi?`) && mutate('fragment-delete', { id: f.id })}
                    className="ml-3 text-red-300/80 hover:underline"
                  >sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentEditor({ fragment, onSave, onCancel }: { fragment: Fragment | null; onSave: (f: Fragment) => void; onCancel: () => void }) {
  const [id, setId] = useState(fragment?.id ?? '');
  const [section, setSection] = useState<Fragment['section']>(fragment?.section ?? 'opening');
  const [categories, setCategories] = useState((fragment?.categories ?? []).join(', '));
  const [tags, setTags] = useState((fragment?.tags ?? []).join(', '));
  const [text, setText] = useState(fragment?.text ?? '');

  return (
    <div className="rounded-2xl border border-gold/20 bg-veil/40 p-6">
      <h2 className="font-display text-xl text-mist">{fragment ? `Parçayı düzenle: ${fragment.id}` : 'Yeni yorum parçası'}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="ID"><input className="field" value={id} onChange={(e) => setId(e.target.value)} disabled={!!fragment} /></Field>
        <Field label="Bölüm">
          <select className="field" value={section} onChange={(e) => setSection(e.target.value as Fragment['section'])}>
            {['opening', 'situation', 'hidden', 'energy', 'influence', 'possibility', 'opportunity', 'warning', 'timing', 'closing'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Kategoriler (virgüllü, boş = tümü)">
          <input className="field" value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="love, relationship" />
        </Field>
        <Field label="Etiketler (virgüllü — koşul etiketleri)">
          <input className="field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="risk-high, decision" />
        </Field>
        <Field label="Metin" wide>
          <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => onSave({
            id, section,
            categories: categories.split(',').map((x) => x.trim()).filter(Boolean) || undefined,
            tags: tags.split(',').map((x) => x.trim()).filter(Boolean) || undefined,
            text,
          })}
          className="rounded-xl border border-gold/60 bg-gold/10 px-6 py-2.5 text-sm text-gold-pale"
        >Kaydet</button>
        <button onClick={onCancel} className="rounded-xl border border-ash/20 px-6 py-2.5 text-sm text-ash">Vazgeç</button>
      </div>
    </div>
  );
}

/* ================================================================= Tarot */
function TarotTab({ data, mutate }: { data: AdminData; mutate: (a: string, p: Record<string, unknown>) => Promise<void> }) {
  const [selected, setSelected] = useState<TarotCardData | null>(null);
  const [form, setForm] = useState<Partial<TarotCardData>>({});

  function open(card: TarotCardData) {
    setSelected(card);
    setForm({
      nameTr: card.nameTr, upright: card.upright, reversed: card.reversed,
      love: card.love, money: card.money, career: card.career, future: card.future,
      warning: card.warning, opportunity: card.opportunity, timing: card.timing,
      keywords: card.keywords,
    });
  }

  if (selected) {
    const fields: Array<[keyof TarotCardData, string]> = [
      ['nameTr', 'Türkçe ad'], ['upright', 'Düz anlam'], ['reversed', 'Ters anlam'],
      ['love', 'Aşk yorumu'], ['money', 'Para yorumu'], ['career', 'Kariyer yorumu'],
      ['future', 'Gelecek'], ['warning', 'Uyarı'], ['opportunity', 'Fırsat'], ['timing', 'Zamanlama'],
    ];
    return (
      <div className="rounded-2xl border border-gold/20 bg-veil/40 p-6">
        <h2 className="font-display text-xl text-mist">
          {selected.glyph} {selected.name} — {selected.nameTr}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map(([f, label]) => (
            <Field key={f} label={label} wide={f === 'upright' || f === 'reversed'}>
              <textarea
                className="field text-sm" rows={2}
                value={String(form[f] ?? '')}
                onChange={(e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))}
              />
            </Field>
          ))}
          <Field label="Anahtar kelimeler (virgüllü)" wide>
            <input className="field" value={(form.keywords ?? []).join(', ')}
              onChange={(e) => setForm((prev) => ({ ...prev, keywords: e.target.value.split(',').map((x) => x.trim()) }))} />
          </Field>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={async () => { await mutate('tarot-patch', { id: selected.id, ...form }); setSelected(null); }}
            className="rounded-xl border border-gold/60 bg-gold/10 px-6 py-2.5 text-sm text-gold-pale"
          >Kaydet</button>
          <button onClick={() => setSelected(null)} className="rounded-xl border border-ash/20 px-6 py-2.5 text-sm text-ash">Vazgeç</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {data.tarot.map((c) => (
        <button key={c.id} onClick={() => open(c)} className="card-hover rounded-2xl border border-gold/15 bg-veil/40 p-4 text-center">
          <div className="text-3xl">{c.glyph}</div>
          <p className="mt-2 font-display text-sm text-mist">{c.nameTr}</p>
          <p className="text-[10px] text-ash/60">{c.name}</p>
        </button>
      ))}
    </div>
  );
}

/* ================================================================= Numeroloji */
function NumerologyTab({ data, mutate }: { data: AdminData; mutate: (a: string, p: Record<string, unknown>) => Promise<void> }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '22', '33'];
  const [key, setKey] = useState('1');
  const entry = data.numerology[key];
  const [form, setForm] = useState<NumerologyNumberData | null>(null);

  useEffect(() => {
    setForm(entry ? JSON.parse(JSON.stringify(entry)) : { themes: [], positive: [], negative: [], love: [], money: [], career: [] });
  }, [key, data.numerology]);

  if (!form) return null;

  const fields: Array<[keyof NumerologyNumberData, string]> = [
    ['themes', 'Temalar'], ['positive', 'Olumlu'], ['negative', 'Olumsuz'],
    ['love', 'Aşk'], ['money', 'Para'], ['career', 'Kariyer'],
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => setKey(k)}
            className={`h-11 w-11 rounded-xl border font-display text-lg ${
              key === k ? 'border-gold/70 bg-gold/10 text-gold-pale' : 'border-gold/15 text-ash hover:border-gold/40'
            }`}
          >{k}</button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-gold/20 bg-veil/40 p-6">
        <h2 className="font-display text-xl text-mist">Sayı {key}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map(([f, label]) => (
            <Field key={f} label={`${label} (her satır bir madde)`}>
              <textarea
                className="field text-sm" rows={4}
                value={(form[f] as string[]).join('\n')}
                onChange={(e) => setForm({ ...form, [f]: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}
              />
            </Field>
          ))}
        </div>
        <button
          onClick={() => mutate('numerology-set', { key, data: form })}
          className="mt-6 rounded-xl border border-gold/60 bg-gold/10 px-6 py-2.5 text-sm text-gold-pale"
        >Kaydet</button>
      </div>
    </div>
  );
}

/* ================================================================= Kategoriler */
function CategoriesTab({ data, mutate }: { data: AdminData; mutate: (a: string, p: Record<string, unknown>) => Promise<void> }) {
  const [editing, setEditing] = useState<QuestionCategoryDef | 'new' | null>(null);

  if (editing) {
    return (
      <CategoryEditor
        category={editing === 'new' ? null : editing}
        onSave={async (c) => { await mutate('category-upsert', c as unknown as Record<string, unknown>); setEditing(null); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <button onClick={() => setEditing('new')} className="rounded-xl border border-gold/60 bg-gold/10 px-5 py-2.5 text-sm text-gold-pale">
        + Yeni Kategori
      </button>
      <p className="mt-3 text-xs text-ash/60">
        Yeni kategori eklemek soruların da o kategoride tanımlanmasını gerektirir; sınıflandırıcı keywords listesini kullanır.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.categories.map((c) => (
          <div key={c.id} className="rounded-2xl border border-gold/10 bg-veil/40 p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl text-gold/90">{c.glyph}</span>
              <div className="flex gap-3 text-xs">
                <button onClick={() => setEditing(c)} className="text-amethyst-soft hover:underline">düzenle</button>
                <button
                  onClick={() => confirm(`"${c.name}" silinsin mi?`) && mutate('category-delete', { id: c.id })}
                  className="text-red-300/80 hover:underline"
                >sil</button>
              </div>
            </div>
            <p className="mt-3 font-display text-base text-mist">{c.name}</p>
            <p className="text-xs text-ash">{c.description}</p>
            <p className="mt-2 font-mono text-[10px] text-gold/50">{c.keywords.slice(0, 6).join(' · ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryEditor({ category, onSave, onCancel }: { category: QuestionCategoryDef | null; onSave: (c: QuestionCategoryDef) => void; onCancel: () => void }) {
  const [id, setId] = useState(category?.id ?? '');
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [glyph, setGlyph] = useState(category?.glyph ?? '◈');
  const [keywords, setKeywords] = useState((category?.keywords ?? []).join(', '));

  return (
    <div className="rounded-2xl border border-gold/20 bg-veil/40 p-6">
      <h2 className="font-display text-xl text-mist">{category ? `Kategori: ${category.name}` : 'Yeni kategori'}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="ID (örn: health)"><input className="field" value={id} onChange={(e) => setId(e.target.value)} disabled={!!category} /></Field>
        <Field label="Ad"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Glif (unicode)"><input className="field" value={glyph} onChange={(e) => setGlyph(e.target.value)} maxLength={4} /></Field>
        <Field label="Anahtar kelimeler (virgüllü)"><input className="field" value={keywords} onChange={(e) => setKeywords(e.target.value)} /></Field>
        <Field label="Açıklama" wide><input className="field" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => onSave({
            id, name, description, glyph,
            keywords: keywords.split(',').map((x) => x.trim()).filter(Boolean),
          })}
          className="rounded-xl border border-gold/60 bg-gold/10 px-6 py-2.5 text-sm text-gold-pale"
        >Kaydet</button>
        <button onClick={onCancel} className="rounded-xl border border-ash/20 px-6 py-2.5 text-sm text-ash">Vazgeç</button>
      </div>
    </div>
  );
}

/* ================================================================= Semboller */
function SymbolsTab({ data, mutate }: { data: AdminData; mutate: (a: string, p: Record<string, unknown>) => Promise<void> }) {
  const [selected, setSelected] = useState<SymbolData | null>(null);
  const [form, setForm] = useState<Partial<SymbolData>>({});

  function open(s: SymbolData) {
    setSelected(s);
    setForm({ name: s.name, general: s.general, love: s.love, money: s.money, career: s.career });
  }

  if (selected) {
    const fields: Array<[keyof SymbolData, string]> = [
      ['name', 'Ad'], ['general', 'Genel yorum'], ['love', 'Aşk yorumu'],
      ['money', 'Para yorumu'], ['career', 'Kariyer yorumu'],
    ];
    return (
      <div className="rounded-2xl border border-gold/20 bg-veil/40 p-6">
        <h2 className="font-display text-xl text-mist">{selected.glyph} {selected.name}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map(([f, label]) => (
            <Field key={f} label={label} wide={f !== 'name'}>
              <textarea className="field text-sm" rows={2} value={String(form[f] ?? '')}
                onChange={(e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))} />
            </Field>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={async () => { await mutate('symbol-patch', { id: selected.id, ...form }); setSelected(null); }}
            className="rounded-xl border border-gold/60 bg-gold/10 px-6 py-2.5 text-sm text-gold-pale"
          >Kaydet</button>
          <button onClick={() => setSelected(null)} className="rounded-xl border border-ash/20 px-6 py-2.5 text-sm text-ash">Vazgeç</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {data.symbols.map((s) => (
        <button key={s.id} onClick={() => open(s)} className="card-hover rounded-2xl border border-gold/15 bg-veil/40 p-4 text-center">
          <div className="text-3xl">{s.glyph}</div>
          <p className="mt-2 font-display text-sm text-mist">{s.name}</p>
        </button>
      ))}
    </div>
  );
}

/* ================================================================= Yardımcılar */
function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-xs text-ash">{label}</label>
      {children}
    </div>
  );
}
