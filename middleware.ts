import { NextRequest, NextResponse } from 'next/server';

/**
 * Her isteğe güvenlik başlıkları ekler ve misafir kimliğini (cookie) oluşturur.
 * Cookie yoksa hem yanıtla set edilir hem de bu isteğin downstream
 * handler'larına iletilir — böylece ilk API çağrısında bile sahiplik tutarlıdır.
 */
export function middleware(req: NextRequest) {
  let setGuest = false;
  if (!req.cookies.get('bv_guest')) {
    req.cookies.set('bv_guest', crypto.randomUUID());
    setGuest = true;
  }
  const res = NextResponse.next({ request: { headers: req.headers } });
  if (setGuest) {
    const guest = req.cookies.get('bv_guest')?.value;
    if (guest) {
      res.cookies.set('bv_guest', guest, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 400 * 24 * 3600,
      });
    }
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
