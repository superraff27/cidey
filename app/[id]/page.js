'use client';

export const runtime = 'edge';

import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';

export default function PlayerPage({ params }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const videoRef = useRef(null);
  const lastPopunderTime = useRef(0);

  // Ambil ID dari params URL
  const { id } = params;

  // 1. Fetch Data Video dari API
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/video/${id}`);
        if (!res.ok) {
          throw new Error('Video tidak ditemukan atau link sudah kedaluwarsa.');
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // 2. Anti-AdBlock Detector
  useEffect(() => {
    const checkAdBlock = async () => {
      try {
        // Coba panggil URL pelacak iklan populer untuk mengetes pemblokiran
        const res = await fetch(
          'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
          { method: 'HEAD', mode: 'no-cors' }
        );
      } catch (e) {
        // Jika gagal dipanggil, indikasi kuat AdBlock aktif
        setAdBlockDetected(true);
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
    };

    checkAdBlock();
  }, []);

  // 3. Global Click Handler (Shopee Affiliate / Smartlink) dengan Cooldown 30 Detik
  useEffect(() => {
    if (!data?.redirectUrl) return;

    const handleGlobalClick = (e) => {
      // Biarkan klik di elemen tombol share/report berjalan normal tanpa memicu popunder
      if (e.target.closest('button') || e.target.closest('a')) return;

      const now = Date.now();
      const COOLDOWN_MS = 30000; // Jeda 30 detik untuk menjaga kualitas CPM

      if (now - lastPopunderTime.current >= COOLDOWN_MS) {
        lastPopunderTime.current = now;
        window.open(data.redirectUrl, '_blank', 'noopener,noreferrer');
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [data]);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#888' }}>Memuat player...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Video Tidak Tersedia</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>{error || 'Link tidak valid.'}</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0d0d0d', color: '#e5e5e5', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Dynamic Ad Injections */}
      {data.popunderCode && (
        <div dangerouslySetInnerHTML={{ __html: data.popunderCode }} />
      )}
      {data.socialBarCode && (
        <div dangerouslySetInnerHTML={{ __html: data.socialBarCode }} />
      )}
      {data.monetagCode && (
        <div dangerouslySetInnerHTML={{ __html: data.monetagCode }} />
      )}
      {data.vignetteCode && (
        <div dangerouslySetInnerHTML={{ __html: data.vignetteCode }} />
      )}

      {/* Overlay Anti-AdBlock */}
      {adBlockDetected && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '22px' }}>AdBlocker Terdeteksi!</h2>
          <p style={{ color: '#aaa', maxWidth: '420px', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            Harap nonaktifkan AdBlocker / Pemblokir Iklan pada browser Anda untuk melanjutkan pemutaran video.
          </p>
          <button onClick={() => window.location.reload()} style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Saya Sudah Mematikan AdBlock
          </button>
        </div>
      )}

      {/* Header / Brand Navbar */}
      <header style={{ borderBottom: '1px solid #1f1f1f', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '-0.5px', margin: 0, color: '#fff' }}>cidey</h1>
        <span style={{ fontSize: '12px', color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          ● Secure Proxy Stream
        </span>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '840px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Video Player Box */}
        <div style={{ backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', border: '1px solid #222', position: 'relative', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          <video
            ref={videoRef}
            src={data.videoUrl}
            controls
            controlsList="nodownload"
            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '70vh' }}
          />
        </div>

        {/* Video Info & Actions */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '500', margin: 0, color: '#fff' }}>Shared Stream #{id}</h2>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Bypassed via Cidey Engine • Full Speed</p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link video telah disalin!');
              }}
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#ccc', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
            >
              Share Link
            </button>

            {data.redirectUrl && (
              <a
                href={data.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: '#fff', color: '#000', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}
              >
                Fast Download
              </a>
            )}
          </div>
        </div>

        {/* Dedicated Banner Ad Placement (300x250) */}
        {data.bannerCode ? (
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#444', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>Advertisement</span>
            <div dangerouslySetInnerHTML={{ __html: data.bannerCode }} />
          </div>
        ) : null}

      </main>

      {/* Footer Compliance Standards */}
      <footer style={{ marginTop: '60px', borderTop: '1px solid #1a1a1a', padding: '24px 16px', textAlign: 'center', fontSize: '12px', color: '#555' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '12px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('Cidey Engine: Proxy Stream Delivery Platform.'); }} style={{ color: '#777', textDecoration: 'none' }}>Terms of Service</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('We respect privacy. No personal data logged.'); }} style={{ color: '#777', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('For copyright inquiries or video takedown requests, contact the domain administrator.'); }} style={{ color: '#777', textDecoration: 'none' }}>DMCA / Report Takedown</a>
        </div>
        <p style={{ margin: 0, color: '#444' }}>© 2026 Cidey Engine. All rights reserved.</p>
      </footer>

    </div>
  );
}