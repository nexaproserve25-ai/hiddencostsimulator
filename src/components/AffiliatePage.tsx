import { useState } from 'react';
import { ArrowLeft, Check, DollarSign, Link2, TrendingUp, Users, Zap } from 'lucide-react';
import { AFFILIATE_DATA } from '@/lib/narrativeData';

type Lang = 'en' | 'ar';

const copy = {
  en: {
    backHome: 'Back to Home',
    howItWorks: 'How It Works',
    commission: 'Commission',
    model: 'Revenue Model',
    funnel: 'Conversion Funnel',
    joinNow: 'Get Your Referral Link',
    copied: 'Link copied!',
    monthly: 'Monthly',
    yearly: 'Annual',
    monthlyPrice: '$3/mo',
    yearlyPrice: '$29/yr',
    perMonth: '/mo',
    perYear: '/yr',
    terms: '30% recurring commission on every paying customer you refer. No clicks or impressions required — you earn when someone becomes a paying customer.',
    pricingTitle: 'Pricing Tiers',
  },
  ar: {
    backHome: 'العودة للرئيسية',
    howItWorks: 'كيف تعمل',
    commission: 'العمولة',
    model: 'نموذج الإيرادات',
    funnel: 'مسار التحويل',
    joinNow: 'احصل على رابط الإحالة',
    copied: 'تم نسخ الرابط!',
    monthly: 'شهري',
    yearly: 'سنوي',
    monthlyPrice: '$3/شهر',
    yearlyPrice: '$29/سنة',
    perMonth: '/شهر',
    perYear: '/سنة',
    terms: 'عمولة متكررة 30٪ على كل عميل يدفع تحيله. لا نقرات أو ظهور مطلوب — تربح عندما يصبح الشخص عميلاً يدفع.',
    pricingTitle: 'خطط الأسعار',
  },
};

export function AffiliatePage({ lang, onHome }: { lang: Lang; onHome: () => void }) {
  const isAr = lang === 'ar';
  const t = copy[lang];
  const dir = isAr ? 'rtl' : 'ltr';
  const [copied, setCopied] = useState(false);

  const handleGetLink = async () => {
    const referralBase = `${window.location.origin}/?ref=partner`;
    try {
      await navigator.clipboard.writeText(referralBase);
    } catch { /* clipboard may be blocked */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="app-shell grid-texture" style={{ direction: dir }}>
      <header className="relative z-10 shrink-0 border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 lg:px-10 lg:py-2.5">
          <button onClick={onHome} className="flex items-center gap-2 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a] text-[#061019] shadow-[0_0_20px_rgba(180,255,58,.25)]"><Zap size={20} strokeWidth={3} fill="currentColor" /></span>
            <span className="font-display leading-none"><strong className="block text-[15px] font-extrabold tracking-tight text-slate-950">{isAr ? 'التكلفة الخفية' : 'Hidden Cost'}</strong><small className="block pt-0.5 text-[10px] font-semibold text-slate-600">{isAr ? 'برنامج الشركاء' : 'Partner Program'}</small></span>
          </button>
          <button onClick={onHome} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#b4ff3a]/50 hover:text-slate-950">
            <ArrowLeft size={16} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />{t.backHome}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-5 py-8 lg:py-12">
          {/* Hero */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/15">
              <Users size={32} className="text-[#5a9a32]" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl" style={{ textAlign: isAr ? 'right' : 'left' }}>
              {AFFILIATE_DATA.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600" style={{ textAlign: isAr ? 'right' : 'left' }}>
              {AFFILIATE_DATA.subtext}
            </p>
          </div>

          {/* Commission */}
          <div className="mt-8 rounded-2xl border border-[#b4ff3a]/25 bg-gradient-to-br from-[#b4ff3a]/[.08] to-transparent p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[#5a9a32]">
              <DollarSign size={24} />
              <span className="text-[10px] font-bold uppercase tracking-[.18em]">{t.commission}</span>
            </div>
            <div className="mt-2 font-display text-4xl font-extrabold text-[#5a9a32]">30%</div>
            <p className="mt-2 text-sm text-slate-800">{AFFILIATE_DATA.commission}</p>
          </div>

          {/* Pricing Tiers */}
          <div className="mt-5">
            <h3 className="mb-3 text-center font-display text-base font-extrabold text-slate-950">{t.pricingTitle}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-600">{t.monthly}</div>
                <div className="mt-2 font-display text-3xl font-extrabold text-slate-950">{t.monthlyPrice}</div>
                <p className="mt-1 text-xs text-slate-600">{isAr ? 'مرونة كاملة' : 'Full flexibility'}</p>
              </div>
              <div className="rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/[.06] p-5 text-center shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[.15em] text-[#5a9a32]">{t.yearly}</div>
                <div className="mt-2 font-display text-3xl font-extrabold text-[#5a9a32]">{t.yearlyPrice}</div>
                <p className="mt-1 text-xs text-slate-600">{isAr ? 'وفّر ~20٪' : 'Save ~20%'}</p>
              </div>
            </div>
          </div>

          {/* Model explanation */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.model}</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-800" style={{ textAlign: isAr ? 'right' : 'left' }}>
              {AFFILIATE_DATA.modelExplanation}
            </p>
          </div>

          {/* Funnel flow */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-orange-600" />
              <h3 className="text-sm font-bold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.funnel}</h3>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {AFFILIATE_DATA.funnelFlow.split(' → ').map((step, i, arr) => (
                <span key={i} className="flex items-center gap-2">
                  <span className={`rounded-lg border px-3 py-1.5 font-bold ${i === arr.length - 1 ? 'border-[#b4ff3a]/40 bg-[#b4ff3a]/15 text-[#5a9a32]' : 'border-slate-200 bg-white text-slate-800'}`}>{step}</span>
                  {i < arr.length - 1 && <span className="text-slate-500">→</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs leading-5 text-slate-600" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.terms}</p>
          </div>

          {/* CTA */}
          <button
            onClick={handleGetLink}
            className={`mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${copied ? 'border border-[#b4ff3a] bg-[#b4ff3a]/10 text-[#5a9a32]' : 'bg-[#b4ff3a] text-[#07121b] shadow-[0_10px_30px_rgba(180,255,58,.16)] hover:bg-[#c4ff63]'}`}
          >
            {copied ? (<><Check size={18} /> {t.copied}</>) : (<><Link2 size={18} /> {t.joinNow}</>)}
          </button>
        </div>
      </main>
    </div>
  );
}
