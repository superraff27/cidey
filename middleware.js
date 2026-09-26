import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Path yang di-exclude dari pengecekan middleware (asset statis, dll)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // PENTING: di dalam Middleware, process.env kadang tidak ter-populate
  // dengan benar oleh @cloudflare/next-on-pages. Jadi kita coba ambil
  // dari getRequestContext().env dulu (cara yang benar untuk Middleware),
  // dengan fallback ke process.env untuk local dev (next dev).
  let playerDomain;
  let generatorDomain;
  try {
    const ctxEnv = getRequestContext().env;
    playerDomain = ctxEnv.NEXT_PUBLIC_PLAYER_DOMAIN || process.env.NEXT_PUBLIC_PLAYER_DOMAIN;
    generatorDomain = ctxEnv.NEXT_PUBLIC_GENERATOR_DOMAIN || process.env.NEXT_PUBLIC_GENERATOR_DOMAIN;
  } catch (e) {
    playerDomain = process.env.NEXT_PUBLIC_PLAYER_DOMAIN;
    generatorDomain = process.env.NEXT_PUBLIC_GENERATOR_DOMAIN;
  }

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

  // Diakses dari domain PLAYER tapi minta halaman generator -> tampilkan error 404,
  // JANGAN redirect (supaya orang lain tidak tahu/bisa akses domain generator-nya)
  if (isPlayerHost && isGeneratorPath) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<title>404 - Halaman Tidak Ditemukan</title>
<style>
  body { background:#0a0a0a; color:#e5e5e5; font-family: system-ui, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
  .box { text-align:center; }
  h1 { font-size:22px; font-weight:600; margin-bottom:8px; }
  p { color:#888; font-size:14px; }
</style>
</head>
<body>
  <div class="box">
    <h1>404 - Halaman Tidak Ditemukan</h1>
    <p>Halaman yang kamu cari tidak tersedia.</p>
  </div>
</body>
</html>`,
      { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }

  // Diakses dari domain GENERATOR tapi minta halaman player (buka link video langsung disini) -> lempar ke domain player
  if (isGeneratorHost && isPlayerPath && generatorDomain !== playerDomain) {
    return NextResponse.redirect(`https://${playerDomain}${pathname}`);
  }

  return NextResponse.next();
}