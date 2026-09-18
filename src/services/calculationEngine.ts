import Decimal from 'decimal.js';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// PART 3 — CONFIGURATION CONSTANTS
// ============================================================================

export interface CalculationConfig {
  DaysPerYear: Decimal;
  WeeksPerYear: Decimal;
  MonthsPerYear: Decimal;
  HoursPerDay: Decimal;
  DefaultLifetimeYears: Decimal;
}

export const defaultConfig: CalculationConfig = {
  DaysPerYear: new Decimal('365.25'),
  WeeksPerYear: new Decimal('365.25').dividedBy(7),
  MonthsPerYear: new Decimal('12'),
  HoursPerDay: new Decimal('24'),
  DefaultLifetimeYears: new Decimal('10'),
};

// ============================================================================
// PART 14 — ERROR SYSTEM
// ============================================================================

export type CalculationErrorCode =
  | 'INVALID_FREQUENCY'
  | 'NEGATIVE_AMOUNT'
  | 'NEGATIVE_TIME'
  | 'EMPTY_NAME'
  | 'INVALID_DECIMAL'
  | 'MISSING_REQUIRED_DATA'
  | 'VALIDATION_MISMATCH';

export class CalculationEngineError extends Error {
  code: CalculationErrorCode;
  constructor(code: CalculationErrorCode, message: string) {
    super(message);
    this.name = 'CalculationEngineError';
    this.code = code;
  }
}

// ============================================================================
// PART 4 — INPUT DATA CONTRACT
// ============================================================================

export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface HabitInput {
  name: string;
  amount: Decimal;
  amountFrequency: Frequency;
  lostTime: Decimal;
  lostTimeFrequency: Frequency;
}

export interface IncomeData {
  monthlySalary: Decimal;
  monthlyBaselineExpenses: Decimal;
  workingHoursPerWeek: Decimal;
}

export interface CalculationInput {
  habits: HabitInput[];
  lifetimeYears: Decimal;
  incomeData: IncomeData;
}

// ============================================================================
// PART 9 — OUTPUT CONTRACT
// ============================================================================

export interface HabitResult {
  name: string;
  lifetimeCost: Decimal;
  lifetimeHours: Decimal;
  percentage: number;
}

export interface ComparisonMetric {
  id: string;
  labelEn: string;
  labelAr: string;
  hoursRequired: number;
  icon: string;
  achievableCount: number;
}

export interface TotalsResult {
  annualCost: Decimal;
  lifetimeCost: Decimal;
  annualHours: Decimal;
  lifetimeHours: Decimal;
  daysLost: Decimal;
  yearsLost: Decimal;
}

export interface FreedomAnalysis {
  freedomDelayYears: Decimal | null;
  freedomDelayStatus: 'CALCULATED' | 'INSUFFICIENT_DATA';
}

export interface ValidationReport {
  passed: boolean;
  errors: string[];
}

export interface CalculationResult {
  totals: TotalsResult;
  habits: HabitResult[];
  freedomAnalysis: FreedomAnalysis;
  comparisons: ComparisonMetric[];
  validation: ValidationReport;
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
}

// ============================================================================
// PART 15 — AUDIT REPORT
// ============================================================================

export interface AuditReport {
  rawInputs: CalculationInput;
  config: CalculationConfig;
  habitAnnualConversions: {
    name: string;
    annualCost: string;
    annualHours: string;
    costConversion: string;
    timeConversion: string;
  }[];
  lifetimeConversions: {
    totalLifetimeCost: string;
    totalLifetimeHours: string;
    daysLost: string;
    yearsLost: string;
  };
  percentageCalculations: {
    name: string;
    rawPercentage: string;
    roundedPercentage: number;
    remainder: string;
  }[];
  freedomAnalysis: {
    requiredNestEgg: string;
    annualSavingsCapacity: string;
    freedomDelayYears: string | null;
  };
  validation: ValidationReport;
}

// ============================================================================
// PART 5 — FREQUENCY CONVERSION ENGINE
// ============================================================================

function convertToAnnual(value: Decimal, frequency: Frequency, config: CalculationConfig): Decimal {
  switch (frequency) {
    case 'Daily': return value.times(config.DaysPerYear);
    case 'Weekly': return value.times(config.WeeksPerYear);
    case 'Monthly': return value.times(config.MonthsPerYear);
    case 'Yearly': return value;
    default: throw new CalculationEngineError('INVALID_FREQUENCY', `Unknown frequency: ${frequency}`);
  }
}

// ============================================================================
// PART 10 — LARGEST REMAINDER METHOD (Hare–Niemeyer)
// ============================================================================

function largestRemainder(rawPercentages: Decimal[], total: number): number[] {
  if (rawPercentages.length === 0) return [];

  // Special case: all values are zero — distribute evenly as 0
  const allZero = rawPercentages.every((d) => d.isZero());
  if (allZero) {
    return rawPercentages.map(() => 0);
  }

  // Special case: single habit
  if (rawPercentages.length === 1) {
    return [total];
  }

  const rawRounded = rawPercentages.map((d) => d.toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber());
  const initialSum = rawRounded.reduce((s, v) => s + v, 0);

  const remainders = rawPercentages.map((d, i) => ({
    index: i,
    remainder: d.minus(new Decimal(rawRounded[i])).toNumber(),
  }));

  remainders.sort((a, b) => b.remainder - a.remainder);

  let pointsToDistribute = Math.round(total * 100 - initialSum * 100);

  for (let i = 0; i < remainders.length && pointsToDistribute > 0; i++) {
    rawRounded[remainders[i].index] += 0.01;
    pointsToDistribute--;
  }

  if (pointsToDistribute < 0) {
    for (let i = remainders.length - 1; i >= 0 && pointsToDistribute < 0; i--) {
      rawRounded[remainders[i].index] -= 0.01;
      pointsToDistribute++;
    }
  }

  return rawRounded.map((v) => Math.round(v * 100) / 100);
}

// ============================================================================
// PART 12 — COMPARISON SYSTEM
// ============================================================================

const COMPARISON_DEFS: Omit<ComparisonMetric, 'achievableCount'>[] = [
  { id: 'languages', labelEn: 'New languages learned fluently', labelAr: 'لغات جديدة تتقنها', hoursRequired: 1000, icon: 'languages' },
  { id: 'books', labelEn: 'Books read', labelAr: 'كتب مقروءة', hoursRequired: 8, icon: 'book' },
  { id: 'movies', labelEn: 'Movies watched back-to-back', labelAr: 'أفلام تشاهدها على التوالي', hoursRequired: 2, icon: 'film' },
  { id: 'walking', labelEn: 'Days walking across the country', labelAr: 'أيام مشي عبر البلاد', hoursRequired: 12, icon: 'footprints' },
  { id: 'marathons', labelEn: 'Marathons completed', labelAr: 'ماراثونات مكتملة', hoursRequired: 4, icon: 'activity' },
];

function buildComparisons(totalLifetimeHours: Decimal): ComparisonMetric[] {
  return COMPARISON_DEFS.map((def) => ({
    ...def,
    achievableCount: totalLifetimeHours.dividedBy(def.hoursRequired).floor().toNumber(),
  }));
}

// ============================================================================
// PART 16 — VALIDATION SYSTEM
// ============================================================================

export function validate(input: CalculationInput, config: CalculationConfig = defaultConfig): ValidationResult {
  const errors: string[] = [];

  if (input.habits.length === 0) {
    errors.push('At least one habit is required.');
  }

  for (const habit of input.habits) {
    if (!habit.name || habit.name.trim().length === 0) {
      errors.push(`Habit name cannot be empty.`);
    }
    if (habit.amount.isNegative()) {
      errors.push(`Habit "${habit.name}" has a negative amount.`);
    }
    if (habit.lostTime.isNegative()) {
      errors.push(`Habit "${habit.name}" has negative lost time.`);
    }
    if (!['Daily', 'Weekly', 'Monthly', 'Yearly'].includes(habit.amountFrequency)) {
      errors.push(`Habit "${habit.name}" has invalid amount frequency.`);
    }
    if (!['Daily', 'Weekly', 'Monthly', 'Yearly'].includes(habit.lostTimeFrequency)) {
      errors.push(`Habit "${habit.name}" has invalid lost time frequency.`);
    }
  }

  if (!input.lifetimeYears || input.lifetimeYears.lte(0)) {
    errors.push('Lifetime years must be greater than zero.');
  }

  if (!input.incomeData || !input.incomeData.monthlySalary || input.incomeData.monthlySalary.lt(0)) {
    errors.push('Monthly salary must be provided and non-negative.');
  }

  if (!input.incomeData.workingHoursPerWeek || input.incomeData.workingHoursPerWeek.lte(0)) {
    errors.push('Working hours per week must be greater than zero.');
  }

  if (input.incomeData.monthlyBaselineExpenses && input.incomeData.monthlyBaselineExpenses.lt(0)) {
    errors.push('Baseline expenses cannot be negative.');
  }

  return { passed: errors.length === 0, errors };
}

function validateResult(result: CalculationResult, input: CalculationInput, config: CalculationConfig): ValidationReport {
  const errors: string[] = [];

  // Check sum of habit costs equals total cost
  const habitCostSum = result.habits.reduce((s, h) => s.plus(h.lifetimeCost), new Decimal(0));
  if (!habitCostSum.equals(result.totals.lifetimeCost)) {
    errors.push('Sum of habit lifetime costs does not equal total lifetime cost.');
  }

  // Check sum of habit hours equals total hours
  const habitHourSum = result.habits.reduce((s, h) => s.plus(h.lifetimeHours), new Decimal(0));
  if (!habitHourSum.equals(result.totals.lifetimeHours)) {
    errors.push('Sum of habit lifetime hours does not equal total lifetime hours.');
  }

  // Check hours / 24 equals days
  const computedDays = result.totals.lifetimeHours.dividedBy(config.HoursPerDay);
  if (!computedDays.equals(result.totals.daysLost)) {
    errors.push('Lifetime hours ÷ 24 does not equal days lost.');
  }

  // Check days / DaysPerYear equals years
  const computedYears = result.totals.daysLost.dividedBy(config.DaysPerYear);
  if (!computedYears.equals(result.totals.yearsLost)) {
    errors.push('Days lost ÷ DaysPerYear does not equal years lost.');
  }

  // Check percentages equal exactly 100% (skip when total cost is zero — all percentages are 0)
  if (result.habits.length > 0 && result.totals.lifetimeCost.gt(0)) {
    const pctSum = result.habits.reduce((s, h) => s + h.percentage, 0);
    if (Math.abs(pctSum - 100) > 0.01) {
      errors.push(`Percentages sum to ${pctSum}%, not 100%.`);
    }
  }

  return { passed: errors.length === 0, errors };
}

// ============================================================================
// PART 13 — PUBLIC ENGINE API: calculate()
// ============================================================================

export function calculate(input: CalculationInput, config: CalculationConfig = defaultConfig): CalculationResult {
  // Validate input
  const preValidation = validate(input, config);
  if (!preValidation.passed) {
    return {
      totals: {
        annualCost: new Decimal(0),
        lifetimeCost: new Decimal(0),
        annualHours: new Decimal(0),
        lifetimeHours: new Decimal(0),
        daysLost: new Decimal(0),
        yearsLost: new Decimal(0),
      },
      habits: [],
      freedomAnalysis: { freedomDelayYears: null, freedomDelayStatus: 'INSUFFICIENT_DATA' },
      comparisons: [],
      validation: preValidation,
    };
  }

  const lifetimeYears = input.lifetimeYears;

  // PART 5 & 6 — Convert each habit to annual and then lifetime
  const habitResults: { name: string; annualCost: Decimal; annualHours: Decimal; lifetimeCost: Decimal; lifetimeHours: Decimal }[] = [];

  for (const habit of input.habits) {
    const annualCost = convertToAnnual(habit.amount, habit.amountFrequency, config);
    const annualHours = convertToAnnual(habit.lostTime, habit.lostTimeFrequency, config);
    habitResults.push({
      name: habit.name,
      annualCost,
      annualHours,
      lifetimeCost: annualCost.times(lifetimeYears),
      lifetimeHours: annualHours.times(lifetimeYears),
    });
  }

  // PART 8 — TOTAL CALCULATIONS
  const totalAnnualCost = habitResults.reduce((s, h) => s.plus(h.annualCost), new Decimal(0));
  const totalLifetimeCost = habitResults.reduce((s, h) => s.plus(h.lifetimeCost), new Decimal(0));
  const totalAnnualHours = habitResults.reduce((s, h) => s.plus(h.annualHours), new Decimal(0));
  const totalLifetimeHours = habitResults.reduce((s, h) => s.plus(h.lifetimeHours), new Decimal(0));

  // PART 7 — STRICT TIME CONVERSION CHAIN: Hours → Days → Years
  const totalDaysLost = totalLifetimeHours.dividedBy(config.HoursPerDay);
  const totalYearsLost = totalDaysLost.dividedBy(config.DaysPerYear);

  // PART 10 — PERCENTAGE DISTRIBUTION (Largest Remainder Method)
  const rawPercentages = habitResults.map((h) =>
    totalLifetimeCost.gt(0)
      ? h.lifetimeCost.dividedBy(totalLifetimeCost).times(100)
      : new Decimal(0)
  );
  const roundedPercentages = largestRemainder(rawPercentages, 100);

  const habits: HabitResult[] = habitResults.map((h, i) => ({
    name: h.name,
    lifetimeCost: h.lifetimeCost,
    lifetimeHours: h.lifetimeHours,
    percentage: roundedPercentages[i],
  }));

  // PART 11 — FINANCIAL INDEPENDENCE CALCULATION (4% Safe Withdrawal Rule)
  let freedomAnalysis: FreedomAnalysis;
  const annualHabitCost = totalAnnualCost;
  const requiredNestEgg = annualHabitCost.times(25);
  const netAnnualIncome = input.incomeData.monthlySalary.times(config.MonthsPerYear);
  const annualBaselineExpenses = (input.incomeData.monthlyBaselineExpenses || new Decimal(0)).times(config.MonthsPerYear);
  const annualSavingsCapacity = netAnnualIncome.minus(annualBaselineExpenses);

  if (annualSavingsCapacity.lte(0) || requiredNestEgg.lte(0)) {
    freedomAnalysis = {
      freedomDelayYears: null,
      freedomDelayStatus: 'INSUFFICIENT_DATA',
    };
  } else {
    const delayYears = requiredNestEgg.dividedBy(annualSavingsCapacity);
    freedomAnalysis = {
      freedomDelayYears: delayYears,
      freedomDelayStatus: 'CALCULATED',
    };
  }

  // PART 12 — COMPARISONS
  const comparisons = buildComparisons(totalLifetimeHours);

  // Build result
  const result: CalculationResult = {
    totals: {
      annualCost: totalAnnualCost,
      lifetimeCost: totalLifetimeCost,
      annualHours: totalAnnualHours,
      lifetimeHours: totalLifetimeHours,
      daysLost: totalDaysLost,
      yearsLost: totalYearsLost,
    },
    habits,
    freedomAnalysis,
    comparisons,
    validation: { passed: true, errors: [] },
  };

  // PART 16 — VALIDATE RESULT
  const resultValidation = validateResult(result, input, config);
  result.validation = resultValidation;

  return result;
}

// ============================================================================
// PART 15 — PUBLIC ENGINE API: getAuditReport()
// ============================================================================

export function getAuditReport(input: CalculationInput, result: CalculationResult, config: CalculationConfig = defaultConfig): AuditReport {
  const habitAnnualConversions = input.habits.map((h) => {
    const annualCost = convertToAnnual(h.amount, h.amountFrequency, config);
    const annualHours = convertToAnnual(h.lostTime, h.lostTimeFrequency, config);
    return {
      name: h.name,
      annualCost: annualCost.toString(),
      annualHours: annualHours.toString(),
      costConversion: `${h.amount} × ${h.amountFrequency} → ${annualCost.toString()}`,
      timeConversion: `${h.lostTime} × ${h.lostTimeFrequency} → ${annualHours.toString()}`,
    };
  });

  const rawPercentages = input.habits.map((h) => {
    const annualCost = convertToAnnual(h.amount, h.amountFrequency, config);
    const lifetimeCost = annualCost.times(input.lifetimeYears);
    const totalLC = result.totals.lifetimeCost;
    const raw = totalLC.gt(0) ? lifetimeCost.dividedBy(totalLC).times(100) : new Decimal(0);
    const rounded = result.habits.find((hr) => hr.name === h.name)?.percentage ?? 0;
    return {
      name: h.name,
      rawPercentage: raw.toString(),
      roundedPercentage: rounded,
      remainder: raw.minus(new Decimal(rounded)).toString(),
    };
  });

  const netAnnualIncome = input.incomeData.monthlySalary.times(config.MonthsPerYear);
  const annualBaseline = (input.incomeData.monthlyBaselineExpenses || new Decimal(0)).times(config.MonthsPerYear);
  const annualSavingsCapacity = netAnnualIncome.minus(annualBaseline);
  const requiredNestEgg = result.totals.annualCost.times(25);

  return {
    rawInputs: input,
    config,
    habitAnnualConversions,
    lifetimeConversions: {
      totalLifetimeCost: result.totals.lifetimeCost.toString(),
      totalLifetimeHours: result.totals.lifetimeHours.toString(),
      daysLost: result.totals.daysLost.toString(),
      yearsLost: result.totals.yearsLost.toString(),
    },
    percentageCalculations: rawPercentages,
    freedomAnalysis: {
      requiredNestEgg: requiredNestEgg.toString(),
      annualSavingsCapacity: annualSavingsCapacity.toString(),
      freedomDelayYears: result.freedomAnalysis.freedomDelayYears?.toString() ?? null,
    },
    validation: result.validation,
  };
}

// ============================================================================
// ARABIC GRAMMAR HELPERS (PART 12)
// ============================================================================

export function arabicPlural(count: number, singular: string, dual: string, plural3to10: string, plural11plus: string): string {
  if (count === 1) return `1 ${singular}`;
  if (count === 2) return dual;
  if (count >= 3 && count <= 10) return `${count} ${plural3to10}`;
  return `${count} ${plural11plus}`;
}

export function arabicLanguageCount(count: number): string {
  if (count === 1) return 'لغة واحدة جديدة';
  if (count === 2) return 'لغتان جديدتان';
  if (count >= 3 && count <= 10) return `${count} لغات جديدة`;
  return `${count} لغة جديدة`;
}
