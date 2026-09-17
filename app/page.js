'use client';

import { useState } from 'react';

export default function HomePage() {
  const [videoUrlsInput, setVideoUrlsInput] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [popunderCode, setPopunderCode] = useState('');
  const [socialBarCode, setSocialBarCode] = useState('');
  const [monetagCode, setMonetagCode] = useState('');
  const [bannerCode, setBannerCode] = useState(''); // State baru untuk Banner Adsterra
  const [vignetteCode, setVignetteCode] = useState(''); // State baru untuk Vignette Monetag
  const [loading, setLoading] = useState(false);
  const [resultUrls, setResultUrls] = useState([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [history, setHistory] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedHistory = localStorage.getItem('cidey_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.error('Failed to parse history:', e);
      return [];
    }
  });

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    const urlsArray = videoUrlsInput.split('\n').filter(url => url.trim() !== '');
    if (urlsArray.length === 0) {
      setError('Masukkan setidaknya satu URL video');
      return;
    }

    setLoading(true);
    setError('');
    setResultUrls([]);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrls: urlsArray,
          redirectUrl: redirectUrl.trim(),
          popunderCode: popunderCode.trim(),
          socialBarCode: socialBarCode.trim(),
          monetagCode: monetagCode.trim(),
          bannerCode: bannerCode.trim(), // Kirim data Banner ke API
          vignetteCode: vignetteCode.trim(), // Kirim data Vignette ke API
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses link');
      }

      setResultUrls(data.results);

      const newItems = data.results.map(item => ({
        id: item.id,
        url: item.generatedUrl,
        originalUrl: item.originalUrl,
        redirectUrl: redirectUrl.trim() || 'Default Link',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      const updatedHistory = [...newItems, ...history].slice(0, 20);
      setHistory(updatedHistory);
      localStorage.setItem('cidey_history', JSON.stringify(updatedHistory));

    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    const textToCopy = resultUrls.map(r => r.generatedUrl).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cidey_history');
  };

  return (
    <div className="min-h-screen bg-[#151515] text-[#ededed] font-sans antialiased selection:bg-[#333] selection:text-white">
      
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#2b2b2b]">
        <div className="font-bold text-xl tracking-tight text-white">
          cidey
        </div>
        {/* Menu dihilangkan sesuai permintaan */}
      </header>

      {/* Main Content */}
      <main className="max-w-[560px] w-full mx-auto px-4 pt-16 pb-24 flex flex-col">
        
        {/* Title Group */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Generate link video bersih
          </h1>
          <p className="text-[#a3a3a3] text-[15px]">
            Tempel URL video (.mp4), dapatkan halaman pemutar instan.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="flex flex-col gap-5">
          
          {/* Input: URL Video */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#d4d4d4]">
              URL video (.mp4) — bisa lebih dari satu, pisahkan dengan enter
            </label>
            <textarea
              required
              rows={4}
              value={videoUrlsInput}
              onChange={(e) => setVideoUrlsInput(e.target.value)}
              placeholder="https://contoh.com/video.mp4"
              className="w-full p-3.5 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] text-[15px] focus:outline-none focus:border-[#666] transition-colors resize-y"
            />
          </div>

          {/* Input: Smartlink */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#d4d4d4]">
              Smartlink / affiliate (opsional)
            </label>
            <input
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://smartlink.contoh.com"
              className="w-full p-3.5 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] text-[15px] focus:outline-none focus:border-[#666] transition-colors"
            />
          </div>

          {/* Input: Popunder */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#d4d4d4]">
              Script popunder (opsional)
            </label>
            <textarea
              rows={3}
              value={popunderCode}
              onChange={(e) => setPopunderCode(e.target.value)}
              placeholder="<script>...</script>"
              className="w-full p-3.5 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] text-[14px] font-mono focus:outline-none focus:border-[#666] transition-colors"
            />
          </div>

          {/* Input: Social Bar */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#d4d4d4]">
              Script social bar (opsional)
            </label>
            <textarea
              rows={3}
              value={socialBarCode}
              onChange={(e) => setSocialBarCode(e.target.value)}
              placeholder="<script>...</script>"
              className="w-full p-3.5 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] text-[14px] font-mono focus:outline-none focus:border-[#666] transition-colors"
            />
          </div>

          {/* Input: Monetag Popunder */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#d4d4d4]">
              Script Monetag popunder (opsional)
            </label>
            <textarea
              rows={3}
              value={monetagCode}
              onChange={(e) => setMonetagCode(e.target.value)}
              placeholder="<script>...</script>"
              className="w-full p-3.5 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] text-[14px] font-mono focus:outline-none focus:border-[#666] transition-colors"
            />
          </div>

          {/* Input: Banner Ads */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#d4d4d4]">
              Script Banner Ads (opsional - Rekomendasi 300x250)
            </label>
            <textarea
              rows={3}
              value={bannerCode}
              onChange={(e) => setBannerCode(e.target.value)}
              placeholder="<script>...</script>"
              className="w-full p-3.5 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] text-[14px] font-mono focus:outline-none focus:border-[#666] transition-colors"
            />
          </div>

          {/* Input: Vignette Monetag */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#d4d4d4]">
              Script Vignette Monetag (opsional)
            </label>
            <textarea
              rows={3}
              value={vignetteCode}
              onChange={(e) => setVignetteCode(e.target.value)}
              placeholder="<script>...</script>"
              className="w-full p-3.5 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] text-[14px] font-mono focus:outline-none focus:border-[#666] transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-lg bg-white hover:bg-[#e5e5e5] text-black font-semibold text-[15px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Memproses...' : 'Buat link'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-[#3a1a1a] border border-[#5a2a2a] text-[#ff8080] text-[14px] text-center">
            {error}
          </div>
        )}

        {/* Success Result */}
        {resultUrls.length > 0 && (
          <div className="mt-8 pt-8 border-t border-[#2b2b2b] animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-medium text-white">✓ {resultUrls.length} link berhasil dibuat</span>
              <button
                type="button"
                onClick={handleCopyAll}
                className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  copiedAll ? 'bg-white text-black' : 'bg-[#262626] text-[#d4d4d4] hover:bg-[#333]'
                }`}
              >
                {copiedAll ? 'Tersalin!' : 'Salin Semua'}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {resultUrls.map((item, index) => (
                <div key={item.id || index} className="relative">
                  <input 
                    type="text" 
                    readOnly 
                    value={item.generatedUrl}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-md text-[#d4d4d4] text-[14px] pl-4 pr-12 py-3 focus:outline-none cursor-text font-mono"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => handleCopy(item.generatedUrl)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#666] hover:text-white hover:bg-[#333] transition-colors"
                    title="Copy Link"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer / Copyright */}
        <div className="mt-12 mb-8 text-center">
          <p className="text-[14px] text-[#666]">
            DEVELOPED BY ADMIN
          </p>
        </div>

        {/* Minimalist History Section */}
        {history.length > 0 && (
          <div className="mt-8 pt-8 border-t border-[#2b2b2b] animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-medium text-white">Riwayat Link</h3>
              <button 
                onClick={clearHistory}
                className="text-[13px] text-[#666] hover:text-[#d4d4d4] transition-colors"
              >
                Bersihkan riwayat
              </button>
            </div>
            
            <div className="grid gap-3">
              {history.map((item) => (
                <div key={item.id} className="p-3.5 rounded-lg bg-[#1a1a1a] border border-[#2b2b2b] flex items-center justify-between group">
                  <div className="overflow-hidden pr-4 flex-1">
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-[14px] font-medium text-[#d4d4d4] hover:text-white transition-colors truncate block">
                      {item.url.replace(/^https?:\/\//, '')}
                    </a>
                    <div className="text-[12px] text-[#666] mt-1 truncate">
                      {item.originalUrl}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(item.url)}
                    className="p-2 rounded-md text-[#666] hover:text-white hover:bg-[#333] transition-colors shrink-0"
                    title="Salin Link"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}