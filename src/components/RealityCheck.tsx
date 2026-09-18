import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Coffee, Cigarette, Dumbbell, Globe2, Hourglass, Play, Plus, Repeat, RotateCcw, Share2, ShoppingBag, Sparkles, Trash2, Utensils, Wine, X, Zap } from 'lucide-react';
import html2canvas from 'html2canvas';
import Decimal from 'decimal.js';
import { currencies } from '@/lib/realityCheckHelpers';
import { arabicLanguageCount, type CalculationResult } from '@/services/calculationEngine';
import {
  createHabit, getHabitTemplates, initialRealityState, runCalculation,
  type Habit, type HabitFrequency, type IncomeMode, type RealityCheckState,
} from '@/lib/realityCheck';

type Lang = 'en' | 'ar';

const t = {
  en: {
    stepOf: 'Step {n} of 2', back: 'Back', continue: 'Continue', reveal: 'Reveal My Reality',
    step1Label: '01 / Your Income', step1Title: 'How much do you earn?', step1Sub: 'This is the baseline we use to convert your habits into real work hours.',
    paidMode: 'How do you get paid?', monthly: 'Monthly Salary', hourly: 'Hourly Wage',
    hourlyWage: 'Hourly wage', monthlyIncome: 'Monthly net income', workHours: 'Working hours per week',
    baselineExpenses: 'Monthly baseline expenses (optional)', currency: 'Currency',
    step2Label: '02 / Your Habits', step2Title: 'What are your daily habits?', step2Sub: 'Add the habits that quietly drain your money and time. Be honest — the shock is the point.',
    costLabel: 'Cost ({sym})', timeLostLabel: 'Time lost (hours)', daily: 'Daily', weekly: 'Weekly', monthlyFreq: 'Monthly',
    removeHabit: 'Remove habit', noHabits: 'No habits added yet. Tap one below to start.',
    habitsReady: '{n} habits added — ready to see the damage?', habitSingular: '1 habit added — ready to see the damage?',
    enterHourly: 'Enter your hourly wage.', enterMonthly: 'Enter your monthly income.', enterWorkHours: 'Enter your working hours per week.',
    addHabit: 'Add at least one habit to continue.', calcError: 'Calculation accuracy could not be verified. Please review your inputs.',
    resultTitle: 'Total Monetary Cost of All Habits', download: 'Download Card', downloading: 'Downloading...',
    share: 'Share My Reality Check', startOver: 'Start Over', backHome: 'Back to Home', notAdvice: 'A reflection tool, not financial advice.',
    cardDownloaded: 'Card downloaded!', downloadFailed: 'Download failed',
    shareTitle: 'Share Your Reality Check', shareSub: 'Pick a platform to share', copyLink: 'Copy Link', copied: 'Copied!', close: 'Close',
    cardHeader: 'Hidden Cost', cardSub: 'Reality Check', cardBadge: 'LIFETIME REALITY CHECK',
    cardTopHabit: '{label}, over 10 years:', cardYourHabits: 'Your habits, over 10 years:', cardSpent: 'SPENT ON HABITS OVER A DECADE',
    cardDays: 'Days of Life Lost', cardFreedom: 'Years to Freedom', cardBreakdown: 'WHERE YOUR LIFE WENT', cardQuote: 'REALITY CHECK',
    shareText: 'My habits cost me {money} over 10 years — that\'s {days} days of life sacrificed. What are yours costing you?',
    langBtn: 'EN', switchLang: 'Switch language', freedomInsufficient: 'Insufficient data', freedomDelay: '+{years} yrs to freedom',
    valError: 'Calculation accuracy could not be verified. Please review your inputs.',
    totalMonetaryCost: 'Total Monetary Cost', lostHours: 'Lost Hours', lostDays: 'Lost Days', lostYears: 'Lost Years',
    habitBreakdown: 'Habit Breakdown', comparisons: 'What You Could Have Done Instead', freedomAnalysis: 'Financial Freedom Impact',
    reset: 'Reset', returnToInput: 'Return to Inputs',
  },
  ar: {
    stepOf: 'الخطوة {n} من 2', back: 'رجوع', continue: 'متابعة', reveal: 'أظهر واقعي',
    step1Label: '01 / دخلك', step1Title: 'كم تكسب؟', step1Sub: 'هذا هو الأساس الذي نستخدمه لتحويل عاداتك إلى ساعات عمل حقيقية.',
    paidMode: 'كيف تتقاضى راتبك؟', monthly: 'راتب شهري', hourly: 'أجر بالساعة',
    hourlyWage: 'الأجر بالساعة', monthlyIncome: 'صافي الدخل الشهري', workHours: 'ساعات العمل في الأسبوع',
    baselineExpenses: 'المصاريف الأساسية الشهرية (اختياري)', currency: 'العملة',
    step2Label: '02 / عاداتك', step2Title: 'ما هي عاداتك اليومية؟', step2Sub: 'أضف العادات التي تستنزف مالك ووقتك بهدوء. كن صريحاً — الصدمة هي الهدف.',
    costLabel: 'التكلفة ({sym})', timeLostLabel: 'الوقت الضائع (ساعات)', daily: 'يومي', weekly: 'أسبوعي', monthlyFreq: 'شهري',
    removeHabit: 'إزالة العادة', noHabits: 'لم تتم إضافة عادات بعد. اضغط على واحدة بالأسفل للبدء.',
    habitsReady: 'تمت إضافة {n} عادات — جاهز لرؤية الضرر؟', habitSingular: 'تمت إضافة عادة واحدة — جاهز لرؤية الضرر؟',
    enterHourly: 'أدخل أجرك بالساعة.', enterMonthly: 'أدخل دخلك الشهري.', enterWorkHours: 'أدخل ساعات عملك في الأسبوع.',
    addHabit: 'أضف عادة واحدة على الأقل للمتابعة.', calcError: 'تعذّر تأكيد دقة الحسابات، يرجى مراجعة المدخلات',
    resultTitle: 'إجمالي التكلفة المالية للعادات', download: 'تحميل البطاقة', downloading: 'جارٍ التحميل...',
    share: 'شارك فحص واقعي', startOver: 'ابدأ من جديد', backHome: 'العودة للرئيسية', notAdvice: 'أداة للتأمل وليست نصيحة مالية.',
    cardDownloaded: 'تم تحميل البطاقة!', downloadFailed: 'فشل التحميل',
    shareTitle: 'شارك فحص واقعك', shareSub: 'اختر منصة للمشاركة', copyLink: 'نسخ الرابط', copied: 'تم النسخ!', close: 'إغلاق',
    cardHeader: 'التكلفة الخفية', cardSub: 'فحص الواقع', cardBadge: 'فحص الواقع مدى الحياة',
    cardTopHabit: '{label}، على مدى 10 سنوات:', cardYourHabits: 'عاداتك، على مدى 10 سنوات:', cardSpent: 'أُنفقت على العادات خلال عقد',
    cardDays: 'أيام ضائعة من حياتك', cardFreedom: 'سنوات للحرية', cardBreakdown: 'أين ذهب حياتك', cardQuote: 'فحص الواقع',
    shareText: 'كلفتني عاداتي {money} على مدى 10 سنوات — هذا {days} يوماً من حياتي ضحيت بها. ماذا تكلفك عاداتك؟',
    langBtn: 'English', switchLang: 'تبديل اللغة', freedomInsufficient: 'بيانات غير كافية', freedomDelay: '+{years} سنة للحرية',
    valError: 'تنبيه: تعذّر تأكيد دقة الحسابات، يرجى مراجعة المدخلات',
    totalMonetaryCost: 'إجمالي التكلفة المالية', lostHours: 'الساعات الضائعة', lostDays: 'الأيام الضائعة', lostYears: 'السنوات الضائعة',
    habitBreakdown: 'تفصيل العادات', comparisons: 'ما كان بإمكانك فعله بدلاً من ذلك', freedomAnalysis: 'تأثير الحرية المالية',
    reset: 'إعادة ضبط', returnToInput: 'العودة للمدخلات',
  },
};

function fmtMoney(v: Decimal, lang: Lang, currency: string): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v.toNumber());
}
function fmtNum(v: Decimal, lang: Lang, maxFrac = 0): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: maxFrac }).format(v.toNumber());
}

const iconMap: Record<string, typeof Coffee> = {
  coffee: Coffee, repeat: Repeat, utensils: Utensils, cigarette: Cigarette,
  'shopping-bag': ShoppingBag, wine: Wine, play: Play, dumbbell: Dumbbell, custom: Sparkles,
};

const compIcons: Record<string, string> = {
  languages: '🗣️', book: '📚', film: '🎬', footprints: '🚶', activity: '🏃',
};

// ============================================================================
// Small UI primitives
// ============================================================================

function RCField({ label, value, onChange, prefix, min = '0', lang }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; min?: string; lang: Lang }) {
  const isAr = lang === 'ar';
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-200" style={{ textAlign: isAr ? 'right' : 'left' }}>{label}</span>
      <div className="flex h-11 items-center rounded-xl border border-white/10 bg-[#0b1a28] px-3 transition focus-within:border-[#b4ff3a]">
        {prefix && <span className={isAr ? 'ml-1.5 text-sm text-slate-400' : 'mr-1.5 text-sm text-slate-400'}>{prefix}</span>}
        <input aria-label={label} type="number" min={min} value={value || ''} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-600" placeholder="0" style={{ direction: 'ltr', textAlign: isAr ? 'right' : 'left' }} />
      </div>
    </label>
  );
}

function RCButton({ children, onClick, secondary = false, className = '', disabled = false }: { children: React.ReactNode; onClick?: () => void; secondary?: boolean; className?: string; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#b4ff3a] focus:ring-offset-2 focus:ring-offset-[#07121c] disabled:cursor-not-allowed disabled:opacity-40 ${secondary ? 'border border-white/15 bg-white/[.04] text-white hover:border-[#b4ff3a]/60' : 'bg-[#b4ff3a] text-[#07121b] shadow-[0_10px_30px_rgba(180,255,58,.16)] hover:bg-[#c4ff63]'} ${className}`}>{children}</button>;
}

function RCToggle({ options, value, onChange, lang }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void; lang: Lang }) {
  return (
    <div className="flex rounded-xl border border-white/10 bg-[#0b1a28] p-1" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {options.map((o) => (<button key={o.id} type="button" onClick={() => onChange(o.id)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${value === o.id ? 'bg-[#b4ff3a] text-[#07121b]' : 'text-slate-400 hover:text-white'}`}>{o.label}</button>))}
    </div>
  );
}

function FrequencyPicker({ value, onChange, lang }: { value: HabitFrequency; onChange: (v: HabitFrequency) => void; lang: Lang }) {
  const ct = t[lang];
  return <RCToggle lang={lang} options={[{ id: 'daily', label: ct.daily }, { id: 'weekly', label: ct.weekly }, { id: 'monthly', label: ct.monthlyFreq }]} value={value} onChange={(v) => onChange(v as HabitFrequency)} />;
}

// ============================================================================
// Header
// ============================================================================

function RCHeader({ lang, onLanguage, onHome }: { lang: Lang; onLanguage: () => void; onHome: () => void }) {
  const ct = t[lang]; const isAr = lang === 'ar';
  return (
    <header className="relative z-10 shrink-0 border-b border-white/[.07]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 lg:px-10 lg:py-2.5">
        <button onClick={onHome} aria-label="Hidden Cost home" className="flex items-center gap-2 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a] text-[#061019] shadow-[0_0_20px_rgba(180,255,58,.25)]"><Zap size={20} strokeWidth={3} fill="currentColor" /></span>
          <span className="font-display leading-none"><strong className="block text-[15px] font-extrabold tracking-tight">{isAr ? 'التكلفة الخفية' : 'Hidden Cost'}</strong><small className="block pt-0.5 text-[10px] font-medium text-slate-300">{isAr ? 'فحص الواقع' : 'Reality Check'}</small></span>
        </button>
        <button onClick={onLanguage} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-4 py-2 text-sm font-semibold hover:border-[#b4ff3a]/50" aria-label={ct.switchLang}><Globe2 size={17} /><span>{ct.langBtn}</span><ChevronDown size={14} /></button>
      </div>
    </header>
  );
}

// ============================================================================
// Step 1 — Income
// ============================================================================

function RealityCheckStep1({ state, setState, lang }: { state: RealityCheckState; setState: (s: RealityCheckState) => void; lang: Lang }) {
  const ct = t[lang]; const isAr = lang === 'ar'; const align = isAr ? 'right' : 'left';
  const symbol = currencies.find((c) => c.code === state.currency)?.symbol ?? '$';
  return (
    <section className="reveal space-y-4">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-[#b4ff3a]" style={{ textAlign: align }}>{ct.step1Label}</p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ textAlign: align }}>{ct.step1Title}</h1>
      <p className="text-sm text-slate-400" style={{ textAlign: align }}>{ct.step1Sub}</p>
      <div><span className="mb-1.5 block text-xs font-semibold text-slate-200" style={{ textAlign: align }}>{ct.paidMode}</span><RCToggle lang={lang} options={[{ id: 'monthly', label: ct.monthly }, { id: 'hourly', label: ct.hourly }]} value={state.incomeMode} onChange={(v) => setState({ ...state, incomeMode: v as IncomeMode })} /></div>
      {state.incomeMode === 'hourly' ? (
        <RCField lang={lang} label={ct.hourlyWage} value={state.hourlyWage} onChange={(v) => setState({ ...state, hourlyWage: v })} prefix={symbol} min="0.01" />
      ) : (
        <RCField lang={lang} label={ct.monthlyIncome} value={state.monthlyIncome} onChange={(v) => setState({ ...state, monthlyIncome: v })} prefix={symbol} min="0.01" />
      )}
      <RCField lang={lang} label={ct.workHours} value={state.workHoursPerWeek} onChange={(v) => setState({ ...state, workHoursPerWeek: v })} min="1" />
      <RCField lang={lang} label={ct.baselineExpenses} value={state.monthlyBaselineExpenses} onChange={(v) => setState({ ...state, monthlyBaselineExpenses: v })} prefix={symbol} min="0" />
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-200" style={{ textAlign: align }}>{ct.currency}</span><select value={state.currency} onChange={(e) => setState({ ...state, currency: e.target.value })} className="h-11 w-full rounded-xl border border-white/10 bg-[#0b1a28] px-3 text-sm font-semibold text-white outline-none focus:border-[#b4ff3a]" style={{ direction: isAr ? 'rtl' : 'ltr' }}>{currencies.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.symbol}</option>)}</select></label>
    </section>
  );
}

// ============================================================================
// Step 2 — Habits
// ============================================================================

function HabitRow({ habit, onChange, onRemove, currencySymbol, lang }: { habit: Habit; onChange: (h: Habit) => void; onRemove: () => void; currencySymbol: string; lang: Lang }) {
  const ct = t[lang]; const isAr = lang === 'ar';
  const Icon = iconMap[habit.icon] ?? Sparkles;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3.5">
      <div className="mb-3 flex items-center gap-2.5" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#b4ff3a]/10 text-[#b4ff3a]"><Icon size={18} /></span>
        <input value={habit.label} onChange={(e) => onChange({ ...habit, label: e.target.value })} className="flex-1 rounded-lg border border-white/10 bg-[#0b1a28] px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-[#b4ff3a]" style={{ textAlign: isAr ? 'right' : 'left' }} />
        <button type="button" onClick={onRemove} className="text-slate-500 hover:text-red-400" aria-label={ct.removeHabit}><Trash2 size={16} /></button>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-[11px] font-semibold text-slate-300" style={{ textAlign: isAr ? 'right' : 'left' }}>{ct.costLabel.replace('{sym}', currencySymbol)}</span>
          <RCField lang={lang} label={ct.costLabel.replace('{sym}', currencySymbol)} value={habit.cost} onChange={(v) => onChange({ ...habit, cost: v })} prefix={currencySymbol} />
          <div className="mt-1.5"><FrequencyPicker lang={lang} value={habit.costFrequency} onChange={(v) => onChange({ ...habit, costFrequency: v })} /></div>
        </div>
        <div>
          <span className="mb-1 block text-[11px] font-semibold text-slate-300" style={{ textAlign: isAr ? 'right' : 'left' }}>{ct.timeLostLabel}</span>
          <RCField lang={lang} label={ct.timeLostLabel} value={habit.timeLost} onChange={(v) => onChange({ ...habit, timeLost: v })} />
          <div className="mt-1.5"><FrequencyPicker lang={lang} value={habit.timeFrequency} onChange={(v) => onChange({ ...habit, timeFrequency: v })} /></div>
        </div>
      </div>
    </div>
  );
}

function RealityCheckStep2({ state, setState, lang }: { state: RealityCheckState; setState: (s: RealityCheckState) => void; lang: Lang }) {
  const ct = t[lang]; const isAr = lang === 'ar'; const align = isAr ? 'right' : 'left';
  const symbol = currencies.find((c) => c.code === state.currency)?.symbol ?? '$';
  const templates = getHabitTemplates(lang);
  const addHabit = (id: string) => setState({ ...state, habits: [...state.habits, createHabit(id, lang)] });
  const updateHabit = (i: number, h: Habit) => { const arr = [...state.habits]; arr[i] = h; setState({ ...state, habits: arr }); };
  const removeHabit = (i: number) => setState({ ...state, habits: state.habits.filter((_, idx) => idx !== i) });
  return (
    <section className="reveal space-y-4">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-[#b4ff3a]" style={{ textAlign: align }}>{ct.step2Label}</p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ textAlign: align }}>{ct.step2Title}</h1>
      <p className="text-sm text-slate-400" style={{ textAlign: align }}>{ct.step2Sub}</p>
      {state.habits.length > 0 && (<div className="space-y-3">{state.habits.map((h, i) => <HabitRow key={h.id} habit={h} lang={lang} onChange={(nh) => updateHabit(i, nh)} onRemove={() => removeHabit(i)} currencySymbol={symbol} />)}</div>)}
      {state.habits.length === 0 && (<div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-8 text-center"><Sparkles className="mx-auto mb-3 text-slate-500" size={32} /><p className="text-sm text-slate-400">{ct.noHabits}</p></div>)}
      <div className="flex flex-wrap gap-2" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
        {templates.map((tpl) => { const Icon = iconMap[tpl.icon] ?? Sparkles; return (<button key={tpl.id} type="button" onClick={() => addHabit(tpl.id)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:-translate-y-0.5 hover:border-white/30"><Icon size={16} /><Plus size={12} />{tpl.label}</button>); })}
      </div>
      {state.habits.length > 0 && <div className="rounded-xl border border-[#b4ff3a]/20 bg-[#b4ff3a]/[.06] p-3 text-center text-sm font-bold text-[#b4ff3a]">{state.habits.length !== 1 ? ct.habitsReady.replace('{n}', String(state.habits.length)) : ct.habitSingular}</div>}
    </section>
  );
}

// ============================================================================
// Share Card — consumes ONLY CalculationResult
// ============================================================================

function RealityCheckCard({ cardRef, result, state, lang }: { cardRef: React.RefObject<HTMLDivElement>; result: CalculationResult; state: RealityCheckState; lang: Lang }) {
  const ct = t[lang]; const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr'; const ta = isAr ? 'right' : 'left';
  const cardFont = isAr ? "'Noto Sans Arabic', system-ui, sans-serif" : "system-ui, -apple-system, sans-serif";
  const moneyFmt = (v: Decimal) => fmtMoney(v, lang, state.currency);
  const topLabel = result.habits[0]?.name ?? '';

  // Use engine comparisons for the shock line
  const langComp = result.comparisons.find((c) => c.id === 'languages');
  const shockLine = isAr
    ? (langComp && langComp.achievableCount > 0 ? `كان بإمكانك تعلم ${arabicLanguageCount(langComp.achievableCount)} بدلاً من ذلك` : `كان بإمكانك استثمار هذا الوقت في نفسك`)
    : (langComp && langComp.achievableCount > 0 ? `You could have learned ${langComp.achievableCount} new language${langComp.achievableCount !== 1 ? 's' : ''} fluently instead` : 'You could have invested this time in yourself');

  return (
    <div ref={cardRef} style={{ width: '380px', height: '676px', background: 'linear-gradient(160deg, #071522 0%, #0b1a28 45%, #1a1530 100%)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: '28px 24px', display: 'flex', flexDirection: 'column', fontFamily: cardFont, direction: dir, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-80px', right: isAr ? 'auto' : '-80px', left: isAr ? '-80px' : 'auto', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: isAr ? 'auto' : '-60px', right: isAr ? '-60px' : 'auto', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,255,58,0.05) 0%, transparent 70%)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', position: 'relative', flexDirection: isAr ? 'row-reverse' : 'row' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#b4ff3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '15px', fontWeight: 800, color: '#061019' }}>⚡</span></div>
        <div><div style={{ fontSize: '13px', fontWeight: 800, color: '#f6f7f2', lineHeight: 1, textAlign: ta }}>{ct.cardHeader}</div><div style={{ fontSize: '8px', color: '#9aaab5', marginTop: '2px', textAlign: ta }}>{ct.cardSub}</div></div>
      </div>
      <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: isAr ? '0' : '0.18em', textTransform: isAr ? 'none' : 'uppercase', color: '#fb923c', marginBottom: '5px', position: 'relative', textAlign: ta }}>{ct.cardBadge}</div>
      <div style={{ fontSize: '15px', fontWeight: 800, color: '#f6f7f2', marginBottom: '12px', lineHeight: 1.2, position: 'relative', textAlign: ta }}>{topLabel ? ct.cardTopHabit.replace('{label}', topLabel) : ct.cardYourHabits}</div>
      <div style={{ fontSize: '34px', fontWeight: 800, color: '#fb923c', lineHeight: 1.05, marginBottom: '3px', position: 'relative', textAlign: ta }}>{moneyFmt(result.totals.lifetimeCost)}</div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9aaab5', marginBottom: '14px', position: 'relative', textAlign: ta }}>{ct.cardSpent}</div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', position: 'relative', flexDirection: isAr ? 'row-reverse' : 'row' }}>
        <div style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', background: 'rgba(180,255,58,0.06)', border: '1px solid rgba(180,255,58,0.15)', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#b4ff3a', lineHeight: 1 }}>{fmtNum(result.totals.daysLost, lang, 1)}</div>
          <div style={{ fontSize: '8px', fontWeight: 600, color: '#9aaab5', marginTop: '3px' }}>{ct.cardDays}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#22d3ee', lineHeight: 1 }}>{result.freedomAnalysis.freedomDelayYears ? `+${fmtNum(result.freedomAnalysis.freedomDelayYears, lang, 1)}` : '—'}</div>
          <div style={{ fontSize: '8px', fontWeight: 600, color: '#9aaab5', marginTop: '3px' }}>{ct.cardFreedom}</div>
        </div>
      </div>
      <div style={{ marginBottom: '12px', position: 'relative' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, textTransform: isAr ? 'none' : 'uppercase', letterSpacing: isAr ? '0' : '0.1em', color: '#9aaab5', marginBottom: '7px', textAlign: ta }}>{ct.cardBreakdown}</div>
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '7px' }}>
          {result.habits.slice(0, 5).map((h, i) => { const colors = ['#b4ff3a', '#22d3ee', '#fb923c', '#f472b6', '#a78bfa']; return <div key={i} style={{ height: '100%', width: `${h.percentage}%`, background: colors[i % colors.length] }} />; })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {result.habits.slice(0, 4).map((h, i) => { const colors = ['#b4ff3a', '#22d3ee', '#fb923c', '#a78bfa']; return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', flexDirection: isAr ? 'row-reverse' : 'row' }}><span style={{ width: '7px', height: '7px', borderRadius: '2px', background: colors[i % colors.length], flexShrink: 0 }} /><span style={{ color: '#cbd5e1', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: ta }}>{h.name}</span><span style={{ color: '#f6f7f2', fontWeight: 700 }}>{Math.round(h.percentage)}%</span></div>; })}
        </div>
      </div>
      <div style={{ marginTop: 'auto', marginBottom: '12px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)', position: 'relative' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, textTransform: isAr ? 'none' : 'uppercase', letterSpacing: isAr ? '0' : '0.12em', color: '#fb923c', marginBottom: '4px', textAlign: ta }}>{ct.cardQuote}</div>
        <div style={{ fontSize: isAr ? '12px' : '11px', fontWeight: 500, lineHeight: 1.5, color: '#e2e8f0', textAlign: ta }}>{shockLine}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', position: 'relative', flexDirection: isAr ? 'row-reverse' : 'row' }}>
        <span style={{ fontSize: '8px', color: '#64748b' }}>{ct.cardQuote}</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#9aaab5' }}>https://hiddencostsimulator.com</span>
      </div>
    </div>
  );
}

// ============================================================================
// Share Modal
// ============================================================================

function RCShareModal({ lang, shareText, shareUrl, onClose }: { lang: Lang; shareText: string; shareUrl: string; onClose: () => void }) {
  const ct = t[lang]; const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);
  const encodedText = encodeURIComponent(shareText); const encodedUrl = encodeURIComponent(shareUrl);
  const platforms = [
    { name: 'WhatsApp', url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}` },
    { name: isAr ? 'إكس' : 'X', url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { name: 'Telegram', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
    { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];
  const copyLink = async () => { try { await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); } catch {} setCopied(true); setTimeout(() => setCopied(false), 2400); };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b1a28] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ direction: isAr ? 'rtl' : 'ltr' }}>
        <button onClick={onClose} className={isAr ? 'absolute left-4 top-4 text-slate-400 transition hover:text-white' : 'absolute right-4 top-4 text-slate-400 transition hover:text-white'} aria-label={ct.close}><X size={20} /></button>
        <h2 className="font-display text-lg font-extrabold" style={{ textAlign: isAr ? 'right' : 'left' }}>{ct.shareTitle}</h2>
        <p className="mt-1 text-xs text-slate-400" style={{ textAlign: isAr ? 'right' : 'left' }}>{ct.shareSub}</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">{platforms.map((p) => <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white/25">{p.name}</a>)}</div>
        <button onClick={copyLink} className={`mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${copied ? 'border-[#b4ff3a] bg-[#b4ff3a]/10 text-[#b4ff3a]' : 'border-white/10 bg-white/[.04] text-white hover:border-white/25'}`}>{copied ? <><Check size={18} />{ct.copied}</> : <><Copy size={16} />{ct.copyLink}</>}</button>
      </div>
    </div>
  );
}

// ============================================================================
// Validation Error Screen (PART 17)
// ============================================================================

function ValidationErrorScreen({ lang, onReset, onBackToInput }: { lang: Lang; onReset: () => void; onBackToInput: () => void }) {
  const ct = t[lang]; const isAr = lang === 'ar';
  return (
    <div className="app-shell grid-texture flex flex-col items-center justify-center px-5" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-400/10"><Hourglass className="text-orange-400" size={32} /></div>
        <p className="text-base font-bold text-orange-200">{ct.valError}</p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <RCButton onClick={onBackToInput}>{ct.returnToInput}</RCButton>
          <RCButton onClick={onReset} secondary>{ct.reset}</RCButton>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Result Screen — consumes ONLY CalculationResult
// ============================================================================

function RealityCheckResult({ state, result, lang, onLanguage, onRestart, onHome }: { state: RealityCheckState; result: CalculationResult; lang: Lang; onLanguage: () => void; onRestart: () => void; onHome: () => void }) {
  const ct = t[lang]; const isAr = lang === 'ar';
  const [toast, setToast] = useState(''); const [downloading, setDownloading] = useState(false); const [showShare, setShowShare] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const money = (v: Decimal) => fmtMoney(v, lang, state.currency);
  const num = (v: Decimal, frac = 0) => fmtNum(v, lang, frac);

  // PART 17 — Validation check
  if (!result.validation.passed) {
    return <div style={{ direction: isAr ? 'rtl' : 'ltr' }}><RCHeader lang={lang} onLanguage={onLanguage} onHome={onHome} /><ValidationErrorScreen lang={lang} onReset={onRestart} onBackToInput={() => { onRestart(); }} /></div>;
  }

  const shareText = ct.shareText.replace('{money}', money(result.totals.lifetimeCost)).replace('{days}', num(result.totals.daysLost, 0));
  const shareUrl = 'https://hiddencostsimulator.com';
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2600); };
  const downloadCard = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      const link = document.createElement('a'); link.download = 'reality-check-card.png'; link.href = canvas.toDataURL('image/png'); link.click();
      showToast(ct.cardDownloaded);
    } catch { showToast(ct.downloadFailed); }
    setDownloading(false);
  };

  // Build comparison lines from engine data
  const activeComps = result.comparisons.filter((c) => c.achievableCount > 0).slice(0, 4);

  return (
    <div className="app-shell grid-texture" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <RCHeader lang={lang} onLanguage={onLanguage} onHome={onHome} />
      <div className="mx-auto w-full max-w-md px-5 pb-6 pt-6">
        <p className="text-center text-[11px] font-bold uppercase text-[#fb923c]" style={{ letterSpacing: isAr ? '0' : '.2em' }}>{ct.resultTitle}</p>
        <div className="mx-auto mt-5 w-fit"><RealityCheckCard cardRef={cardRef} result={result} state={state} lang={lang} /></div>

        {/* Stat panels from engine */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#b4ff3a]/20 bg-[#b4ff3a]/[.05] p-4 text-center">
            <div className="text-2xl font-extrabold text-[#b4ff3a]">{money(result.totals.lifetimeCost)}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-400">{ct.totalMonetaryCost}</div>
          </div>
          <div className="rounded-2xl border border-orange-400/20 bg-orange-400/[.05] p-4 text-center">
            <div className="text-2xl font-extrabold text-orange-400">{num(result.totals.lifetimeHours, 0)}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-400">{ct.lostHours}</div>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[.05] p-4 text-center">
            <div className="text-2xl font-extrabold text-cyan-400">{num(result.totals.daysLost, 1)}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-400">{ct.lostDays}</div>
          </div>
          <div className="rounded-2xl border border-pink-400/20 bg-pink-400/[.05] p-4 text-center">
            <div className="text-2xl font-extrabold text-pink-400">{num(result.totals.yearsLost, 2)}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-400">{ct.lostYears}</div>
          </div>
        </div>

        {/* Freedom analysis from engine */}
        {result.freedomAnalysis.freedomDelayStatus === 'CALCULATED' && result.freedomAnalysis.freedomDelayYears && (
          <div className="mt-4 rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/[.05] p-4 text-center">
            <div className="text-xl font-extrabold text-[#22d3ee]">+{num(result.freedomAnalysis.freedomDelayYears, 1)}</div>
            <div className="mt-1 text-xs font-semibold text-slate-400">{ct.freedomAnalysis}</div>
          </div>
        )}

        {/* Habit breakdown from engine */}
        {result.habits.length > 1 && (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-bold text-white" style={{ textAlign: isAr ? 'right' : 'left' }}>{ct.habitBreakdown}</h3>
            <div className="space-y-2">
              {result.habits.map((h, i) => {
                const colors = ['#b4ff3a', '#22d3ee', '#fb923c', '#f472b6', '#a78bfa'];
                return (
                  <div key={i} className="flex items-center gap-3" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} />
                    <span className="flex-1 text-sm font-semibold text-slate-200" style={{ textAlign: isAr ? 'right' : 'left' }}>{h.name}</span>
                    <span className="text-sm font-bold text-white">{money(h.lifetimeCost)}</span>
                    <span className="w-12 text-right text-xs font-semibold text-slate-400">{Math.round(h.percentage)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparisons from engine */}
        {activeComps.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-bold text-white" style={{ textAlign: isAr ? 'right' : 'left' }}>{ct.comparisons}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {activeComps.map((c) => (
                <div key={c.id} className="rounded-xl border border-white/10 bg-white/[.04] p-3 text-center">
                  <div className="text-2xl">{compIcons[c.icon] ?? '📊'}</div>
                  <div className="mt-1 text-lg font-extrabold text-[#b4ff3a]">{c.achievableCount}</div>
                  <div className="text-[11px] font-semibold text-slate-400" style={{ textAlign: isAr ? 'right' : 'left' }}>{isAr ? c.labelAr : c.labelEn}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <RCButton onClick={downloadCard} disabled={downloading} className="flex-1"><Copy size={17} />{downloading ? ct.downloading : ct.download}</RCButton>
          <RCButton onClick={() => setShowShare(true)} secondary className="flex-1"><Share2 size={17} />{ct.share}</RCButton>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button onClick={onRestart} className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"><RotateCcw size={14} />{ct.startOver}</button>
          <button onClick={onHome} className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-white"><ArrowLeft size={14} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />{ct.backHome}</button>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-600">{ct.notAdvice}</p>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-2xl border border-[#b4ff3a]/30 bg-[#0b1a28] px-5 py-3 shadow-2xl"><div className="flex items-center gap-2 text-sm font-bold text-[#b4ff3a]"><Check size={18} />{toast}</div></div>}
      {showShare && <RCShareModal lang={lang} shareText={shareText} shareUrl={shareUrl} onClose={() => setShowShare(false)} />}
    </div>
  );
}

// ============================================================================
// Main exported component
// ============================================================================

export function RealityCheck({ language, onHome, onLanguage }: { language: Lang; onHome: () => void; onLanguage: () => void }) {
  const lang = language; const ct = t[lang]; const isAr = lang === 'ar';
  const [step, setStep] = useState(1);
  const [state, setState] = useState<RealityCheckState>(initialRealityState);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState('');

  const compute = (): boolean => {
    setError('');
    if (state.incomeMode === 'hourly' && state.hourlyWage <= 0) { setError(ct.enterHourly); return false; }
    if (state.incomeMode === 'monthly' && state.monthlyIncome <= 0) { setError(ct.enterMonthly); return false; }
    if (state.workHoursPerWeek <= 0) { setError(ct.enterWorkHours); return false; }
    // If hourly mode, convert to monthly for the engine
    const engineState = state.incomeMode === 'hourly'
      ? { ...state, monthlyIncome: state.hourlyWage * state.workHoursPerWeek * 4.33 }
      : state;
    const r = runCalculation(engineState);
    if (!r.validation.passed) { setError(ct.calcError); return false; }
    setResult(r);
    return true;
  };

  const next = () => {
    if (step === 1) {
      if (state.incomeMode === 'hourly' && state.hourlyWage <= 0) { setError(ct.enterHourly); return; }
      if (state.incomeMode === 'monthly' && state.monthlyIncome <= 0) { setError(ct.enterMonthly); return; }
      if (state.workHoursPerWeek <= 0) { setError(ct.enterWorkHours); return; }
      setError(''); setStep(2);
    } else if (step === 2) {
      if (state.habits.length === 0) { setError(ct.addHabit); return; }
      if (compute()) { setStep(3); }
    }
  };
  const back = () => { if (step > 1) { setError(''); setStep(step - 1); } else onHome(); };
  const restart = () => { setState(initialRealityState); setResult(null); setStep(1); setError(''); };

  if (step === 3 && result) return <RealityCheckResult state={state} result={result} lang={lang} onLanguage={onLanguage} onRestart={restart} onHome={onHome} />;

  return (
    <div className="app-shell grid-texture" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <RCHeader lang={lang} onLanguage={onLanguage} onHome={onHome} />
      <div className="flex flex-1 flex-col overflow-hidden px-5 pb-3 pt-3 lg:pt-4">
        <div className="mb-3 flex shrink-0 items-center justify-between" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
          <button onClick={back} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white" style={{ flexDirection: isAr ? 'row-reverse' : 'row' }}><ArrowLeft size={15} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />{ct.back}</button>
          <span className="text-xs font-bold text-[#fb923c]">{ct.stepOf.replace('{n}', String(step))}</span>
        </div>
        <div className="mb-4 h-1.5 shrink-0 rounded-full bg-white/10"><div className="h-full rounded-full bg-[#fb923c] transition-all" style={{ width: `${step * 50}%` }} /></div>
        <div className="flex-1 overflow-y-auto pb-4">
          {step === 1 && <RealityCheckStep1 state={state} setState={setState} lang={lang} />}
          {step === 2 && <RealityCheckStep2 state={state} setState={setState} lang={lang} />}
          {error && <p role="alert" className="mt-3 rounded-xl border border-orange-400/30 bg-orange-400/10 p-2.5 text-xs text-orange-200" style={{ textAlign: isAr ? 'right' : 'left' }}>{error}</p>}
        </div>
        <div className="shrink-0 pt-3"><RCButton onClick={next} className="w-full sm:w-auto sm:ml-auto">{step === 2 ? ct.reveal : ct.continue}<ArrowRight size={18} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} /></RCButton></div>
      </div>
    </div>
  );
}
