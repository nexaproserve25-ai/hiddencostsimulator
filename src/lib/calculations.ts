export type DecisionType = 'purchase' | 'extra_work' | 'entertainment';
export type Motivation = 'genuine' | 'fomo' | 'boredom' | 'emotional';
export type Frequency = 'weekly' | 'monthly';

export interface Currency { code: string; locale: string; symbol: string; }
export const currencies: Currency[] = [
  { code: 'USD', locale: 'en-US', symbol: '$' },
  { code: 'EUR', locale: 'de-DE', symbol: '€' },
  { code: 'GBP', locale: 'en-GB', symbol: '£' },
  { code: 'SAR', locale: 'ar-SA', symbol: 'SAR' },
  { code: 'AED', locale: 'ar-AE', symbol: 'AED' },
  { code: 'EGP', locale: 'ar-EG', symbol: 'EGP' },
];

export const motivationFactors: Record<Motivation, number> = { genuine: 15, fomo: 75, boredom: 65, emotional: 85 };

export interface SimulatorState {
  language: 'en' | 'ar'; currency: string; decisionType: DecisionType | null; monthlyIncome: number;
  price: number; extraIncome: number; frequency: Frequency; hoursPerWeek: number;
  cost: number; durationHours: number; freeHoursPerDay: number | null; motivation: Motivation | null;
}

export interface SimulationResult {
  score: number; level: string; decisionType: DecisionType; motivation: Motivation; currency: string;
  financialScore: number; timeScore: number; motivationScore: number; hourlyIncome: number; weeklyFreeHours: number;
  financialWorkHours?: number; timeConsumptionPercent?: number; monthlyEquivalent?: number; effectiveHourlyRate?: number;
  monthlyIncomePercent?: number; titleKey: string;
}

export const initialState: SimulatorState = { language: 'en', currency: 'USD', decisionType: null, monthlyIncome: 4000, price: 0, extraIncome: 0, frequency: 'weekly', hoursPerWeek: 0, cost: 0, durationHours: 0, freeHoursPerDay: null, motivation: null };

export function calculateHourlyIncome(monthlyIncome: number): number { return monthlyIncome > 0 ? monthlyIncome / 176 : 0; }
export function calculateFinancialScore(cost: number, monthlyIncome: number): number { return monthlyIncome > 0 ? Math.min(100, Math.max(0, cost / monthlyIncome * 100)) : 0; }
export function calculateTimeScore(hours: number, weeklyFreeHours: number): number { return weeklyFreeHours > 0 ? Math.min(100, Math.max(0, hours / weeklyFreeHours * 100)) : 100; }
export function clampScore(value: number): number { return Math.min(100, Math.max(1, Math.round(value))); }
export function levelFor(score: number, decisionType: DecisionType): string {
  if (decisionType === 'extra_work') return score < 25 ? 'light' : score < 50 ? 'moderate' : score < 75 ? 'heavy' : 'extreme';
  return score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'high' : 'extreme';
}
export function titleFor(decisionType: DecisionType, motivation: Motivation): string {
  const titles: Record<DecisionType, Record<Motivation, string>> = {
    purchase: { fomo: 'fomo_taxpayer', emotional: 'emotional_checkout', boredom: 'boredom_buyer', genuine: 'intentional_buyer' },
    entertainment: { fomo: 'weekend_follower', emotional: 'mood_spender', boredom: 'anti_boredom_department', genuine: 'intentional_explorer' },
    extra_work: { fomo: 'hustle_follower', emotional: 'escape_hustler', boredom: 'busy_bee', genuine: 'strategic_hustler' },
  };
  return titles[decisionType]?.[motivation] ?? '';
}

const decisionTypes: DecisionType[] = ['purchase', 'extra_work', 'entertainment'];
const motivations: Motivation[] = ['genuine', 'fomo', 'boredom', 'emotional'];
const frequencies: Frequency[] = ['weekly', 'monthly'];
function finiteAtLeastZero(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }

/** Validates a state object read back from browser storage. Returns null for anything that does not conform, so untrusted stored data can never reach the calculation or formatting code. */
export function parseSavedState(raw: unknown): SimulatorState | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if (item.language !== 'en' && item.language !== 'ar') return null;
  if (typeof item.currency !== 'string' || !currencies.some((entry) => entry.code === item.currency)) return null;
  if (item.decisionType !== null && !decisionTypes.includes(item.decisionType as DecisionType)) return null;
  if (item.motivation !== null && !motivations.includes(item.motivation as Motivation)) return null;
  if (!frequencies.includes(item.frequency as Frequency)) return null;
  if (item.freeHoursPerDay !== null && !finiteAtLeastZero(item.freeHoursPerDay)) return null;
  for (const key of ['monthlyIncome', 'price', 'extraIncome', 'hoursPerWeek', 'cost', 'durationHours'] as const) {
    if (!finiteAtLeastZero(item[key])) return null;
  }
  return {
    language: item.language, currency: item.currency,
    decisionType: (item.decisionType ?? null) as DecisionType | null,
    motivation: (item.motivation ?? null) as Motivation | null,
    frequency: item.frequency as Frequency,
    freeHoursPerDay: (item.freeHoursPerDay ?? null) as number | null,
    monthlyIncome: item.monthlyIncome as number, price: item.price as number,
    extraIncome: item.extraIncome as number, hoursPerWeek: item.hoursPerWeek as number,
    cost: item.cost as number, durationHours: item.durationHours as number,
  };
}
export function calculateResult(state: SimulatorState): SimulationResult | null {
  if (!state.decisionType || !state.motivation || !state.freeHoursPerDay || state.monthlyIncome <= 0) return null;
  const hourlyIncome = calculateHourlyIncome(state.monthlyIncome);
  const weeklyFreeHours = state.freeHoursPerDay * 7;
  const motivationScore = motivationFactors[state.motivation];
  if (state.decisionType === 'extra_work') {
    const monthlyEquivalent = state.frequency === 'weekly' ? state.extraIncome * 52 / 12 : state.extraIncome;
    const weeklyEquivalent = state.frequency === 'weekly' ? state.extraIncome : state.extraIncome / 4.33;
    const timeScore = calculateTimeScore(state.hoursPerWeek, weeklyFreeHours);
    const financialScore = calculateFinancialScore(monthlyEquivalent, state.monthlyIncome);
    return { score: clampScore(timeScore * .5 + motivationScore * .25 + financialScore * .25), level: levelFor(clampScore(timeScore * .5 + motivationScore * .25 + financialScore * .25), state.decisionType), decisionType: state.decisionType, motivation: state.motivation, currency: state.currency, financialScore, timeScore, motivationScore, hourlyIncome, weeklyFreeHours, monthlyEquivalent, effectiveHourlyRate: state.hoursPerWeek > 0 ? weeklyEquivalent / state.hoursPerWeek : 0, monthlyIncomePercent: financialScore, timeConsumptionPercent: Math.min(100, state.hoursPerWeek / weeklyFreeHours * 100), titleKey: titleFor(state.decisionType, state.motivation) };
  }
  const cost = state.decisionType === 'purchase' ? state.price : state.cost;
  const duration = state.decisionType === 'entertainment' ? state.durationHours : 0;
  const financialWorkHours = hourlyIncome > 0 ? cost / hourlyIncome : 0;
  const financialScore = calculateFinancialScore(cost, state.monthlyIncome);
  const timeScore = calculateTimeScore(duration, weeklyFreeHours);
  const score = clampScore(financialScore * .35 + timeScore * .35 + motivationScore * .30);
  const STANDARD_WEEKLY_FREE_HOURS = 40;
  const entertainmentTimePct = weeklyFreeHours > 0 ? Math.min(100, duration / weeklyFreeHours * 100) : 0;
  const workHoursTimePct = Math.min(100, financialWorkHours / STANDARD_WEEKLY_FREE_HOURS * 100);
  const timeConsumptionPercent = state.decisionType === 'entertainment' ? Math.max(entertainmentTimePct, workHoursTimePct) : workHoursTimePct;
  return { score, level: levelFor(score, state.decisionType), decisionType: state.decisionType, motivation: state.motivation, currency: state.currency, financialScore, timeScore, motivationScore, hourlyIncome, weeklyFreeHours, financialWorkHours, timeConsumptionPercent, titleKey: titleFor(state.decisionType, state.motivation) };
}

export interface BreakdownData { basePrice: number; hiddenTimeCost: number; opportunityCost: number; baseLabel: string; hiddenLabel: string; opportunityLabel: string; }

export function getBreakdownData(result: SimulationResult, state: SimulatorState): BreakdownData {
  const basePrice = state.decisionType === 'purchase' ? state.price : state.decisionType === 'entertainment' ? state.cost : state.extraIncome;
  const workHours = result.financialWorkHours ?? 0;
  const hourly = result.hourlyIncome > 0 ? result.hourlyIncome : 1;
  const hiddenTimeCost = workHours * hourly * (result.motivationScore / 100);
  const opportunityCost = basePrice * (Math.pow(1.07, 5) - 1);
  return {
    basePrice: Math.round(basePrice),
    hiddenTimeCost: Math.round(hiddenTimeCost),
    opportunityCost: Math.round(opportunityCost),
    baseLabel: 'Base Price',
    hiddenLabel: 'Hidden Time Cost',
    opportunityLabel: 'Opportunity Cost (5yr)',
  };
}

function humanizeWorkHours(workHours: number, language: 'en' | 'ar'): string {
  if (workHours <= 0) return language === 'ar' ? 'وقتك' : 'your time';
  const workdays = workHours / 8;
  const isAr = language === 'ar';
  if (workdays < 1) return isAr ? `${workHours} ساعة من العمل` : `${workHours} hours of labor`;
  if (workdays === Math.floor(workdays)) return isAr ? `${workdays} يوم عمل` : `${workdays} workday${workdays > 1 ? 's' : ''}`;
  const rounded = Math.round(workdays * 10) / 10;
  return isAr ? `${rounded} يوم عمل` : `${rounded} workdays`;
}

export function generateQuote(result: SimulationResult, language: 'en' | 'ar'): { text: string; source: 'en' | 'ar' } {
  const workHours = Math.round(result.financialWorkHours ?? 0);
  const freeTimePct = Math.round(result.timeConsumptionPercent ?? 0);
  const isAr = language === 'ar';
  const lifePhrase = humanizeWorkHours(workHours, language);
  if (result.decisionType === 'extra_work') {
    const monthlyEq = result.monthlyEquivalent ?? 0;
    const hrs = Math.round(result.timeConsumptionPercent ?? 0);
    if (isAr) return { text: `هل تبيع ${hrs}٪ من وقت فراغك مقابل ${Math.round(monthlyEq)} شهرياً، أم تشتري المال بأسبوعك؟`, source: 'ar' };
    return { text: `Are you selling ${hrs}% of your free time for ${Math.round(monthlyEq)}/month, or buying money with your week?`, source: 'en' };
  }
  if (isAr) {
    if (workHours > 0 && freeTimePct > 0) return { text: `هل تشتري هذا بـ${lifePhrase} من حياتك، أم تتاجر بساعات عملك للحصول عليه؟ ${freeTimePct}٪ من وقت فراغك هو الثمن الحقيقي.`, source: 'ar' };
    if (workHours > 0) return { text: `هذا الغرض يكلفك ${lifePhrase}. هل تستبدل وقت حياتك بلحظات عابرة من المتعة؟`, source: 'ar' };
    return { text: `كل ما تشتريه يُدفع بساعات من حياتك — وليس فقط بمالك.`, source: 'ar' };
  }
  if (workHours > 0 && freeTimePct > 0) return { text: `Are you buying this with ${lifePhrase} of your life, or trading hours of work to own it? ${freeTimePct}% of your free time is the real price.`, source: 'en' };
  if (workHours > 0) return { text: `This purchase costs you ${lifePhrase}. Are you trading a piece of your life for a fleeting moment of joy?`, source: 'en' };
  return { text: `Everything you buy is paid for with hours of your life — not just money.`, source: 'en' };
}
