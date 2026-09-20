import { useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Download, Link2, Share2, Zap, X } from 'lucide-react';
import html2canvas from 'html2canvas';

type Lang = 'en' | 'ar';

const copy = {
  en: {
    backHome: 'Back to Home',
    title: 'Your Viral Share Card',
    subtitle: 'Share your hidden cost with the world',
    download: 'Download Card',
    share: 'Share',
    copied: 'Copied!',
    copyLink: 'Copy Link',
    shareText: 'MY HIDDEN COST: {hours} Working Hours / Year. How much does your lifestyle cost in time? Calculate yours →',
    shareTitle: 'Share Your Hidden Cost',
    shareSub: 'Pick a platform to share',
    close: 'Close',
    cardHeader: 'Hidden Cost',
    cardSub: 'Decision Simulator',
    cardBadge: 'MY HIDDEN COST',
    cardLabel: 'Working Hours / Year',
    cardCta: 'Calculate yours →',
    prompt: 'How much does your lifestyle cost in time?',
  },
  ar: {
    backHome: 'العودة للرئيسية',
    title: 'بطاقة المشاركة',
    subtitle: 'شارك تكلففتك الخفية مع العالم',
    download: 'تحميل البطاقة',
    share: 'مشاركة',
    copied: 'تم النسخ!',
    copyLink: 'نسخ الرابط',
    shareText: 'تكلفتي الخفية: {hours} ساعة عمل / سنة. كم تكلفك حياتك بالوقت؟ احسب تكاليفك →',
    shareTitle: 'شارك تكلففتك الخفية',
    shareSub: 'اختر منصة للمشاركة',
    close: 'إغلاق',
    cardHeader: 'التكلفة الخفية',
    cardSub: 'محاكي القرارات',
    cardBadge: 'تكلفتي الخفية',
    cardLabel: 'ساعة عمل / سنة',
    cardCta: 'احسب تكاليفك →',
    prompt: 'كم تكلفك حياتك بالوقت؟',
  },
};

function IconWhatsApp({ size = 20 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>; }
function IconX({ size = 20 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }

export function ShareCard({ lang, workHoursPerYear, onHome }: { lang: Lang; workHoursPerYear: number; onHome: () => void }) {
  const isAr = lang === 'ar';
  const t = copy[lang];
  const dir = isAr ? 'rtl' : 'ltr';
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');

  const shareUrl = 'https://hiddencostsimulator.com';
  const shareText = t.shareText.replace('{hours}', String(workHoursPerYear));
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  const downloadCard = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      const link = document.createElement('a');
      link.download = 'hidden-cost-share-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast(isAr ? 'تم تحميل البطاقة!' : 'Card downloaded!');
    } catch { showToast(isAr ? 'فشل التحميل' : 'Download failed'); }
    setDownloading(false);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2400);
  };

  return (
    <div className="app-shell grid-texture" style={{ direction: dir }}>
      <header className="relative z-10 shrink-0 border-b border-white/[.07]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 lg:px-10 lg:py-2.5">
          <button onClick={onHome} className="flex items-center gap-2 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a] text-[#061019] shadow-[0_0_20px_rgba(180,255,58,.25)]"><Zap size={20} strokeWidth={3} fill="currentColor" /></span>
            <span className="font-display leading-none"><strong className="block text-[15px] font-extrabold tracking-tight">{isAr ? 'التكلفة الخفية' : 'Hidden Cost'}</strong><small className="block pt-0.5 text-[10px] font-medium text-slate-300">{isAr ? 'بطاقة المشاركة' : 'Share Card'}</small></span>
          </button>
          <button onClick={onHome} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.03] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-[#b4ff3a]/50 hover:text-white">
            <ArrowLeft size={16} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />{t.backHome}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md px-5 py-6 lg:py-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{t.subtitle}</p>

          {/* Share card */}
          <div className="mx-auto mt-6 w-fit">
            <div ref={cardRef} style={{ width: '380px', height: '600px', background: 'linear-gradient(160deg, #071522 0%, #0b1a28 45%, #112a2b 100%)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: '28px 24px', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', direction: dir, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-80px', right: isAr ? 'auto' : '-80px', left: isAr ? '-80px' : 'auto', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,255,58,0.08) 0%, transparent 70%)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', position: 'relative', flexDirection: isAr ? 'row-reverse' : 'row' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#b4ff3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '15px', fontWeight: 800, color: '#061019' }}>⚡</span></div>
                <div><div style={{ fontSize: '13px', fontWeight: 800, color: '#f6f7f2', lineHeight: 1, textAlign: isAr ? 'right' : 'left' }}>{t.cardHeader}</div><div style={{ fontSize: '8px', color: '#9aaab5', marginTop: '2px', textAlign: isAr ? 'right' : 'left' }}>{t.cardSub}</div></div>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: isAr ? '0' : '0.18em', textTransform: isAr ? 'none' : 'uppercase', color: '#b4ff3a', marginBottom: '5px', position: 'relative', textAlign: isAr ? 'right' : 'left' }}>{t.cardBadge}</div>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#b4ff3a', lineHeight: 1.05, marginBottom: '3px', position: 'relative', textAlign: isAr ? 'right' : 'left' }}>{workHoursPerYear}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#9aaab5', marginBottom: '20px', position: 'relative', textAlign: isAr ? 'right' : 'left' }}>{t.cardLabel}</div>
              <div style={{ marginTop: 'auto', marginBottom: '14px', padding: '14px 16px', borderRadius: '14px', background: 'rgba(180,255,58,0.06)', border: '1px solid rgba(180,255,58,0.15)', position: 'relative' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.5, color: '#e2e8f0', textAlign: isAr ? 'right' : 'left' }}>{t.prompt}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#b4ff3a', marginTop: '8px', textAlign: isAr ? 'right' : 'left' }}>{t.cardCta}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '11px', position: 'relative', flexDirection: isAr ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: '8px', color: '#64748b' }}>CARD</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#9aaab5' }}>hiddencostsimulator.com</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <button onClick={downloadCard} disabled={downloading} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#b4ff3a] px-5 py-3 text-sm font-bold text-[#07121b] shadow-[0_10px_30px_rgba(180,255,58,.16)] transition hover:-translate-y-0.5 hover:bg-[#c4ff63] disabled:opacity-50">
              <Download size={17} /> {downloading ? (isAr ? 'جارٍ التحميل...' : 'Downloading...') : t.download}
            </button>
            <button onClick={() => setShowShare(true)} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.04] px-5 py-3 text-sm font-bold text-white transition hover:border-[#b4ff3a]/60">
              <Share2 size={17} /> {t.share}
            </button>
          </div>
          <button onClick={copyLink} className={`mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-bold transition ${copied ? 'border-[#b4ff3a] bg-[#b4ff3a]/10 text-[#b4ff3a]' : 'border-white/10 bg-white/[.04] text-slate-300 hover:border-white/25'}`}>
            {copied ? <><Check size={17} />{t.copied}</> : <><Link2 size={17} />{t.copyLink}</>}
          </button>
        </div>
      </main>

      {showShare && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b1a28] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ direction: dir }}>
            <button onClick={() => setShowShare(false)} className={isAr ? 'absolute left-4 top-4 text-slate-400 hover:text-white' : 'absolute right-4 top-4 text-slate-400 hover:text-white'} aria-label={t.close}><X size={20} /></button>
            <h2 className="font-display text-lg font-extrabold" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.shareTitle}</h2>
            <p className="mt-1 text-xs text-slate-400" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.shareSub}</p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <a href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white/25"><span className="text-[#25D366]"><IconWhatsApp size={20} /></span>WhatsApp</a>
              <a href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white/25"><span className="text-white"><IconX size={20} /></span>{isAr ? 'إكس' : 'X'}</a>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-2xl border border-[#b4ff3a]/30 bg-[#0b1a28] px-5 py-3 shadow-2xl"><div className="flex items-center gap-2 text-sm font-bold text-[#b4ff3a]"><Check size={18} />{toast}</div></div>}
    </div>
  );
}
