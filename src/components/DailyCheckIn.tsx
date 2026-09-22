import { useState } from 'react';
import { Check, Clock, DollarSign, Plus, X } from 'lucide-react';
import { TIMELINE_MILESTONES } from '@/lib/narrativeData';

type Lang = 'en' | 'ar';

const copy = {
  en: {
    title: 'Daily Check-In',
    dayLabel: 'Day',
    spentToday: 'What did you spend today?',
    spentPlaceholder: 'Amount',
    avoided: 'Did you avoid any purchase you would normally make?',
    avoidedYes: 'Yes, I avoided one',
    avoidedNo: 'No',
    submit: 'Log Today',
    recovered: 'YOU RECOVERED',
    timeRecovered: 'of working time',
    noRecovery: 'No recovery logged today. Tomorrow is another chance.',
    close: 'Close',
    amountError: 'Enter a valid amount',
  },
  ar: {
    title: 'تسجيل يومي',
    dayLabel: 'اليوم',
    spentToday: 'ما الذي أنفقته اليوم؟',
    spentPlaceholder: 'المبلغ',
    avoided: 'هل تجنبت أي عملية شراء كنت ستجريها عادةً؟',
    avoidedYes: 'نعم، تجنبت واحدة',
    avoidedNo: 'لا',
    submit: 'سجّل اليوم',
    recovered: 'استعدت',
    timeRecovered: 'من وقت العمل',
    noRecovery: 'لا استرداد اليوم. غداً فرصة جديدة.',
    close: 'إغلاق',
    amountError: 'أدخل مبلغاً صحيحاً',
  },
};

export interface CheckInResult {
  spent: number;
  avoidedAmount: number;
  recoveredMoney: number;
  recoveredHours: number;
  recoveredMinutes: number;
  day: number;
}

export function DailyCheckIn({ lang, hourlyRate, day, onSubmit, onClose }: { lang: Lang; hourlyRate: number; day: number; onSubmit: (r: CheckInResult) => void; onClose: () => void }) {
  const isAr = lang === 'ar';
  const t = copy[lang];
  const [spent, setSpent] = useState('');
  const [avoidedAmount, setAvoidedAmount] = useState('');
  const [avoided, setAvoided] = useState<'yes' | 'no' | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    const spentNum = Number(spent) || 0;
    const avoidedNum = avoided === 'yes' ? (Number(avoidedAmount) || 0) : 0;
    if (avoided === 'yes' && avoidedNum <= 0) { setError(t.amountError); return; }
    const recoveredMoney = avoidedNum;
    const recoveredHours = hourlyRate > 0 ? Math.floor(recoveredMoney / hourlyRate) : 0;
    const recoveredMinutes = hourlyRate > 0 ? Math.round(((recoveredMoney / hourlyRate) - recoveredHours) * 60) : 0;
    const r: CheckInResult = { spent: spentNum, avoidedAmount: avoidedNum, recoveredMoney, recoveredHours, recoveredMinutes, day };
    setResult(r);
    onSubmit(r);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ direction: isAr ? 'rtl' : 'ltr' }}>
        <button onClick={onClose} className={isAr ? 'absolute left-4 top-4 text-slate-500 hover:text-slate-800' : 'absolute right-4 top-4 text-slate-500 hover:text-slate-800'} aria-label={t.close}><X size={20} /></button>

        {!result ? (
          <>
            <div className="mb-1 flex items-center gap-2">
              <Clock size={18} className="text-[#5a9a32]" />
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#5a9a32]" style={{ letterSpacing: isAr ? '0' : '.18em' }}>{t.dayLabel} {day}</span>
            </div>
            <h2 className="font-display text-xl font-extrabold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.title}</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-800" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.spentToday}</label>
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#b4ff3a]">
                  <DollarSign size={16} className="text-slate-500" />
                  <input type="number" min="0" value={spent} onChange={(e) => setSpent(e.target.value)} className="w-full bg-transparent px-2 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-300" placeholder={t.spentPlaceholder} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-800" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.avoided}</label>
                <div className="flex gap-2">
                  <button onClick={() => setAvoided('yes')} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${avoided === 'yes' ? 'border-[#b4ff3a] bg-[#b4ff3a]/15 text-[#5a9a32]' : 'border-slate-200 bg-white text-slate-800'}`}>{t.avoidedYes}</button>
                  <button onClick={() => { setAvoided('no'); setAvoidedAmount(''); }} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${avoided === 'no' ? 'border-slate-400 bg-slate-200 text-slate-950' : 'border-slate-200 bg-white text-slate-800'}`}>{t.avoidedNo}</button>
                </div>
              </div>

              {avoided === 'yes' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-800" style={{ textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'كم كان سيكلفك؟' : 'How much would it have cost?'}</label>
                  <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#b4ff3a]">
                    <DollarSign size={16} className="text-slate-500" />
                    <input type="number" min="0" value={avoidedAmount} onChange={(e) => setAvoidedAmount(e.target.value)} className="w-full bg-transparent px-2 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-300" placeholder="0" />
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-orange-600" style={{ textAlign: isAr ? 'right' : 'left' }}>{error}</p>}

              <button onClick={handleSubmit} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b4ff3a] px-5 py-3 text-sm font-bold text-[#07121b] transition hover:-translate-y-0.5 hover:bg-[#c4ff63]">
                <Plus size={18} /> {t.submit}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            {result.recoveredMoney > 0 ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/15">
                  <Check size={32} className="text-[#5a9a32]" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#5a9a32]" style={{ letterSpacing: isAr ? '0' : '.18em' }}>{t.recovered}</p>
                <div className="mt-2 font-display text-4xl font-extrabold text-[#5a9a32]">
                  ${result.recoveredMoney.toFixed(2)}
                </div>
                <p className="mt-2 text-sm text-slate-800">
                  {result.recoveredHours}h {result.recoveredMinutes}m {t.timeRecovered}
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300 bg-slate-100">
                  <Clock size={32} className="text-slate-600" />
                </div>
                <p className="text-sm text-slate-800">{t.noRecovery}</p>
              </>
            )}
            <button onClick={onClose} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-950 transition hover:border-[#b4ff3a]/60">
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { TIMELINE_MILESTONES };
