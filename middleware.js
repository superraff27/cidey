import { NextResponse } from 'next/server';

// Path yang di-exclude dari pengecekan middleware (asset statis, dll)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  const playerDomain = process.env.NEXT_PUBLIC_PLAYER_DOMAIN; // contoh: "nontonvid.com"
  const generatorDomain = process.env.NEXT_PUBLIC_GENERATOR_DOMAIN; // contoh: "toolsaya.com"

  // Kalau kedua env var belum diset, jangan block apapun
  // (supaya development lokal / domain .pages.dev default tetap jalan normal seperti biasa)
  if (!playerDomain && !generatorDomain) {
    return NextResponse.next();
  }

  const isPlayerHost = playerDomain && hostname.includes(playerDomain);
  const isGeneratorHost = generatorDomain && hostname.includes(generatorDomain);

  // Pola path video player: /xxxxxx (6 karakter, sesuai nanoid(6) di generate/route.js)
  const isPlayerPath =
    pathname.startsWith('/api/video') ||
    pathname.startsWith('/api/proxy-video') ||
    /^\/[a-zA-Z0-9_-]{6}$/.test(pathname);

  const isGeneratorPath = pathname === '/' || pathname.startsWith('/api/generate');

  // Diakses dari domain PLAYER tapi minta halaman generator -> lempar ke domain generator
  if (isPlayerHost && isGeneratorPath && generatorDomain) {
    return NextResponse.redirect(`https://${generatorDomain}${pathname}`);
  }

  // Diakses dari domain GENERATOR tapi minta halaman player (buka link video langsung disini) -> lempar ke domain player
  if (isGeneratorHost && isPlayerPath && generatorDomain !== playerDomain) {
    return NextResponse.redirect(`https://${playerDomain}${pathname}`);
  }

  return NextResponse.next();
}