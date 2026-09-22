import { useRef } from 'react';
import { ArrowLeft, Download, Zap } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { PDF_REPORT_STRUCTURE, CORE_PHILOSOPHY } from '@/lib/narrativeData';

type Lang = 'en' | 'ar';

const copy = {
  en: {
    title: 'Your 180-Day Recovery Report',
    subtitle: 'Hidden Cost Simulator — Personalized Financial Reflection',
    backHome: 'Back to Home',
    download: 'Download PDF',
    downloading: 'Generating PDF...',
    generated: 'Report downloaded!',
    failed: 'Download failed',
    sections: 'Report Sections',
    closingNote: 'Your time was always valuable. Now you have a number that shows you how valuable it is.',
    notAdvice: 'A reflection tool, not financial advice.',
  },
  ar: {
    title: 'تقرير التعافي — 180 يوماً',
    subtitle: 'محاكي التكلفة الخفية — تأمل مالي شخصي',
    backHome: 'العودة للرئيسية',
    download: 'تحميل PDF',
    downloading: 'جارٍ إنشاء PDF...',
    generated: 'تم تحميل التقرير!',
    failed: 'فشل التحميل',
    sections: 'أقسام التقرير',
    closingNote: 'وقتك كان دائماً ثميناً. الآن لديك رقم يوضح لك مدى ثمنه.',
    notAdvice: 'أداة للتأمل وليست نصيحة مالية.',
  },
};

export interface PDFReportData {
  income: number;
  hourlyRate: number;
  baselineSpend: number;
  currentSpend: number;
  moneyRecovered: number;
  timeRecoveredHours: number;
  timeRecoveredMinutes: number;
  lifeScore: number;
  topHabits: string[];
  decisionPattern: string;
  day: number;
}

function Header({ lang, onHome }: { lang: Lang; onHome: () => void }) {
  const isAr = lang === 'ar';
  return (
    <header className="relative z-10 shrink-0 border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 lg:px-10 lg:py-2.5">
        <button onClick={onHome} className="flex items-center gap-2 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a] text-[#061019] shadow-[0_0_20px_rgba(180,255,58,.25)]"><Zap size={20} strokeWidth={3} fill="currentColor" /></span>
          <span className="font-display leading-none"><strong className="block text-[15px] font-extrabold tracking-tight text-slate-950">{isAr ? 'التكلفة الخفية' : 'Hidden Cost'}</strong><small className="block pt-0.5 text-[10px] font-semibold text-slate-600">{isAr ? 'تقرير PDF' : 'PDF Report'}</small></span>
        </button>
        <button onClick={onHome} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#b4ff3a]/50 hover:text-slate-950">
          <ArrowLeft size={16} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />{copy[lang].backHome}
        </button>
      </div>
    </header>
  );
}

export function PDFReport({ lang, data, onHome }: { lang: Lang; data: PDFReportData; onHome: () => void }) {
  const isAr = lang === 'ar';
  const t = copy[lang];
  const dir = isAr ? 'rtl' : 'ltr';
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!reportRef.current) return;
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: 'hidden-cost-180-day-report.pdf',
      image: { type: 'jpeg' as const, quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#f8f6f1' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    };
    try { await html2pdf().set(opt).from(reportRef.current).save(); } catch { /* download failed */ }
  };

  const sections = isAr ? [
    '١. نقطة البداية (الدخل، الأجر بالساعة، الإنفاق الأساسي)',
    '٢. ملف التكلفة الخفية (أهم العادات)',
    '٣. نمط القرار (التحليل السلوكي النفسي)',
    '٤. خطة التعافي الشخصية — 180 يوماً',
    '٥. الرسوم البيانية ومقاييس التقدم',
    '٦. إجمالي المال المسترد ($)',
    '٧. إجمالي وقت العمل المسترد (ساعات/أيام)',
    '٨. أكبر التغييرات السلوكية والنجاحات',
    '٩. التحديات المتبقية ونقاط التحسين',
    '١٠. خارطة طريق الـ 180 يوماً القادمة',
  ] : PDF_REPORT_STRUCTURE;

  return (
    <div className="app-shell grid-texture" style={{ direction: dir }}>
      <Header lang={lang} onHome={onHome} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6 lg:px-8 lg:py-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.title}</h1>
              <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
            </div>
            <button onClick={handleDownload} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#b4ff3a] px-5 py-3 text-sm font-bold text-[#07121b] shadow-[0_10px_30px_rgba(180,255,58,.16)] transition hover:-translate-y-0.5 hover:bg-[#c4ff63]">
              <Download size={18} /> {t.download}
            </button>
          </div>

          {/* Printable report */}
          <div ref={reportRef} className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8" style={{ direction: dir }}>
            {/* Report header */}
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b4ff3a] text-[#061019]"><Zap size={22} strokeWidth={3} fill="currentColor" /></span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-slate-950">{t.title}</h2>
                  <p className="text-xs text-slate-600">{t.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Opening quote */}
            <div className="mt-5 rounded-xl border border-[#b4ff3a]/20 bg-[#b4ff3a]/[.08] p-4">
              <p className="text-sm italic text-slate-800">"{CORE_PHILOSOPHY.mainQuote}"</p>
            </div>

            {/* Key metrics grid */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: isAr ? 'الدخل الشهري' : 'Monthly Income', value: `$${data.income.toFixed(0)}` },
                { label: isAr ? 'الأجر بالساعة' : 'Hourly Rate', value: `$${data.hourlyRate.toFixed(2)}` },
                { label: isAr ? 'الإنفاق الأساسي' : 'Baseline Spend', value: `$${data.baselineSpend.toFixed(0)}/mo` },
                { label: isAr ? 'الإنفاق الحالي' : 'Current Spend', value: `$${data.currentSpend.toFixed(0)}/mo` },
                { label: isAr ? 'المال المسترد' : 'Money Recovered', value: `$${data.moneyRecovered.toFixed(0)}` },
                { label: isAr ? 'الوقت المسترد' : 'Time Recovered', value: `${data.timeRecoveredHours}h ${data.timeRecoveredMinutes}m` },
                { label: isAr ? 'درجة الاسترداد' : 'Life Recovery Score', value: `${data.lifeScore}/100` },
                { label: isAr ? 'اليوم' : 'Day', value: `${data.day}/180` },
              ].map((m, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{m.label}</div>
                  <div className="mt-1 text-lg font-extrabold text-[#5a9a32]">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Top habits */}
            {data.topHabits.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'أهم العادات' : 'Top Habit Drivers'}</h3>
                <ul className="mt-2 space-y-1.5">
                  {data.topHabits.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-800"><span className="h-1.5 w-1.5 rounded-full bg-[#b4ff3a]" />{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decision pattern */}
            <div className="mt-5">
              <h3 className="text-sm font-bold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'نمط القرار' : 'Decision Pattern'}</h3>
              <p className="mt-1 text-sm text-slate-800">{data.decisionPattern}</p>
            </div>

            {/* Report sections list */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.sections}</h3>
              <ol className="mt-2 space-y-1.5">
                {sections.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-[#5a9a32]">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            {/* Closing quote */}
            <div className="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-center">
              <p className="text-sm italic text-slate-800">"{t.closingNote}"</p>
            </div>

            <p className="mt-4 text-center text-[10px] text-slate-500">{t.notAdvice}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
