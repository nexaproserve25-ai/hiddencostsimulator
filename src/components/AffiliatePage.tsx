import { ArrowLeft, DollarSign, Link2, TrendingUp, Users, Zap } from 'lucide-react';
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
    terms: '30% recurring commission on every paying customer you refer. No clicks or impressions required — you earn when someone becomes a paying customer.',
  },
  ar: {
    backHome: 'العودة للرئيسية',
    howItWorks: 'كيف تعمل',
    commission: 'العمولة',
    model: 'نموذج الإيرادات',
    funnel: 'مسار التحويل',
    joinNow: 'احصل على رابط الإحالة',
    terms: 'عمولة متكررة 30٪ على كل عميل يدفع تحيله. لا نقرات أو ظهور مطلوب — تربح عندما يصبح الشخص عميلاً يدفع.',
  },
};

export function AffiliatePage({ lang, onHome }: { lang: Lang; onHome: () => void }) {
  const isAr = lang === 'ar';
  const t = copy[lang];
  const dir = isAr ? 'rtl' : 'ltr';

  return (
    <div className="app-shell grid-texture" style={{ direction: dir }}>
      <header className="relative z-10 shrink-0 border-b border-white/[.07]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 lg:px-10 lg:py-2.5">
          <button onClick={onHome} className="flex items-center gap-2 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a] text-[#061019] shadow-[0_0_20px_rgba(180,255,58,.25)]"><Zap size={20} strokeWidth={3} fill="currentColor" /></span>
            <span className="font-display leading-none"><strong className="block text-[15px] font-extrabold tracking-tight">{isAr ? 'التكلفة الخفية' : 'Hidden Cost'}</strong><small className="block pt-0.5 text-[10px] font-medium text-slate-300">{isAr ? 'برنامج الشركاء' : 'Partner Program'}</small></span>
          </button>
          <button onClick={onHome} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.03] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-[#b4ff3a]/50 hover:text-white">
            <ArrowLeft size={16} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />{t.backHome}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-5 py-8 lg:py-12">
          {/* Hero */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/10">
              <Users size={32} className="text-[#b4ff3a]" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl" style={{ textAlign: isAr ? 'right' : 'left' }}>
              {isAr ? AFFILIATE_DATA.title : AFFILIATE_DATA.title}
            </h1>
            <p className="mt-2 text-sm text-slate-400" style={{ textAlign: isAr ? 'right' : 'left' }}>
              {isAr ? AFFILIATE_DATA.subtext : AFFILIATE_DATA.subtext}
            </p>
          </div>

          {/* Commission */}
          <div className="mt-8 rounded-2xl border border-[#b4ff3a]/25 bg-gradient-to-br from-[#b4ff3a]/[.08] to-transparent p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[#b4ff3a]">
              <DollarSign size={24} />
              <span className="text-[10px] font-bold uppercase tracking-[.18em]">{t.commission}</span>
            </div>
            <div className="mt-2 font-display text-4xl font-extrabold text-[#b4ff3a]">30%</div>
            <p className="mt-2 text-sm text-slate-300">{isAr ? AFFILIATE_DATA.commission : AFFILIATE_DATA.commission}</p>
          </div>

          {/* Model explanation */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-cyan-300" />
              <h3 className="text-sm font-bold text-white" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.model}</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300" style={{ textAlign: isAr ? 'right' : 'left' }}>
              {isAr ? AFFILIATE_DATA.modelExplanation : AFFILIATE_DATA.modelExplanation}
            </p>
          </div>

          {/* Funnel flow */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-orange-300" />
              <h3 className="text-sm font-bold text-white" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.funnel}</h3>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {(isAr ? AFFILIATE_DATA.funnelFlow : AFFILIATE_DATA.funnelFlow).split(' → ').map((step, i, arr) => (
                <span key={i} className="flex items-center gap-2">
                  <span className={`rounded-lg border px-3 py-1.5 font-bold ${i === arr.length - 1 ? 'border-[#b4ff3a]/40 bg-[#b4ff3a]/10 text-[#b4ff3a]' : 'border-white/10 bg-white/[.04] text-slate-300'}`}>{step}</span>
                  {i < arr.length - 1 && <span className="text-slate-500">→</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="mt-5 rounded-xl border border-white/[.06] bg-white/[.02] p-4">
            <p className="text-xs leading-5 text-slate-500" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.terms}</p>
          </div>

          {/* CTA */}
          <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b4ff3a] px-5 py-3 text-sm font-bold text-[#07121b] shadow-[0_10px_30px_rgba(180,255,58,.16)] transition hover:-translate-y-0.5 hover:bg-[#c4ff63]">
            <Link2 size={18} /> {t.joinNow}
          </button>
        </div>
      </main>
    </div>
  );
}
