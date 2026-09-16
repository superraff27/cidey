export const runtime = 'edge';

import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing Video ID', { status: 400 });
  }

  try {
    let rawData = await redis.get(id);

    if (!rawData) {
      return new Response('Video not found in Database', { status: 404 });
    }

    let videoUrl = '';

    // Handle data format (Objek JSON baru vs String lama)
    if (typeof rawData === 'object' && rawData !== null) {
      videoUrl = rawData.videoUrl || '';
    } else if (typeof rawData === 'string') {
      if (rawData.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawData);
          videoUrl = parsed.videoUrl || '';
        } catch (e) {
          videoUrl = rawData;
        }
      } else {
        videoUrl = rawData;
      }
    }

    videoUrl = videoUrl.replace(/['"]/g, '').trim();
    if (!videoUrl.startsWith('http')) {
      videoUrl = `https://${videoUrl}`;
    }

    const fetchHeaders = new Headers();
    const range = request.headers.get('range');
    if (range) fetchHeaders.set('Range', range);

    fetchHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    fetchHeaders.set('Referer', 'https://videy.co/');
    fetchHeaders.set('Accept', '*/*');

    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: fetchHeaders,
      cache: 'no-store',
    });

    if (!response.ok && response.status !== 206) {
      console.error(`Upstream Error dari Videy: ${response.status}`);
      return new Response(`Error from CDN: ${response.status}`, { status: response.status });
    }

    const responseHeaders = new Headers();
    const headersToKeep = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

    for (const header of headersToKeep) {
      if (response.headers.has(header)) {
        responseHeaders.set(header, response.headers.get(header));
      }
    }
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Fatal Proxy Error:', error);
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}