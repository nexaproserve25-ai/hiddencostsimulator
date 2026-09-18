import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, Download, Lock,
  Gamepad2, Plus, Sparkles,
  Trash2, UtensilsCrossed, Coffee, ShoppingBag, Repeat, Car, Circle, Zap,
  Globe2, ChevronDown,
} from 'lucide-react';
import Decimal from 'decimal.js';
import {
  proCalculate, type ProCalculationResult, type ProHabitInput, type ProFrequency,
  type HabitCategory, type UserFinancialProfile,
} from '@/services/proCalculationEngine';
import { runProAnalysis, type ProAnalysisResult } from '@/services/proAnalysisEngine';
import { currencies } from '@/lib/calculations';
import {
  proCopy, categoryLabel, frequencyLabel,
  type ProLang,
} from '@/lib/proI18n';
import { ProResultsV3 } from '@/components/ProResultsV3';
import { usePayment, FREE_HABIT_LIMIT } from '@/context/PaymentContext';
import { UpgradePanel } from '@/components/UpgradePanel';

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface ProResultData {
  calculation: ProCalculationResult;
  analysis: ProAnalysisResult;
}

// ============================================================================
// CATEGORY ICONS
// ============================================================================

const CATEGORY_ICONS: Record<HabitCategory, typeof Circle> = {
  food: UtensilsCrossed, beverage: Coffee, shopping: ShoppingBag,
  entertainment: Gamepad2, subscription: Repeat, transport: Car, other: Circle,
};

const CATEGORIES: HabitCategory[] = ['food', 'beverage', 'shopping', 'entertainment', 'subscription', 'transport', 'other'];
const FREQUENCIES: ProFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

// ============================================================================
// PRO WIZARD
// ============================================================================

interface ProHabitDraft {
  id: string;
  name: string;
  category: HabitCategory;
  costAmount: string;
  costFrequency: ProFrequency;
  timeAmount: string;
  timeFrequency: ProFrequency;
  importance: 1 | 2 | 3 | 4 | 5;
}

let habitIdCounter = 0;
function nextHabitId(): string { habitIdCounter++; return `habit-${habitIdCounter}`; }

export function HiddenCostPro({ language, onHome, onLanguage }: { language: ProLang; onHome: () => void; onLanguage: () => void }) {
  const { canAccess, featureAccess } = usePayment();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState<ProResultData | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Profile state
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [weeklyWorkHours, setWeeklyWorkHours] = useState('');
  const [age, setAge] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [savingsRate, setSavingsRate] = useState('');

  // Habits state
  const [habits, setHabits] = useState<ProHabitDraft[]>([
    { id: nextHabitId(), name: '', category: 'beverage', costAmount: '', costFrequency: 'daily', timeAmount: '', timeFrequency: 'daily', importance: 3 },
  ]);

  const t = proCopy[language];
  const isAr = language === 'ar';

  const addHabit = () => {
    if (!featureAccess.unlimitedHabits && habits.length >= FREE_HABIT_LIMIT) return;
    setHabits([...habits, { id: nextHabitId(), name: '', category: 'other', costAmount: '', costFrequency: 'monthly', timeAmount: '', timeFrequency: 'monthly', importance: 3 }]);
  };

  const removeHabit = (id: string) => {
    if (habits.length > 1) setHabits(habits.filter((h) => h.id !== id));
  };

  const updateHabit = (id: string, patch: Partial<ProHabitDraft>) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  };

  const canContinueStep1 = monthlyIncome && Number(monthlyIncome) > 0 && weeklyWorkHours && Number(weeklyWorkHours) > 0;
  const canContinueStep2 = habits.every((h) => h.name.trim() && (Number(h.costAmount) >= 0 || h.costAmount === '') && (Number(h.timeAmount) >= 0 || h.timeAmount === ''));

  const calculate = (): ProResultData | null => {
    setError('');
    const profile: UserFinancialProfile = {
      id: 'pro-session',
      monthlyIncome: new Decimal(monthlyIncome || '0'),
      weeklyWorkHours: new Decimal(weeklyWorkHours || '0'),
      currency,
      ...(age ? { age: new Decimal(age) } : {}),
      ...(savingsRate ? { currentSavingsRate: new Decimal(savingsRate) } : {}),
    };

    const habitInputs: ProHabitInput[] = habits.map((h) => ({
      id: h.id,
      name: h.name.trim(),
      category: h.category,
      costAmount: new Decimal(h.costAmount || '0'),
      costFrequency: h.costFrequency,
      timeAmount: new Decimal(h.timeAmount || '0'),
      timeFrequency: h.timeFrequency,
      importance: h.importance,
    }));

    try {
      const calculation = proCalculate({ profile, habits: habitInputs });
      const analysis = runProAnalysis(calculation, profile);
      return { calculation, analysis };
    } catch {
      setError(t.errCalc);
      return null;
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!canContinueStep1) { setError(t.errStep1); return; }
      setStep(2);
    } else if (step === 2) {
      if (!canContinueStep2) { setError(t.errStep2); return; }
      const data = calculate();
      if (data) { setResultData(data); setStep(3); }
    }
  };

  const handleBack = () => {
    if (step > 1) { setStep(step - 1); setError(''); }
    else onHome();
  };

  const handleRestart = () => {
    setStep(1);
    setResultData(null);
    setError('');
  };

  // Download report as a PDF file directly to the user's device
  const handleDownload = async () => {
    const reportEl = document.querySelector('[data-pro-report]') as HTMLElement | null;
    if (!reportEl) return;
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const worker = html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: 'Financial_Recovery_Roadmap.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0b1a28', logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      } as Parameters<typeof worker.set>[0]);
      await worker.from(reportEl).save();
    } catch {
      setError(t.errPdf);
    }
    setDownloading(false);
  };

  if (step === 3 && resultData) {
    // Content locking (spec 9): if premium features are locked, show upgrade panel
    // instead of the full results. Calculations for locked features are never displayed.
    if (!canAccess('pdfReport')) {
      return (
        <div className="app-shell grid-texture">
          <ProHeader lang={language} onHome={onHome} onLanguage={onLanguage} />
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-8" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/10">
                <Lock size={32} className="text-[#b4ff3a]" />
              </div>
              <h1 className="font-display text-xl font-extrabold text-white">
                {isAr ? 'تحليلك جاهز — افتح برو لرؤيته' : 'Your analysis is ready — unlock Pro to see it'}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {isAr ? 'حساباتك مكتملة. افتح الميزات المدفوعة للاطلاع على التقرير الكامل وتحميل PDF.' : 'Your calculations are complete. Unlock premium features to view the full report and download the PDF.'}
              </p>
            </div>
            <div className="mt-5 w-full max-w-md">
              <UpgradePanel lang={language} onUnlocked={() => { /* state will re-render with unlocked features */ }} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="app-shell grid-texture">
        <ProHeader lang={language} onHome={onHome} onLanguage={onLanguage} />
        <ProResultsV3 data={resultData} analysis={resultData.analysis} currencyCode={currency} lang={language} onBack={handleRestart} onDownload={handleDownload} downloading={downloading} />
      </div>
    );
  }

  return (
    <div className="app-shell grid-texture">
      <ProHeader lang={language} onHome={onHome} onLanguage={onLanguage} />
      <main className="flex flex-1 flex-col overflow-hidden px-5 pb-3 pt-3 lg:px-8 lg:pt-4" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
        {/* Progress bar */}
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
            {isAr ? <ArrowRight size={15} /> : <ArrowLeft size={15} />} {t.back}
          </button>
          <span className="text-xs font-bold text-[#b4ff3a]">{t.step} {step} {t.of} 2</span>
        </div>
        <div className="mb-4 h-1.5 shrink-0 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#b4ff3a] transition-all" style={{ width: `${step * 50}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <section className="reveal">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-[#b4ff3a]">{t.step1Label}</p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{t.step1Title}</h1>
              <p className="mt-2 text-sm text-slate-400">{t.step1Sub}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ProField label={t.monthlyIncome} value={monthlyIncome} onChange={setMonthlyIncome} prefix={currencies.find((c) => c.code === currency)?.symbol} type="number" lang={language} />
                <ProField label={t.weeklyWorkHours} value={weeklyWorkHours} onChange={setWeeklyWorkHours} type="number" lang={language} />
                <ProField label={t.ageOptional} value={age} onChange={setAge} type="number" lang={language} />
                <ProField label={language === 'ar' ? 'معدل الادخار الحالي (٪) - اختياري' : 'Current savings rate (%) - optional'} value={savingsRate} onChange={setSavingsRate} type="number" lang={language} />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-200">{t.currency}</span>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#0b1a28] px-3 text-sm font-semibold text-white outline-none focus:border-[#b4ff3a]" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
                    {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.symbol}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/[.05] p-3">
                <p className="text-xs leading-5 text-slate-300">
                  <Sparkles size={13} className="mb-0.5 mr-1 inline text-cyan-300" />
                  {t.step1Helper}
                </p>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="reveal">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-[#b4ff3a]">{t.step2Label}</p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{t.step2Title}</h1>
              <p className="mt-2 text-sm text-slate-400">{t.step2Sub}</p>

              <div className="mt-4 space-y-3">
                {habits.map((habit, idx) => (
                  <div key={habit.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">{t.habitNumber} {idx + 1}</span>
                      {habits.length > 1 && (
                        <button onClick={() => removeHabit(habit.id)} className="text-slate-500 transition hover:text-orange-400" aria-label={t.removeHabit}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <input
                        aria-label={t.habitNameAria}
                        type="text"
                        value={habit.name}
                        onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                        placeholder={t.habitNamePlaceholder}
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#0b1a28] px-3 text-sm font-semibold text-white outline-none focus:border-[#b4ff3a] sm:col-span-2"
                        style={{ direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left' }}
                      />
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-slate-300">{t.category}</span>
                        <div className="flex flex-wrap gap-1">
                          {CATEGORIES.map((cat) => {
                            const CatIcon = CATEGORY_ICONS[cat];
                            return (
                              <button
                                key={cat}
                                onClick={() => updateHabit(habit.id, { category: cat })}
                                className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${habit.category === cat ? 'border-[#b4ff3a] bg-[#b4ff3a]/10 text-[#b4ff3a]' : 'border-white/10 text-slate-400 hover:border-white/30'}`}
                              >
                                <CatIcon size={12} /> {categoryLabel(language, cat)}
                              </button>
                            );
                          })}
                        </div>
                      </label>
                      <ProField label={t.costAmount} value={habit.costAmount} onChange={(v) => updateHabit(habit.id, { costAmount: v })} type="number" small lang={language} />
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-slate-300">{t.costFrequency}</span>
                        <select value={habit.costFrequency} onChange={(e) => updateHabit(habit.id, { costFrequency: e.target.value as ProFrequency })} className="h-9 w-full rounded-lg border border-white/10 bg-[#0b1a28] px-2 text-xs font-semibold text-white outline-none focus:border-[#b4ff3a]" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
                          {FREQUENCIES.map((f) => <option key={f} value={f}>{frequencyLabel(language, f)}</option>)}
                        </select>
                      </label>
                      <ProField label={t.timeHours} value={habit.timeAmount} onChange={(v) => updateHabit(habit.id, { timeAmount: v })} type="number" small lang={language} />
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-slate-300">{t.timeFrequency}</span>
                        <select value={habit.timeFrequency} onChange={(e) => updateHabit(habit.id, { timeFrequency: e.target.value as ProFrequency })} className="h-9 w-full rounded-lg border border-white/10 bg-[#0b1a28] px-2 text-xs font-semibold text-white outline-none focus:border-[#b4ff3a]" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
                          {FREQUENCIES.map((f) => <option key={f} value={f}>{frequencyLabel(language, f)}</option>)}
                        </select>
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-[10px] font-semibold text-slate-300">{t.importance}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => updateHabit(habit.id, { importance: n as 1 | 2 | 3 | 4 | 5 })}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${habit.importance === n ? 'bg-[#b4ff3a] text-[#07121b]' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {featureAccess.unlimitedHabits || habits.length < FREE_HABIT_LIMIT ? (
                <button onClick={addHabit} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3 text-sm font-semibold text-slate-400 transition hover:border-[#b4ff3a]/50 hover:text-[#b4ff3a]">
                  <Plus size={18} /> {t.addHabit}
                </button>
              ) : (
                <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-3 text-sm font-semibold text-slate-500">
                  <Lock size={16} /> {language === 'ar' ? `حد العادات المجانية (${FREE_HABIT_LIMIT}) — افتح برو لعادات غير محدودة` : `Free habit limit (${FREE_HABIT_LIMIT}) — Unlock Pro for unlimited habits`}
                </div>
              )}
            </section>
          )}

          {error && <p role="alert" className="mt-3 rounded-xl border border-orange-400/30 bg-orange-400/10 p-2.5 text-xs text-orange-200">{error}</p>}
        </div>

        <div className="shrink-0 pt-3">
          <button
            onClick={handleNext}
            disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b4ff3a] px-5 py-3 text-sm font-bold text-[#07121b] shadow-[0_10px_30px_rgba(180,255,58,.16)] transition hover:-translate-y-0.5 hover:bg-[#c4ff63] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:ml-auto"
          >
            {step === 2 ? (<><BarChart3 size={18} /> {t.analyze}</>) : (<>{t.continue} <ArrowRight size={18} /></>)}
          </button>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// PRO-SPECIFIC UI PRIMITIVES (isolated from existing components)
// ============================================================================

function ProHeader({ lang, onHome, onLanguage }: { lang: ProLang; onHome: () => void; onLanguage: () => void }) {
  const t = proCopy[lang];
  const isAr = lang === 'ar';
  const langBtn = isAr ? 'English' : 'العربية';
  return (
    <header className="relative z-10 shrink-0 border-b border-white/[.07]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 lg:px-10">
        <button onClick={onHome} aria-label="Hidden Cost home" className="flex items-center gap-2 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a] text-[#061019] shadow-[0_0_20px_rgba(180,255,58,.25)]">
            <Zap size={20} strokeWidth={3} fill="currentColor" />
          </span>
          <span className="font-display leading-none">
            <strong className="block text-[15px] font-extrabold tracking-tight">Hidden Cost <span className="text-[#b4ff3a]">Pro</span></strong>
            <small className="block pt-0.5 text-[10px] font-medium text-slate-300">{t.headerTagline}</small>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={onLanguage} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-4 py-2 text-sm font-semibold hover:border-[#b4ff3a]/50" aria-label="Switch language">
            <Globe2 size={17} /><span>{langBtn}</span><ChevronDown size={14} />
          </button>
          <span className="rounded-full border border-[#b4ff3a]/40 bg-[#b4ff3a]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#b4ff3a]">{t.proBadge}</span>
        </div>
      </div>
    </header>
  );
}

function ProField({
  label, value, onChange, prefix, type = 'text', small = false, lang,
}: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; type?: string; small?: boolean; lang: ProLang;
}) {
  const isAr = lang === 'ar';
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold text-slate-300">{label}</span>
      <div className={`flex ${small ? 'h-9' : 'h-11'} items-center rounded-${small ? 'lg' : 'xl'} border border-white/10 bg-[#0b1a28] px-3 transition focus-within:border-[#b4ff3a]`}>
        {prefix && <span className="mr-1.5 text-sm text-slate-400">{prefix}</span>}
        <input
          aria-label={label}
          type={type}
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
          placeholder="0"
          style={{ direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left' }}
        />
      </div>
    </label>
  );
}
