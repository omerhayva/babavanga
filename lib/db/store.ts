/**
 * JSON tabanlı, sıfır bağımlılıklı depolama katmanı.
 *
 * Tasarım notu: Katman, koleksiyon bazlı basit bir API sunar. İleride
 * SQLite (better-sqlite3) veya PostgreSQL sürücüsü eklemek istenirse
 * yalnızca bu dosyanın implementasyonu değişir; çağıran kod aynen kalır.
 *
 * Sadece sunucu tarafında (route handler / server component) kullanılır.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const STORE_DIR = path.join(process.cwd(), 'storage');

type Row = { id: string };

interface CacheEntry { mtimeMs: number; data: unknown[] }

const g = globalThis as unknown as {
  __bv_store_cache?: Map<string, CacheEntry>;
  __bv_store_lock?: Promise<void>;
};
const cache = (g.__bv_store_cache ??= new Map());
// Basit yazma kilidi: paralel yazmaları sıraya koyar.
const lock = (g.__bv_store_lock ??= Promise.resolve());

function fileFor(name: string): string {
  return path.join(STORE_DIR, `${name}.json`);
}

function ensureDir(): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
}

function readRaw<T extends Row>(name: string): T[] {
  const file = fileFor(name);
  if (!fs.existsSync(file)) return [];
  const stat = fs.statSync(file);
  const cached = cache.get(name);
  if (cached && cached.mtimeMs === stat.mtimeMs) return cached.data as T[];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as T[];
    const rows = Array.isArray(parsed) ? parsed : [];
    cache.set(name, { mtimeMs: stat.mtimeMs, data: rows });
    return rows;
  } catch {
    return [];
  }
}

function writeRaw<T extends Row>(name: string, rows: T[]): void {
  ensureDir();
  const file = fileFor(name);
  const tmp = `${file}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 1), 'utf8');
  fs.renameSync(tmp, file); // atomik yazma
  cache.delete(name);
}

/** Yazmaları sıraya alan sarmalayıcı */
function withLock<T>(fn: () => T): Promise<T> {
  const run = lock.then(fn);
  g.__bv_store_lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

// -------------------------------------------------------------- Public API

export const store = {
  all<T extends Row>(name: string): T[] {
    return readRaw<T>(name);
  },

  get<T extends Row>(name: string, id: string): T | undefined {
    return readRaw<T>(name).find((r) => r.id === id);
  },

  find<T extends Row>(name: string, pred: (row: T) => boolean): T | undefined {
    return readRaw<T>(name).find(pred);
  },

  filter<T extends Row>(name: string, pred: (row: T) => boolean): T[] {
    return readRaw<T>(name).filter(pred);
  },

  insert<T extends Row>(name: string, row: T): Promise<T> {
    return withLock(() => {
      const rows = readRaw<T>(name);
      rows.push(row);
      writeRaw(name, rows);
      return row;
    });
  },

  upsert<T extends Row>(name: string, row: T): Promise<T> {
    return withLock(() => {
      const rows = readRaw<T>(name);
      const idx = rows.findIndex((r) => r.id === row.id);
      if (idx >= 0) rows[idx] = row;
      else rows.push(row);
      writeRaw(name, rows);
      return row;
    });
  },

  update<T extends Row>(name: string, id: string, patch: Partial<T>): Promise<T | undefined> {
    return withLock(() => {
      const rows = readRaw<T>(name);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return undefined;
      rows[idx] = { ...rows[idx], ...patch };
      writeRaw(name, rows);
      return rows[idx];
    });
  },

  remove<T extends Row>(name: string, id: string): Promise<boolean> {
    return withLock(() => {
      const rows = readRaw<T>(name);
      const next = rows.filter((r) => r.id !== id);
      if (next.length === rows.length) return false;
      writeRaw(name, next);
      return true;
    });
  },

  count(name: string): number {
    return readRaw(name).length;
  },
};

/** Yeni benzersiz id */
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(9).toString('hex')}`;
}

/** Kalıcı uygulama sırrı (cookie imzalama) */
export function getAppSecret(): string {
  const fromEnv = process.env.APP_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  const file = path.join(STORE_DIR, 'app-secret');
  ensureDir();
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(file, secret, 'utf8');
  return secret;
}
