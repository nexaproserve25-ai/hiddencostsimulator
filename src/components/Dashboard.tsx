import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Award, Calendar, Clock, DollarSign, TrendingUp, Zap, Plus, Activity } from 'lucide-react';
import { CORE_PHILOSOPHY, TIMELINE_MILESTONES } from '@/lib/narrativeData';
import { DailyCheckIn, type CheckInResult } from '@/components/DailyCheckIn';
import { MilestoneReports, type DashboardData } from '@/components/MilestoneReports';
import { useAuth } from '@/context/AuthContext';
import { usePayment } from '@/context/PaymentContext';
import { loadProgress, saveProgress, DEFAULT_PROGRESS, type ProgressData } from '@/services/progressService';

type Lang = 'en' | 'ar';

const copy = {
  en: {
    title: 'Your Recovery Dashboard',
    subtitle: '180-Day Financial Recovery Tracker',
    backHome: 'Back to Home',
    moneySpent: 'Money Spent',
    before: 'Before',
    now: 'Now',
    hiddenTimeCost: 'Hidden Time Cost',
    moneyRecovered: 'Money Recovered',
    timeRecovered: 'Time Recovered',
    lifeScore: 'Life Recovery Score',
    scoreDisclaimer: 'This score reflects changes in the spending patterns you entered. It is not a measure of your financial worth or personal success.',
    dailyCheckIn: 'Daily Check-In',
    milestones: 'Milestone Reports',
    day: 'Day',
    of180: 'of 180',
    checkIn: 'Log Today',
    perMonth: '/mo',
    hoursPerMonth: 'h/mo',
    previewMode: 'Preview Mode — Your data will be saved once you start logging daily check-ins.',
    signInToSave: 'Sign in to save your progress across sessions.',
  },
  ar: {
    title: 'لوحة التعافي',
    subtitle: 'متتبع التعافي المالي — 180 يوماً',
    backHome: 'العودة للرئيسية',
    moneySpent: 'المنفق',
    before: 'قبل',
    now: 'الآن',
    hiddenTimeCost: 'التكلفة الزمنية الخفية',
    moneyRecovered: 'المال المسترد',
    timeRecovered: 'الوقت المسترد',
    lifeScore: 'درجة استرداد الحياة',
    scoreDisclaimer: 'تعكس هذه الدرجة التغييرات في أنماط الإنفاق التي أدخلتها. وهي ليست مقياساً لقيمتك المالية أو نجاحك الشخصي.',
    dailyCheckIn: 'تسجيل يومي',
    milestones: 'تقارير الإنجاز',
    day: 'اليوم',
    of180: 'من 180',
    checkIn: 'سجّل اليوم',
    perMonth: '/شهر',
    hoursPerMonth: 'س/شهر',
    previewMode: 'وضع المعاينة — ستُحفظ بياناتك بمجرد بدء التسجيل اليومي.',
    signInToSave: 'سجّل الدخول لحفظ تقدمك عبر الجلسات.',
  },
};

function Header({ lang, onHome }: { lang: Lang; onHome: () => void }) {
  const isAr = lang === 'ar';
  return (
    <header className="relative z-10 shrink-0 border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 lg:px-10 lg:py-2.5">
        <button onClick={onHome} className="flex items-center gap-2 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a] text-[#061019] shadow-[0_0_20px_rgba(180,255,58,.25)]"><Zap size={20} strokeWidth={3} fill="currentColor" /></span>
          <span className="font-display leading-none"><strong className="block text-[15px] font-extrabold tracking-tight text-slate-950">{isAr ? 'التكلفة الخفية' : 'Hidden Cost'}</strong><small className="block pt-0.5 text-[10px] font-semibold text-slate-600">{isAr ? 'لوحة التعافي' : 'Recovery Dashboard'}</small></span>
        </button>
        <button onClick={onHome} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#b4ff3a]/50 hover:text-slate-950">
          <ArrowLeft size={16} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />{copy[lang].backHome}
        </button>
      </div>
    </header>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }: { icon: typeof DollarSign; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${color}25`, background: `${color}08` }}>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}15`, color }}><Icon size={16} /></span>
        <span className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-600">{label}</span>
      </div>
      <div className="mt-2 text-xl font-extrabold" style={{ color }}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}

function toProgressData(d: DashboardData): ProgressData {
  return {
    day: d.day,
    baselineMonthlySpend: d.baselineMonthlySpend,
    currentMonthlySpend: d.currentMonthlySpend,
    moneyRecovered: d.moneyRecovered,
    timeRecoveredHours: d.timeRecoveredHours,
    timeRecoveredMinutes: d.timeRecoveredMinutes,
    lifeScore: d.lifeScore,
    hourlyRate: d.hourlyRate,
    checkIns: d.checkIns,
  };
}

function toDashboardData(p: ProgressData): DashboardData {
  return p;
}

export function Dashboard({ lang, onHome, initialState }: { lang: Lang; onHome: () => void; initialState?: Partial<DashboardData> }) {
  const isAr = lang === 'ar';
  const t = copy[lang];
  const dir = isAr ? 'rtl' : 'ltr';
  const { user } = useAuth();
  const { canAccess } = usePayment();
  const canPersist = !!user && canAccess('roadmap180');

  const [data, setData] = useState<DashboardData>({
    day: initialState?.day ?? 1,
    baselineMonthlySpend: initialState?.baselineMonthlySpend ?? 500,
    currentMonthlySpend: initialState?.currentMonthlySpend ?? 500,
    moneyRecovered: initialState?.moneyRecovered ?? 0,
    timeRecoveredHours: initialState?.timeRecoveredHours ?? 0,
    timeRecoveredMinutes: initialState?.timeRecoveredMinutes ?? 0,
    lifeScore: initialState?.lifeScore ?? 50,
    hourlyRate: initialState?.hourlyRate ?? 25,
    checkIns: initialState?.checkIns ?? [],
  });
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [loaded, setLoaded] = useState(!canPersist);

  useEffect(() => {
    if (!canPersist) { setLoaded(true); return; }
    let cancelled = false;
    loadProgress(user!.id).then((saved) => {
      if (cancelled) return;
      if (saved) setData(toDashboardData(saved));
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [user, canPersist]);

  const persist = useCallback((next: DashboardData) => {
    if (canPersist && user) saveProgress(user.id, toProgressData(next));
  }, [canPersist, user]);

  const handleCheckIn = (r: CheckInResult) => {
    setData((prev) => {
      const next: DashboardData = {
        ...prev,
        day: Math.min(180, prev.day + 1),
        moneyRecovered: prev.moneyRecovered + r.recoveredMoney,
        timeRecoveredHours: prev.timeRecoveredHours + r.recoveredHours + Math.floor((prev.timeRecoveredMinutes + r.recoveredMinutes) / 60),
        timeRecoveredMinutes: (prev.timeRecoveredMinutes + r.recoveredMinutes) % 60,
        checkIns: [...prev.checkIns, r],
        lifeScore: Math.min(100, Math.round(50 + (prev.moneyRecovered + r.recoveredMoney) / Math.max(prev.baselineMonthlySpend, 1) * 10)),
        currentMonthlySpend: Math.max(0, prev.currentMonthlySpend - r.recoveredMoney * 0.1),
      };
      persist(next);
      return next;
    });
  };

  const hiddenTimeHours = data.hourlyRate > 0 ? data.currentMonthlySpend / data.hourlyRate : 0;

  if (!loaded) {
    return (
      <div className="app-shell grid-texture" style={{ direction: dir }}>
        <Header lang={lang} onHome={onHome} />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm font-semibold text-slate-600">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell grid-texture" style={{ direction: dir }}>
      <Header lang={lang} onHome={onHome} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6 lg:px-8 lg:py-8">
          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-[#b4ff3a]/40 bg-[#b4ff3a]/10 px-3 py-1 text-[11px] font-bold text-[#5a9a32]">
                <Calendar size={12} /> {t.day} {data.day} {t.of180}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
          </div>

          {/* Preview / sign-in banner */}
          {data.checkIns.length === 0 && (
            <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-3 text-center text-xs text-orange-700">
              {canPersist ? t.previewMode : t.signInToSave}
            </div>
          )}

          {/* Core philosophy quote */}
          <div className="mb-6 rounded-2xl border border-[#b4ff3a]/20 bg-gradient-to-br from-[#b4ff3a]/[.06] to-transparent p-5 text-center">
            <p className="font-display text-base font-bold italic text-slate-800">"{CORE_PHILOSOPHY.mainQuote}"</p>
          </div>

          {/* 5 Core Metrics */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <MetricCard icon={DollarSign} label={t.moneySpent} value={`$${data.baselineMonthlySpend.toFixed(0)}`} sub={`${t.before}: $${data.baselineMonthlySpend.toFixed(0)} · ${t.now}: $${data.currentMonthlySpend.toFixed(0)}`} color="#fb923c" />
            <MetricCard icon={Clock} label={t.hiddenTimeCost} value={`${Math.round(hiddenTimeHours)}h`} sub={`${t.perMonth.replace('/mo', isAr ? '/شهر' : '/mo')}`} color="#22d3ee" />
            <MetricCard icon={TrendingUp} label={t.moneyRecovered} value={`$${data.moneyRecovered.toFixed(0)}`} color="#b4ff3a" />
            <MetricCard icon={Clock} label={t.timeRecovered} value={`${data.timeRecoveredHours}h ${data.timeRecoveredMinutes}m`} color="#a78bfa" />
            <MetricCard icon={Award} label={t.lifeScore} value={`${data.lifeScore}`} sub="/ 100" color="#f472b6" />
            <button onClick={() => setShowCheckIn(true)} className="rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/10 p-4 text-center transition hover:bg-[#b4ff3a]/20">
              <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a]/20 text-[#5a9a32]"><Plus size={16} /></span>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#5a9a32]">{t.checkIn}</div>
            </button>
          </div>

          {/* Score disclaimer */}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Activity size={14} className="mt-0.5 shrink-0 text-slate-500" />
            <p className="text-[11px] leading-5 text-slate-500" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.scoreDisclaimer}</p>
          </div>

          {/* Day 1 mission */}
          {data.day === 1 && (
            <div className="mt-5 rounded-2xl border border-[#b4ff3a]/20 bg-[#b4ff3a]/[.05] p-5">
              <h3 className="font-display text-sm font-extrabold text-[#5a9a32]">{TIMELINE_MILESTONES.day1.title}</h3>
              <p className="mt-2 text-sm italic text-slate-800">"{TIMELINE_MILESTONES.day1.quote}"</p>
              <p className="mt-2 text-sm text-slate-600">{TIMELINE_MILESTONES.day1.mission}</p>
            </div>
          )}

          {/* Milestone Reports */}
          <div className="mt-6">
            <h2 className="mb-4 font-display text-lg font-extrabold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.milestones}</h2>
            <MilestoneReports data={data} lang={lang} onDownloadPDF={() => {}} />
          </div>
        </div>
      </main>

      {showCheckIn && <DailyCheckIn lang={lang} hourlyRate={data.hourlyRate} day={data.day} onSubmit={handleCheckIn} onClose={() => setShowCheckIn(false)} />}
    </div>
  );
}
