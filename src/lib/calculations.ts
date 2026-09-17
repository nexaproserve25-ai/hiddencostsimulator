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
  const financialScore = calculateFinancialScore(cost, state.monthlyIncome);
  const timeScore = calculateTimeScore(duration, weeklyFreeHours);
  const score = clampScore(financialScore * .35 + timeScore * .35 + motivationScore * .30);
  return { score, level: levelFor(score, state.decisionType), decisionType: state.decisionType, motivation: state.motivation, currency: state.currency, financialScore, timeScore, motivationScore, hourlyIncome, weeklyFreeHours, financialWorkHours: hourlyIncome > 0 ? cost / hourlyIncome : 0, timeConsumptionPercent: Math.min(100, duration / weeklyFreeHours * 100), titleKey: titleFor(state.decisionType, state.motivation) };
}
