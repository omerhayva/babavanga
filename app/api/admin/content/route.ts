/**
 * Admin içerik API'si.
 *
 * GET  — tüm düzenlenebilir içeriği döndürür (soru, parça, kategori,
 *        tarot, numeroloji, sembol) + temel istatistikler.
 * POST — içerik mutasyonu. /data dosyalarına değil, storage içindeki
 *        override katmanına yazar; kod değişikliği gerekmez.
 *
 * Tüm çağrılar imzalı admin cookie'si ister.
 */
import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';
import {
  getQuestions, getFragments, getCategories, getTarotDeck,
  getNumerologyData, getSymbols, saveOverrides, getOverrides,
} from '@/lib/db/content';
import { isAdminRequest } from '@/lib/auth/session';
import { summarizeEvents } from '@/lib/analytics/events';
import { readJson, cleanString, ValidationError } from '@/lib/security/validate';
import type {
  Question, Fragment, QuestionCategoryDef, TarotCardData,
  NumerologyNumberData, SymbolData, ContentOverrides, FragmentSection,
} from '@/lib/types/models';
import { ok, fail, handleError, guard } from '@/lib/api/helpers';

export const runtime = 'nodejs';

const SECTIONS: FragmentSection[] = [
  'opening', 'situation', 'hidden', 'energy', 'influence',
  'possibility', 'opportunity', 'warning', 'timing', 'closing',
];

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!isAdminRequest()) return fail('Yetkisiz.', 401);
  const g = guard(req, 'admin', 300, 60 * 1000);
  return g;
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth) return auth;
    const stats = {
      sessions: store.count('sessions'),
      readings: store.count('readings'),
      users: store.count('users'),
      payments: store.count('payments'),
      events: summarizeEvents(),
    };
    return ok({
      questions: getQuestions(),
      fragments: getFragments(),
      categories: getCategories(),
      tarot: getTarotDeck(),
      numerology: getNumerologyData(),
      symbols: getSymbols(),
      stats,
    });
  } catch (err) {
    return handleError(err);
  }
}

// -------------------------------------------------------------- doğrulayıcılar

function asStringArray(v: unknown, max: number, field: string): string[] {
  if (!Array.isArray(v)) throw new ValidationError(`${field} dizi olmalı.`);
  return v.slice(0, max).map((x) => cleanString(x, 300, field));
}

function validateQuestion(p: Record<string, unknown>): Question {
  const id = cleanString(p.id, 64, 'soru id');
  if (!/^[a-z0-9_]+$/i.test(id)) throw new ValidationError('id sadece harf/rakam/alt çizgi olabilir.');
  const text = cleanString(p.text, 300, 'soru metni');
  if (text.length < 5) throw new ValidationError('Soru metni çok kısa.');
  const type = String(p.type);
  if (!['single', 'multi', 'scale', 'number'].includes(type)) {
    throw new ValidationError('Geçersiz soru tipi.');
  }
  if (!Array.isArray(p.options) || p.options.length < 1) {
    throw new ValidationError('En az bir seçenek gerekli.');
  }
  const options = (p.options as Record<string, unknown>[]).slice(0, 12).map((o) => ({
    value: cleanString(o.value, 40, 'seçenek değeri'),
    label: cleanString(o.label, 120, 'seçenek etiketi'),
    next: o.next ? cleanString(o.next, 64, 'next') : undefined,
    glyph: o.glyph ? cleanString(o.glyph, 8, 'glyph') : undefined,
    scores: (o.scores && typeof o.scores === 'object' ? o.scores : undefined) as Question['options'][0]['scores'],
  }));
  const q: Question = {
    id,
    category: cleanString(p.category, 30, 'kategori'),
    text,
    helperText: p.helperText ? cleanString(p.helperText, 200, 'yardım metni') : undefined,
    type: type as Question['type'],
    options,
    conditions: Array.isArray(p.conditions)
      ? (p.conditions as Question['conditions'])
      : undefined,
    nextQuestion: p.nextQuestion ? cleanString(p.nextQuestion, 64, 'nextQuestion') : undefined,
    weight: Math.min(5, Math.max(1, Number(p.weight) || 2)),
    tags: Array.isArray(p.tags) ? asStringArray(p.tags, 8, 'etiket') : [],
    scoring: (p.scoring && typeof p.scoring === 'object' ? p.scoring : undefined) as Question['scoring'],
    required: p.required !== false,
    order: Number.isFinite(Number(p.order)) ? Number(p.order) : 500,
    stage: (['core', 'depth', 'generic'].includes(String(p.stage)) ? String(p.stage) : 'core') as Question['stage'],
    minSelected: p.minSelected ? Number(p.minSelected) : undefined,
    maxSelected: p.maxSelected ? Number(p.maxSelected) : undefined,
    scaleLabels: (Array.isArray(p.scaleLabels) && p.scaleLabels.length === 2
      ? [cleanString(p.scaleLabels[0], 60, 'ölçek'), cleanString(p.scaleLabels[1], 60, 'ölçek')] as [string, string]
      : undefined),
  };
  return q;
}

function validateFragment(p: Record<string, unknown>): Fragment {
  const id = cleanString(p.id, 64, 'parça id');
  const section = String(p.section) as FragmentSection;
  if (!SECTIONS.includes(section)) throw new ValidationError('Geçersiz bölüm.');
  const text = cleanString(p.text, 500, 'parça metni');
  if (text.length < 10) throw new ValidationError('Parça metni çok kısa.');
  return {
    id,
    section,
    categories: Array.isArray(p.categories) ? asStringArray(p.categories, 6, 'kategori') : undefined,
    tags: Array.isArray(p.tags) ? asStringArray(p.tags, 6, 'etiket') : undefined,
    text,
  };
}

function validateCategory(p: Record<string, unknown>): QuestionCategoryDef {
  return {
    id: cleanString(p.id, 30, 'kategori id'),
    name: cleanString(p.name, 40, 'kategori adı'),
    description: cleanString(p.description, 200, 'açıklama'),
    glyph: cleanString(p.glyph ?? '◈', 8, 'sembol'),
    keywords: Array.isArray(p.keywords) ? asStringArray(p.keywords, 30, 'anahtar kelime') : [],
  };
}

// -------------------------------------------------------------- POST

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth) return auth;

    const body = await readJson(req, 512 * 1024);
    const action = cleanString(body.action, 40, 'işlem');
    const payload = (body.payload ?? {}) as Record<string, unknown>;

    const ov: ContentOverrides = JSON.parse(JSON.stringify(getOverrides()));

    switch (action) {
      case 'question-upsert': {
        const q = validateQuestion(payload);
        const i = ov.questions.upserts.findIndex((x) => x.id === q.id);
        if (i >= 0) ov.questions.upserts[i] = q;
        else ov.questions.upserts.push(q);
        ov.questions.deletedIds = ov.questions.deletedIds.filter((id) => id !== q.id);
        break;
      }
      case 'question-delete': {
        const id = cleanString(payload.id, 64, 'id');
        ov.questions.deletedIds.push(id);
        ov.questions.upserts = ov.questions.upserts.filter((q) => q.id !== id);
        break;
      }
      case 'fragment-upsert': {
        const f = validateFragment(payload);
        const i = ov.fragments.upserts.findIndex((x) => x.id === f.id);
        if (i >= 0) ov.fragments.upserts[i] = f;
        else ov.fragments.upserts.push(f);
        ov.fragments.deletedIds = ov.fragments.deletedIds.filter((id) => id !== f.id);
        break;
      }
      case 'fragment-delete': {
        const id = cleanString(payload.id, 64, 'id');
        ov.fragments.deletedIds.push(id);
        ov.fragments.upserts = ov.fragments.upserts.filter((f) => f.id !== id);
        break;
      }
      case 'category-upsert': {
        const c = validateCategory(payload);
        const i = ov.categories.upserts.findIndex((x) => x.id === c.id);
        if (i >= 0) ov.categories.upserts[i] = c;
        else ov.categories.upserts.push(c);
        ov.categories.deletedIds = ov.categories.deletedIds.filter((id) => id !== c.id);
        break;
      }
      case 'category-delete': {
        const id = cleanString(payload.id, 30, 'id');
        ov.categories.deletedIds.push(id);
        ov.categories.upserts = ov.categories.upserts.filter((c) => c.id !== id);
        break;
      }
      case 'tarot-patch': {
        const id = String(Number(payload.id));
        const patch: Partial<TarotCardData> = {};
        const strFields: Array<keyof TarotCardData> = [
          'upright', 'reversed', 'love', 'money', 'career', 'future',
          'warning', 'opportunity', 'timing', 'nameTr',
        ];
        for (const f of strFields) {
          const v = payload[f as string];
          if (typeof v === 'string') {
            (patch as Record<string, unknown>)[f] = cleanString(v, 400, String(f));
          }
        }
        if (Array.isArray(payload.keywords)) {
          patch.keywords = asStringArray(payload.keywords, 6, 'anahtar kelime');
        }
        ov.tarot[id] = { ...(ov.tarot[id] ?? {}), ...patch };
        break;
      }
      case 'numerology-set': {
        const key = String(Number(payload.key));
        const d = (payload.data ?? {}) as Record<string, unknown>;
        const data: NumerologyNumberData = {
          themes: asStringArray(d.themes ?? [], 10, 'tema'),
          positive: asStringArray(d.positive ?? [], 10, 'olumlu'),
          negative: asStringArray(d.negative ?? [], 10, 'olumsuz'),
          love: asStringArray(d.love ?? [], 10, 'aşk'),
          money: asStringArray(d.money ?? [], 10, 'para'),
          career: asStringArray(d.career ?? [], 10, 'kariyer'),
        };
        ov.numerology[key] = data;
        break;
      }
      case 'symbol-patch': {
        const id = cleanString(payload.id, 30, 'sembol id');
        const patch: Partial<SymbolData> = {};
        for (const f of ['general', 'love', 'money', 'career', 'name'] as const) {
          const v = payload[f];
          if (typeof v === 'string') patch[f] = cleanString(v, 400, f);
        }
        ov.symbols[id] = { ...(ov.symbols[id] ?? {}), ...patch };
        break;
      }
      default:
        return fail('Bilinmeyen işlem.', 400);
    }

    await saveOverrides(ov);
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
