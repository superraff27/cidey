export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { nanoid } from 'nanoid';

export async function POST(request) {
  try {
    const { videoUrl, videoUrls, redirectUrl, popunderCode, socialBarCode, monetagCode, bannerCode, vignetteCode } = await request.json();

    let urlsToProcess = [];
    if (videoUrls && Array.isArray(videoUrls)) {
      urlsToProcess = videoUrls;
    } else if (videoUrl) {
      urlsToProcess = [videoUrl];
    }

    if (urlsToProcess.length === 0) {
      return NextResponse.json({ error: 'URL video wajib diisi' }, { status: 400 });
    }

    const finalRedirect = redirectUrl && redirectUrl.trim() ? redirectUrl.trim() : '';
    const finalPopunder = popunderCode && popunderCode.trim() ? popunderCode.trim() : '';
    const finalSocialBar = socialBarCode && socialBarCode.trim() ? socialBarCode.trim() : '';
    const finalMonetag = monetagCode && monetagCode.trim() ? monetagCode.trim() : '';
    const finalBanner = bannerCode && bannerCode.trim() ? bannerCode.trim() : '';
    const finalVignette = vignetteCode && vignetteCode.trim() ? vignetteCode.trim() : '';
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const results = [];

    for (const url of urlsToProcess) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) continue;

      const id = nanoid(6);
      const dataToStore = {
        videoUrl: trimmedUrl,
        redirectUrl: finalRedirect,
        popunderCode: finalPopunder,
        socialBarCode: finalSocialBar,
        monetagCode: finalMonetag,
        bannerCode: finalBanner,
        vignetteCode: finalVignette,
      };

      // PERBAIKAN: Oper object langsung tanpa JSON.stringify
      await redis.set(id, dataToStore);

      results.push({
        id,
        originalUrl: trimmedUrl,
        generatedUrl: `${baseUrl}/${id}`,
      });
    }

    if (results.length === 0) {
      return NextResponse.json({ error: 'URL video tidak valid' }, { status: 400 });
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Error Generating Link:', error);
    return NextResponse.json({ error: 'Gagal memproses link' }, { status: 500 });
  }
}