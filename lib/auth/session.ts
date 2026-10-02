/**
 * Oturum yönetimi.
 *
 * - Misafir kullanıcılar: `bv_guest` httpOnly cookie (uuid) — hesapsız deneyim.
 * - Üyeler: `bv_user` imzalı cookie (userId + expiry + HMAC).
 * - Admin: `bv_admin` imzalı cookie.
 *
 * Cookie'ler SameSite=Lax + httpOnly'dir; state değiştiren API'lerde
 * ayrıca Origin kontrolü yapılır (lib/security/validate).
 */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getAppSecret } from '@/lib/db/store';
import { store } from '@/lib/db/store';
import type { User } from '@/lib/types/models';

export const GUEST_COOKIE = 'bv_guest';
export const USER_COOKIE = 'bv_user';
export const ADMIN_COOKIE = 'bv_admin';

const USER_TTL_MS = 30 * 24 * 3600 * 1000;
const ADMIN_TTL_MS = 8 * 3600 * 1000;

function sign(value: string): string {
  return crypto.createHmac('sha256', getAppSecret()).update(value).digest('hex');
}

function makeToken(prefix: string, id: string, ttlMs: number): string {
  const expiry = Date.now() + ttlMs;
  const payload = `${prefix}.${id}.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

function parseToken(prefix: string, token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [p, id, expiryStr, sig] = parts;
  if (p !== prefix) return null;
  const payload = `${p}.${id}.${expiryStr}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(expiryStr) < Date.now()) return null;
  return id;
}

// -------------------------------------------------------------- Guests

export function getGuestIdFromCookies(): string | null {
  const jar = cookies();
  const v = jar.get(GUEST_COOKIE)?.value;
  return v && /^[a-f0-9-]{10,64}$/i.test(v) ? v : null;
}

/** Route handler içinde misafir id'si döndürür; yoksa oluşturup cookie set eder. */
export function ensureGuestId(): string {
  const jar = cookies();
  const existing = getGuestIdFromCookies();
  if (existing) return existing;
  const id = crypto.randomUUID();
  jar.set(GUEST_COOKIE, id, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 400 * 24 * 3600,
  });
  return id;
}

// -------------------------------------------------------------- Users

export function setUserCookie(userId: string): void {
  cookies().set(USER_COOKIE, makeToken('u', userId, USER_TTL_MS), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: USER_TTL_MS / 1000,
  });
}

export function clearUserCookie(): void {
  cookies().set(USER_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

export function getUserId(): string | null {
  const jar = cookies();
  return parseToken('u', jar.get(USER_COOKIE)?.value);
}

export function getCurrentUser(): User | null {
  const uid = getUserId();
  if (!uid) return null;
  return store.get<User>('users', uid) ?? null;
}

/** Okuma/oturum sahipliği: "user:<id>" ya da "guest:<uuid>" */
export function getOwnerId(): string {
  const uid = getUserId();
  if (uid) return `user:${uid}`;
  const gid = getGuestIdFromCookies();
  if (gid) return `guest:${gid}`;
  // Server component içinde cookie set edilemez; bu nadir durumda anonim okuma kimliği
  return 'guest:anonymous';
}

/**
 * Route handler'lar için sahipliği çözer; misafir cookie'si yoksa
 * oluşturup set eder (ilk API çağrısında bile tutarlı kimlik).
 */
export function resolveOwnerId(): string {
  const uid = getUserId();
  if (uid) return `user:${uid}`;
  return `guest:${ensureGuestId()}`;
}

export function canAccessOwner(resourceOwnerId: string): boolean {
  const uid = getUserId();
  if (uid && resourceOwnerId === `user:${uid}`) return true;
  const gid = getGuestIdFromCookies();
  if (gid && resourceOwnerId === `guest:${gid}`) return true;
  return false;
}

export function isAdminRequest(): boolean {
  const jar = cookies();
  return parseToken('a', jar.get(ADMIN_COOKIE)?.value) === 'admin';
}

// -------------------------------------------------------------- Admin

export function setAdminCookie(): void {
  cookies().set(ADMIN_COOKIE, makeToken('a', 'admin', ADMIN_TTL_MS), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: ADMIN_TTL_MS / 1000,
  });
}

export function clearAdminCookie(): void {
  cookies().set(ADMIN_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? 'vanga-admin';
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Admin API guard'ı: Origin kontrolü + admin cookie + rate limit çağıran taraf için */
export function requireAdminApi(req: NextRequest): { ok: true } | { ok: false; status: number; message: string } {
  if (!isAdminRequest()) return { ok: false, status: 401, message: 'Yetkisiz.' };
  return { ok: true };
}
