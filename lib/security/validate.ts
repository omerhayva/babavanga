/**
 * Girdi doğrulama ve temel web güvenliği yardımcıları.
 * (Bağımlılıksız, küçük ve katı doğrulayıcılar)
 */
import { NextRequest } from 'next/server';

export class ValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Güvenli string: trim, uzunluk sınırı, kontrol karakterleri temizliği */
export function cleanString(value: unknown, maxLen = 300, field = 'değer'): string {
  if (typeof value !== 'string') throw new ValidationError(`Geçersiz ${field}.`);
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  if (cleaned.length > maxLen) throw new ValidationError(`${field} çok uzun (en fazla ${maxLen}).`);
  return cleaned;
}

export function optionalString(value: unknown, maxLen = 300, field = 'değer'): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return cleanString(value, maxLen, field);
}

/** YYYY-MM-DD doğrulaması + gerçek tarih kontrolü */
export function cleanDate(value: unknown, field = 'tarih'): string {
  const s = cleanString(value, 10, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new ValidationError(`${field} biçimi geçersiz.`);
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new ValidationError(`${field} geçersiz.`);
  const year = d.getUTCFullYear();
  if (year < 1900 || year > 2100) throw new ValidationError(`${field} aralık dışı (1900-2100).`);
  return s;
}

export function cleanTime(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const s = cleanString(value, 5, 'saat');
  if (!/^\d{2}:\d{2}$/.test(s)) throw new ValidationError('Saat biçimi geçersiz (ÖÖ:SS).');
  const [h, m] = s.split(':').map(Number);
  if (h > 23 || m > 59) throw new ValidationError('Saat aralık dışı.');
  return s;
}

export function cleanEmail(value: unknown): string {
  const s = cleanString(value, 254, 'e-posta').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) throw new ValidationError('Geçerli bir e-posta gir.');
  return s;
}

export function cleanPassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw new ValidationError('Şifre en az 8 karakter olmalı.');
  }
  return value;
}

/** Sadece güvenli id formatı: harf/rakam/alt tire, maks 64 */
export function cleanId(value: unknown, field = 'id'): string {
  const s = cleanString(value, 64, field);
  if (!/^[A-Za-z0-9_:-]+$/.test(s)) throw new ValidationError(`Geçersiz ${field}.`);
  return s;
}

/** Sayısal değer aralık kontrolü */
export function cleanNumber(value: unknown, min: number, max: number, field = 'sayı'): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new ValidationError(`${field} ${min}-${max} arasında olmalı.`);
  }
  return Math.round(n);
}

/**
 * CSRF koruması: state değiştiren isteklerde Origin/Host eşleşmesi.
 * Next.js SameSite=Lax cookie'leriyle birlikte katmanlı savunma sağlar.
 */
export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get('origin');
  if (!origin) return; // aynı-origin form gönderimleri / curl — cookie taşımayan istekler
  const host = req.headers.get('host');
  try {
    const originHost = new URL(origin).host;
    if (host && originHost !== host) {
      throw new ValidationError('İstek kaynağı geçersiz.');
    }
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    throw new ValidationError('İstek kaynağı geçersiz.');
  }
}

/** JSON body okuma + boyut sınırı */
export async function readJson(req: NextRequest, maxBytes = 32 * 1024): Promise<Record<string, unknown>> {
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    throw new ValidationError('İstek gövdesi okunamadı.');
  }
  if (raw.length > maxBytes) throw new ValidationError('İstek çok büyük.');
  try {
    const parsed = JSON.parse(raw || '{}');
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not object');
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new ValidationError('Geçersiz JSON.');
  }
}
