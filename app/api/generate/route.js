export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { nanoid } from 'nanoid';

export async function POST(request) {
  try {
    const { videoUrl, videoUrls, redirectUrl, popunderCode, socialBarCode, monetagCode, bannerCode, vignetteCode } = await request.json(); // Tambahkan vignetteCode

    // Mendukung input array (bulk) maupun single string
    let urlsToProcess = [];
    if (videoUrls && Array.isArray(videoUrls)) {
      urlsToProcess = videoUrls;
    } else if (videoUrl) {
      urlsToProcess = [videoUrl];
    }

    if (urlsToProcess.length === 0) {
      return NextResponse.json({ error: 'URL video wajib diisi' }, { status: 400 });
    }

    const defaultRedirect = 'https://s.shopee.co.id/903zrG9yQZ';
    const finalRedirect = redirectUrl && redirectUrl.trim() ? redirectUrl.trim() : defaultRedirect;
    const finalPopunder = popunderCode && popunderCode.trim() ? popunderCode.trim() : '';
    const finalSocialBar = socialBarCode && socialBarCode.trim() ? socialBarCode.trim() : '';
    const finalMonetag = monetagCode && monetagCode.trim() ? monetagCode.trim() : '';
    const finalBanner = bannerCode && bannerCode.trim() ? bannerCode.trim() : ''; // Parse Banner Code
    const finalVignette = vignetteCode && vignetteCode.trim() ? vignetteCode.trim() : ''; // Parse Vignette Code
    
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const results = [];

    // Loop & Generate ID untuk setiap baris URL
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
        bannerCode: finalBanner, // Simpan ke Redis
        vignetteCode: finalVignette, // Simpan Vignette ke Redis
      };

      await redis.set(id, JSON.stringify(dataToStore));

      results.push({
        id,
        originalUrl: trimmedUrl,
        generatedUrl: `${baseUrl}/${id}`,
      });
    }

    if (results.length === 0) {
      return NextResponse.json({ error: 'URL video tidak valid' }, { status: 400 });
    }

    // Mengembalikan sekumpulan hasil generate
    return NextResponse.json({ results });

  } catch (error) {
    console.error('Error Generating Link:', error);
    return NextResponse.json({ error: 'Gagal memproses link' }, { status: 500 });
  }
}