import { Brain, TrendingDown, Repeat, Zap, ShoppingBag, Clock, AlertCircle } from 'lucide-react';
import { getBehavioralQuote } from '@/lib/narrativeData';

type Lang = 'en' | 'ar';

export interface HabitProfile {
  isFrequentSmall: boolean;
  isConvenience: boolean;
  isImpulse: boolean;
  isSubscriptions: boolean;
  isDiningOutHigh: boolean;
  isLowExposure: boolean;
}

export interface PatternInfo {
  name: string;
  nameAr: string;
  tagline: string;
  taglineAr: string;
  icon: typeof Brain;
}

const PATTERNS: Record<string, PatternInfo> = {
  frequentSmall: { name: 'The Convenience Seeker', nameAr: 'باحث الراحة', tagline: 'Small amounts, repeated constantly', taglineAr: 'مبالغ صغيرة، مكررة باستمرار', icon: Repeat },
  convenience: { name: 'The Convenience Seeker', nameAr: 'باحث الراحة', tagline: 'Buying convenience with working time', taglineAr: 'يشتري الراحة بوقت العمل', icon: ShoppingBag },
  impulse: { name: 'The Impulse Decider', nameAr: 'صاحب القرارات اللحظية', tagline: 'Seconds to decide, hours to earn back', taglineAr: 'ثوانٍ للقرار، ساعات لتعويضها', icon: Zap },
  subscriptions: { name: 'The Subscription Collector', nameAr: 'جامع الاشتراكات', tagline: 'Silent monthly drains', taglineAr: 'استنزاف شهري صامت', icon: Clock },
  diningOutHigh: { name: 'The Convenience Seeker', nameAr: 'باحث الراحة', tagline: 'Meals costing more than you realize', taglineAr: 'وجبات تكلف أكثر مما تظن', icon: TrendingDown },
  lowExposure: { name: 'The Optimizer', nameAr: 'المُحسِّن', tagline: 'Low exposure — optimize, do not restrict', taglineAr: 'تعرض منخفض — حسّن بدل التقليص', icon: Brain },
  default: { name: 'The Repetition Spender', nameAr: 'المنفق المتكرر', tagline: 'Repetition is your biggest hidden cost', taglineAr: 'التكرار هو أكبر تكلفة خفية', icon: Repeat },
};

function getPattern(profile: HabitProfile): { key: string; info: PatternInfo } {
  if (profile.isFrequentSmall) return { key: 'frequentSmall', info: PATTERNS.frequentSmall };
  if (profile.isConvenience) return { key: 'convenience', info: PATTERNS.convenience };
  if (profile.isImpulse) return { key: 'impulse', info: PATTERNS.impulse };
  if (profile.isSubscriptions) return { key: 'subscriptions', info: PATTERNS.subscriptions };
  if (profile.isDiningOutHigh) return { key: 'diningOutHigh', info: PATTERNS.diningOutHigh };
  if (profile.isLowExposure) return { key: 'lowExposure', info: PATTERNS.lowExposure };
  return { key: 'default', info: PATTERNS.default };
}

export function DecisionPattern({ profile, lang }: { profile: HabitProfile; lang: Lang }) {
  const isAr = lang === 'ar';
  const { info } = getPattern(profile);
  const quote = getBehavioralQuote(profile);
  const Icon = info.icon;

  return (
    <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-600">
          <Brain size={26} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-600" style={{ letterSpacing: isAr ? '0' : '.18em' }}>
            {isAr ? 'نمط القرار' : 'DECISION PATTERN'}
          </p>
          <h3 className="font-display text-lg font-extrabold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>
            {isAr ? info.nameAr : info.name}
          </h3>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <Icon size={16} className="shrink-0 text-cyan-600" />
        <p className="text-sm font-semibold text-slate-800" style={{ textAlign: isAr ? 'right' : 'left' }}>
          {isAr ? info.taglineAr : info.tagline}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
        <div className="flex items-start gap-2.5">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-cyan-600" />
          <p className="text-sm leading-6 text-slate-800" style={{ textAlign: isAr ? 'right' : 'left' }}>
            "{quote}"
          </p>
        </div>
      </div>
    </div>
  );
}

export function classifyProfile(habits: { name: string; cost: number; costFrequency: string; timeLost: number }[]): HabitProfile {
  if (habits.length === 0) {
    return { isFrequentSmall: false, isConvenience: false, isImpulse: false, isSubscriptions: false, isDiningOutHigh: false, isLowExposure: true };
  }
  const dailyHabits = habits.filter((h) => h.costFrequency === 'daily').length;
  const hasSubscriptions = habits.some((h) => h.costFrequency === 'monthly' && /subscription|netflix|spotify|gym|membership/i.test(h.name));
  const hasDiningOut = habits.some((h) => /coffee|eat|dining|restaurant|food|meal|lunch/i.test(h.name));
  const avgCost = habits.reduce((sum, h) => sum + h.cost, 0) / habits.length;
  const totalMonthly = habits.reduce((sum, h) => {
    const monthly = h.costFrequency === 'daily' ? h.cost * 30 : h.costFrequency === 'weekly' ? h.cost * 4.33 : h.cost;
    return sum + monthly;
  }, 0);

  return {
    isFrequentSmall: dailyHabits >= 2 && avgCost < 20,
    isConvenience: dailyHabits >= 1 && avgCost < 15,
    isImpulse: habits.some((h) => /shopping|impulse|online|amazon/i.test(h.name)) && dailyHabits < 2,
    isSubscriptions: hasSubscriptions,
    isDiningOutHigh: hasDiningOut && totalMonthly > 200,
    isLowExposure: totalMonthly < 100 && habits.length <= 2,
  };
}
