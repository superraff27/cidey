export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
  }

  try {
    const rawData = await redis.get(id);

    if (!rawData) {
      return NextResponse.json({ error: 'Video tidak ditemukan atau link sudah kedaluwarsa.' }, { status: 404 });
    }

    // Handle format data (Objek JSON baru vs String lama)
    let data;
    if (typeof rawData === 'object' && rawData !== null) {
      data = rawData;
    } else if (typeof rawData === 'string') {
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        // Data lama cuma berupa string URL polos
        data = { videoUrl: rawData };
      }
    } else {
      data = { videoUrl: String(rawData) };
    }

    // Arahkan player untuk streaming lewat proxy, bukan URL asli langsung
    // (menghindari hotlink/referer protection dari CDN sumber video)
    return NextResponse.json({
      videoUrl: `/api/proxy-video?id=${id}`,
      originalVideoUrl: data.videoUrl || '',
      redirectUrl: data.redirectUrl || '',
      popunderCode: data.popunderCode || '',
      socialBarCode: data.socialBarCode || '',
      monetagCode: data.monetagCode || '',
      bannerCode: data.bannerCode || '',
      vignetteCode: data.vignetteCode || '',
    });

  } catch (error) {
    console.error('Error Fetching Video Data:', error);
    return NextResponse.json({ error: 'Gagal mengambil data video' }, { status: 500 });
  }
}