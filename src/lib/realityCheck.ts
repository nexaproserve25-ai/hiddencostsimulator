import Decimal from 'decimal.js';
import { calculate, type CalculationInput, type CalculationResult, type Frequency } from '@/services/calculationEngine';

export type IncomeMode = 'hourly' | 'monthly';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  label: string;
  icon: string;
  cost: number;
  costFrequency: HabitFrequency;
  timeLost: number;
  timeFrequency: HabitFrequency;
}

export interface RealityCheckState {
  incomeMode: IncomeMode;
  hourlyWage: number;
  monthlyIncome: number;
  monthlyBaselineExpenses: number;
  workHoursPerWeek: number;
  currency: string;
  habits: Habit[];
}

const HABIT_TEMPLATES: { id: string; label: { en: string; ar: string }; icon: string }[] = [
  { id: 'coffee', label: { en: 'Daily Coffee', ar: 'قهوة يومية' }, icon: 'coffee' },
  { id: 'subscriptions', label: { en: 'Subscriptions', ar: 'اشتراكات' }, icon: 'repeat' },
  { id: 'dining', label: { en: 'Dining Out', ar: 'تناول خارج المنزل' }, icon: 'utensils' },
  { id: 'smoking', label: { en: 'Smoking / Vaping', ar: 'تدخين / تدخين إلكتروني' }, icon: 'cigarette' },
  { id: 'impulse', label: { en: 'Impulse Shopping', ar: 'تسوق اندفاعي' }, icon: 'shopping-bag' },
  { id: 'drinks', label: { en: 'Drinks / Nights Out', ar: 'مشروبات / سهرات' }, icon: 'wine' },
  { id: 'streaming', label: { en: 'Streaming Services', ar: 'خدمات البث' }, icon: 'play' },
  { id: 'gym', label: { en: 'Unused Gym Membership', ar: 'اشتراك رياضة غير مستخدم' }, icon: 'dumbbell' },
];

export function getHabitTemplates(lang: 'en' | 'ar') {
  return HABIT_TEMPLATES.map((t) => ({ id: t.id, label: t.label[lang], icon: t.icon }));
}

export function createHabit(templateId: string, lang: 'en' | 'ar'): Habit {
  const tpl = HABIT_TEMPLATES.find((t) => t.id === templateId);
  return {
    id: templateId + '-' + Math.random().toString(36).slice(2, 8),
    label: tpl ? tpl.label[lang] : (lang === 'ar' ? 'عادة مخصصة' : 'Custom Habit'),
    icon: tpl?.icon ?? 'custom',
    cost: 0,
    costFrequency: 'daily',
    timeLost: 0,
    timeFrequency: 'daily',
  };
}

function toEngineFrequency(freq: HabitFrequency): Frequency {
  if (freq === 'daily') return 'Daily';
  if (freq === 'weekly') return 'Weekly';
  return 'Monthly';
}

export function buildEngineInput(state: RealityCheckState): CalculationInput {
  return {
    habits: state.habits.map((h) => ({
      name: h.label,
      amount: new Decimal(h.cost || 0),
      amountFrequency: toEngineFrequency(h.costFrequency),
      lostTime: new Decimal(h.timeLost || 0),
      lostTimeFrequency: toEngineFrequency(h.timeFrequency),
    })),
    lifetimeYears: new Decimal(10),
    incomeData: {
      monthlySalary: new Decimal(state.monthlyIncome || 0),
      monthlyBaselineExpenses: new Decimal(state.monthlyBaselineExpenses || 0),
      workingHoursPerWeek: new Decimal(state.workHoursPerWeek || 0),
    },
  };
}

export function runCalculation(state: RealityCheckState): CalculationResult {
  const input = buildEngineInput(state);
  return calculate(input);
}

export { calculate, type CalculationResult };

export const initialRealityState: RealityCheckState = {
  incomeMode: 'monthly',
  hourlyWage: 25,
  monthlyIncome: 4000,
  monthlyBaselineExpenses: 1500,
  workHoursPerWeek: 40,
  currency: 'USD',
  habits: [],
};
