import { Award, Calendar, TrendingUp, FileText } from 'lucide-react';
import { TIMELINE_MILESTONES } from '@/lib/narrativeData';

type Lang = 'en' | 'ar';

const copy = {
  en: {
    day30: 'YOUR FIRST 30 DAYS',
    buildingAwareness: 'Building Awareness',
    potentialRecovery: 'Potential Annual Recovery',
    day90: 'HALF WAY THERE',
    day180: 'YOUR 180-DAY TRANSFORMATION',
    day1Vs180: 'Day 1 vs Day 180 Comparison',
    downloadReport: 'Download PDF Report',
    moneyRecovered: 'Money Recovered',
    timeRecovered: 'Time Recovered',
    day1: 'Day 1 Baseline',
    day180Label: 'Day 180 Now',
    notAvailable: 'Complete more check-ins to unlock this milestone.',
  },
  ar: {
    day30: 'أول 30 يوماً',
    buildingAwareness: 'بناء الوعي',
    potentialRecovery: 'الاسترداد السنوي المحتمل',
    day90: 'منتصف الطريق',
    day180: 'تحول 180 يوماً',
    day1Vs180: 'مقارنة اليوم 1 واليوم 180',
    downloadReport: 'تحميل تقرير PDF',
    moneyRecovered: 'المال المسترد',
    timeRecovered: 'الوقت المسترد',
    day1: 'أساس اليوم 1',
    day180Label: 'اليوم 180 الآن',
    notAvailable: 'أكمل المزيد من التسجيلات اليومية لفتح هذا الإنجاز.',
  },
};

export interface DashboardData {
  day: number;
  baselineMonthlySpend: number;
  currentMonthlySpend: number;
  moneyRecovered: number;
  timeRecoveredHours: number;
  timeRecoveredMinutes: number;
  lifeScore: number;
  hourlyRate: number;
  checkIns: { day: number; recoveredMoney: number; recoveredHours: number; recoveredMinutes: number }[];
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border p-4 text-center" style={{ borderColor: `${color}33`, background: `${color}0D` }}>
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-slate-400">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function MilestoneReports({ data, lang, onDownloadPDF }: { data: DashboardData; lang: Lang; onDownloadPDF: () => void }) {
  const isAr = lang === 'ar';
  const t = copy[lang];
  const dir = isAr ? 'rtl' : 'ltr';

  const day30Projected = data.moneyRecovered > 0 && data.day >= 30
    ? (data.moneyRecovered / data.day) * 365
    : 0;

  return (
    <div className="space-y-4" style={{ direction: dir }}>
      {/* Day 30 */}
      <div className="rounded-2xl border border-[#b4ff3a]/20 bg-[#b4ff3a]/[.04] p-5">
        <div className="flex items-center gap-3">
          <Calendar size={22} className="text-[#b4ff3a]" />
          <div>
            <h3 className="font-display text-base font-extrabold text-white" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.day30}</h3>
            <p className="text-xs text-slate-400">{t.buildingAwareness}</p>
          </div>
        </div>
        {data.day >= 30 && day30Projected > 0 ? (
          <div className="mt-4">
            <div className="rounded-xl border border-[#b4ff3a]/20 bg-[#b4ff3a]/[.06] p-4 text-center">
              <p className="text-xs text-slate-300">{t.potentialRecovery}</p>
              <div className="mt-1 font-display text-3xl font-extrabold text-[#b4ff3a]">${day30Projected.toFixed(0)}</div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300" style={{ textAlign: isAr ? 'right' : 'left' }}>
              {TIMELINE_MILESTONES.day30.projectedMessage(`$${day30Projected.toFixed(0)}`)}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.notAvailable}</p>
        )}
      </div>

      {/* Day 90 */}
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[.04] p-5">
        <div className="flex items-center gap-3">
          <TrendingUp size={22} className="text-cyan-300" />
          <div>
            <h3 className="font-display text-base font-extrabold text-white" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.day90}</h3>
          </div>
        </div>
        {data.day >= 90 ? (
          <p className="mt-3 text-sm leading-6 text-slate-200" style={{ textAlign: isAr ? 'right' : 'left' }}>
            {TIMELINE_MILESTONES.day90.heroStatement}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.notAvailable}</p>
        )}
      </div>

      {/* Day 180 */}
      <div className="rounded-2xl border border-orange-400/20 bg-orange-400/[.04] p-5">
        <div className="flex items-center gap-3">
          <Award size={22} className="text-orange-300" />
          <div>
            <h3 className="font-display text-base font-extrabold text-white" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.day180}</h3>
          </div>
        </div>
        {data.day >= 180 ? (
          <div className="mt-4">
            <p className="text-sm leading-6 text-slate-200" style={{ textAlign: isAr ? 'right' : 'left' }}>
              {TIMELINE_MILESTONES.day180.finalStatement}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[.04] p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-slate-500">{t.day1}</p>
                <div className="mt-1 text-lg font-extrabold text-slate-300">${data.baselineMonthlySpend.toFixed(0)}/mo</div>
              </div>
              <div className="rounded-xl border border-[#b4ff3a]/20 bg-[#b4ff3a]/[.06] p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-[#b4ff3a]">{t.day180Label}</p>
                <div className="mt-1 text-lg font-extrabold text-[#b4ff3a]">${data.currentMonthlySpend.toFixed(0)}/mo</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatCard label={t.moneyRecovered} value={`$${data.moneyRecovered.toFixed(0)}`} color="#b4ff3a" />
              <StatCard label={t.timeRecovered} value={`${data.timeRecoveredHours}h ${data.timeRecoveredMinutes}m`} color="#22d3ee" />
            </div>
            <button onClick={onDownloadPDF} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-400/20 border border-orange-400/40 px-5 py-3 text-sm font-bold text-orange-200 transition hover:bg-orange-400/30">
              <FileText size={18} /> {t.downloadReport}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.notAvailable}</p>
        )}
      </div>
    </div>
  );
}
