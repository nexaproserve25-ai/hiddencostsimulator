import Decimal from 'decimal.js';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// CONFIGURATION CONSTANTS (PART 8.1)
// ============================================================================

export interface ProCalculationConfig {
  DaysPerYear: Decimal;
  WeeksPerYear: Decimal;
  MonthsPerYear: Decimal;
  DefaultProjectionYears: Decimal;
  MaxProjectionYears: Decimal;
  MinProjectionYears: Decimal;
  AssumedLifespanAge: Decimal;
  DefaultInvestmentReturnRate: Decimal;
}

export const proDefaultConfig: ProCalculationConfig = {
  DaysPerYear: new Decimal('365.25'),
  WeeksPerYear: new Decimal('365.25').dividedBy(7),
  MonthsPerYear: new Decimal('12'),
  DefaultProjectionYears: new Decimal('10'),
  MaxProjectionYears: new Decimal('50'),
  MinProjectionYears: new Decimal('10'),
  AssumedLifespanAge: new Decimal('80'),
  DefaultInvestmentReturnRate: new Decimal('0.07'),
};

// ============================================================================
// ERROR SYSTEM (PART 12)
// ============================================================================

export type ProCalculationErrorCode =
  | 'INVALID_INPUT'
  | 'NEGATIVE_AMOUNT'
  | 'NEGATIVE_TIME'
  | 'EMPTY_NAME'
  | 'INVALID_FREQUENCY'
  | 'INVALID_CATEGORY'
  | 'INVALID_IMPORTANCE'
  | 'MISSING_REQUIRED_DATA'
  | 'INVALID_DECIMAL'
  | 'NAN_OR_INFINITY';

export class ProCalculationError extends Error {
  code: ProCalculationErrorCode;
  constructor(code: ProCalculationErrorCode, message: string) {
    super(message);
    this.name = 'ProCalculationError';
    this.code = code;
  }
}

// ============================================================================
// INPUT DATA MODELS (PART 5 & 6)
// ============================================================================

export type ProFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type HabitCategory =
  | 'food'
  | 'beverage'
  | 'shopping'
  | 'entertainment'
  | 'subscription'
  | 'transport'
  | 'other';

export interface UserFinancialProfile {
  id: string;
  age?: Decimal;
  monthlyIncome: Decimal;
  weeklyWorkHours: Decimal;
  currency: string;
  currentSavingsRate?: Decimal;
  baselineMonthlyExpenses?: Decimal;
}

export interface ProHabitInput {
  id: string;
  name: string;
  category: HabitCategory;
  costAmount: Decimal;
  costFrequency: ProFrequency;
  timeAmount: Decimal;
  timeFrequency: ProFrequency;
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface ProCalculationInput {
  profile: UserFinancialProfile;
  habits: ProHabitInput[];
  projectionYearsOverride?: Decimal;
  investmentReturnRate?: Decimal;
}

// ============================================================================
// OUTPUT DATA MODELS
// ============================================================================

export interface HabitAnnualNormalized {
  id: string;
  name: string;
  category: HabitCategory;
  annualCost: Decimal;
  annualHours: Decimal;
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface HabitProjection {
  id: string;
  name: string;
  category: HabitCategory;
  importance: 1 | 2 | 3 | 4 | 5;
  annualCost: Decimal;
  annualHours: Decimal;
  projectionCost: Decimal;
  projectionHours: Decimal;
  directFinancialCost: Decimal;
  timeOpportunityCost: Decimal;
  combinedCost: Decimal;
  percentageOfTotal: Decimal;
}

export interface InvestmentProjection {
  returnRate: Decimal;
  futureValueIfInvested: Decimal;
  annualInvestmentAmount: Decimal;
}

export interface ProTotalsResult {
  annualDirectCost: Decimal;
  annualTimeOpportunityCost: Decimal;
  annualCombinedCost: Decimal;
  projectionDirectCost: Decimal;
  projectionTimeOpportunityCost: Decimal;
  projectionCombinedCost: Decimal;
  annualHours: Decimal;
  projectionHours: Decimal;
  daysLost: Decimal;
  yearsLost: Decimal;
}

export interface ProValidationResult {
  passed: boolean;
  errors: string[];
}

export interface ProCalculationResult {
  profile: UserFinancialProfile;
  hourlyValue: Decimal;
  annualIncome: Decimal;
  annualWorkHours: Decimal;
  projectionYears: Decimal;
  habits: HabitProjection[];
  totals: ProTotalsResult;
  investmentProjection: InvestmentProjection;
  validation: ProValidationResult;
}

// ============================================================================
// FREQUENCY CONVERSION ENGINE (PART 8.2 & 8.3)
// ============================================================================

function convertToAnnual(value: Decimal, frequency: ProFrequency, config: ProCalculationConfig): Decimal {
  switch (frequency) {
    case 'daily': return value.times(config.DaysPerYear);
    case 'weekly': return value.times(config.WeeksPerYear);
    case 'monthly': return value.times(config.MonthsPerYear);
    case 'yearly': return value;
    default: throw new ProCalculationError('INVALID_FREQUENCY', `Unknown frequency: ${frequency}`);
  }
}

// ============================================================================
// PROJECTION HORIZON (PART 11)
// ============================================================================

export function calculateProjectionYears(profile: UserFinancialProfile, config: ProCalculationConfig = proDefaultConfig): Decimal {
  if (profile.age !== undefined && profile.age.gt(0)) {
    const remaining = config.AssumedLifespanAge.minus(profile.age);
    const clamped = Decimal.min(Decimal.max(remaining, config.MinProjectionYears), config.MaxProjectionYears);
    return clamped;
  }
  return config.DefaultProjectionYears;
}

// ============================================================================
// HOURLY VALUE OF TIME (PART 9)
// ============================================================================

function calculateHourlyValue(profile: UserFinancialProfile, config: ProCalculationConfig): { hourlyValue: Decimal; annualIncome: Decimal; annualWorkHours: Decimal } {
  const annualIncome = profile.monthlyIncome.times(config.MonthsPerYear);
  const annualWorkHours = profile.weeklyWorkHours.times(config.WeeksPerYear);
  if (annualWorkHours.lte(0)) {
    throw new ProCalculationError('MISSING_REQUIRED_DATA', 'Annual working hours must be greater than zero.');
  }
  const hourlyValue = annualIncome.dividedBy(annualWorkHours);
  return { hourlyValue, annualIncome, annualWorkHours };
}

// ============================================================================
// INVESTMENT SIMULATION (PART — Future Value of Redirected Money)
// ============================================================================

function calculateInvestmentProjection(
  annualDirectCost: Decimal,
  returnRate: Decimal,
  projectionYears: Decimal,
): InvestmentProjection {
  // Future Value of an annuity: FV = PMT × [((1 + r)^n - 1) / r]
  const annualInvestmentAmount = annualDirectCost;
  if (returnRate.isZero()) {
    return { returnRate, futureValueIfInvested: annualInvestmentAmount.times(projectionYears), annualInvestmentAmount };
  }
  const onePlusR = new Decimal(1).plus(returnRate);
  const powered = onePlusR.pow(projectionYears.toNumber());
  const factor = powered.minus(1).dividedBy(returnRate);
  const futureValue = annualInvestmentAmount.times(factor);
  return { returnRate, futureValueIfInvested: futureValue, annualInvestmentAmount };
}

// ============================================================================
// VALIDATION SYSTEM (PART 12)
// ============================================================================

const VALID_FREQUENCIES: ProFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];
const VALID_CATEGORIES: HabitCategory[] = ['food', 'beverage', 'shopping', 'entertainment', 'subscription', 'transport', 'other'];

export function validateProInput(input: ProCalculationInput, config: ProCalculationConfig = proDefaultConfig): ProValidationResult {
  const errors: string[] = [];

  if (!input.profile) {
    errors.push('Financial profile is required.');
    return { passed: false, errors };
  }

  const { profile } = input;

  if (!profile.monthlyIncome || !profile.monthlyIncome.isFinite() || profile.monthlyIncome.lt(0)) {
    errors.push('Monthly income must be a non-negative finite number.');
  }
  if (!profile.weeklyWorkHours || !profile.weeklyWorkHours.isFinite() || profile.weeklyWorkHours.lte(0)) {
    errors.push('Weekly work hours must be a positive finite number.');
  }
  if (profile.age !== undefined && (!profile.age.isFinite() || profile.age.lt(0))) {
    errors.push('Age must be a non-negative finite number if provided.');
  }
  if (profile.currentSavingsRate !== undefined && (!profile.currentSavingsRate.isFinite() || profile.currentSavingsRate.lt(0))) {
    errors.push('Savings rate must be non-negative if provided.');
  }
  if (profile.baselineMonthlyExpenses !== undefined && (!profile.baselineMonthlyExpenses.isFinite() || profile.baselineMonthlyExpenses.lt(0))) {
    errors.push('Baseline expenses must be non-negative if provided.');
  }

  if (input.habits.length === 0) {
    errors.push('At least one habit is required.');
  }

  for (const habit of input.habits) {
    if (!habit.name || habit.name.trim().length === 0) {
      errors.push(`Habit id="${habit.id}" has an empty name.`);
    }
    if (!habit.costAmount.isFinite() || habit.costAmount.isNaN()) {
      errors.push(`Habit "${habit.name}" has an invalid cost amount (NaN or Infinity).`);
    }
    if (habit.costAmount.lt(0)) {
      errors.push(`Habit "${habit.name}" has a negative cost amount.`);
    }
    if (!habit.timeAmount.isFinite() || habit.timeAmount.isNaN()) {
      errors.push(`Habit "${habit.name}" has an invalid time amount (NaN or Infinity).`);
    }
    if (habit.timeAmount.lt(0)) {
      errors.push(`Habit "${habit.name}" has a negative time amount.`);
    }
    if (!VALID_FREQUENCIES.includes(habit.costFrequency)) {
      errors.push(`Habit "${habit.name}" has invalid cost frequency: ${habit.costFrequency}.`);
    }
    if (!VALID_FREQUENCIES.includes(habit.timeFrequency)) {
      errors.push(`Habit "${habit.name}" has invalid time frequency: ${habit.timeFrequency}.`);
    }
    if (!VALID_CATEGORIES.includes(habit.category)) {
      errors.push(`Habit "${habit.name}" has invalid category: ${habit.category}.`);
    }
    if (![1, 2, 3, 4, 5].includes(habit.importance)) {
      errors.push(`Habit "${habit.name}" has invalid importance: ${habit.importance}. Must be 1-5.`);
    }
  }

  return { passed: errors.length === 0, errors };
}

// ============================================================================
// PUBLIC ENGINE API: proCalculate()
// ============================================================================

export function proCalculate(input: ProCalculationInput, config: ProCalculationConfig = proDefaultConfig): ProCalculationResult {
  const preValidation = validateProInput(input, config);
  if (!preValidation.passed) {
    throw new ProCalculationError('INVALID_INPUT', preValidation.errors.join(' '));
  }

  const { profile } = input;
  const { hourlyValue, annualIncome, annualWorkHours } = calculateHourlyValue(profile, config);

  const projectionYears = input.projectionYearsOverride
    ? input.projectionYearsOverride
    : calculateProjectionYears(profile, config);

  const returnRate = input.investmentReturnRate ?? config.DefaultInvestmentReturnRate;

  // PART 8 — Normalize each habit to annual values
  const normalizedHabits: HabitAnnualNormalized[] = input.habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    category: habit.category,
    annualCost: convertToAnnual(habit.costAmount, habit.costFrequency, config),
    annualHours: convertToAnnual(habit.timeAmount, habit.timeFrequency, config),
    importance: habit.importance,
  }));

  // PART 10 — Separate cost categories (NEVER mixed)
  // A) Direct Financial Cost = money actually spent
  // B) Time Opportunity Cost = hours lost × hourly value
  const habitProjections: HabitProjection[] = normalizedHabits.map((nh) => {
    const projectionCost = nh.annualCost.times(projectionYears);
    const projectionHours = nh.annualHours.times(projectionYears);
    const directFinancialCost = projectionCost;
    const timeOpportunityCost = projectionHours.times(hourlyValue);
    const combinedCost = directFinancialCost.plus(timeOpportunityCost);

    return {
      id: nh.id,
      name: nh.name,
      category: nh.category,
      importance: nh.importance,
      annualCost: nh.annualCost,
      annualHours: nh.annualHours,
      projectionCost,
      projectionHours,
      directFinancialCost,
      timeOpportunityCost,
      combinedCost,
      percentageOfTotal: new Decimal(0), // filled after totals
    };
  });

  // Compute totals as the sum of habit parts — avoids precision-30 rounding
  // divergence between sum(aᵢ×c) and (Σaᵢ)×c.
  const totalAnnualDirectCost = habitProjections.reduce((s, h) => s.plus(h.annualCost), new Decimal(0));
  const totalAnnualHours = habitProjections.reduce((s, h) => s.plus(h.annualHours), new Decimal(0));
  const totalAnnualTimeOpportunityCost = habitProjections.reduce((s, h) => s.plus(h.annualHours.times(hourlyValue)), new Decimal(0));
  const totalAnnualCombinedCost = totalAnnualDirectCost.plus(totalAnnualTimeOpportunityCost);
  const totalProjectionDirectCost = habitProjections.reduce((s, h) => s.plus(h.projectionCost), new Decimal(0));
  const totalProjectionHours = habitProjections.reduce((s, h) => s.plus(h.projectionHours), new Decimal(0));
  const totalProjectionTimeOpportunityCost = habitProjections.reduce((s, h) => s.plus(h.timeOpportunityCost), new Decimal(0));
  const totalProjectionCombinedCost = habitProjections.reduce((s, h) => s.plus(h.combinedCost), new Decimal(0));

  if (totalProjectionCombinedCost.gt(0)) {
    for (const hp of habitProjections) {
      hp.percentageOfTotal = hp.combinedCost.dividedBy(totalProjectionCombinedCost).times(100);
    }
  }

  const daysLost = totalProjectionHours.dividedBy(config.DaysPerYear);
  const yearsLost = daysLost.dividedBy(config.DaysPerYear);

  const investmentProjection = calculateInvestmentProjection(totalAnnualDirectCost, returnRate, projectionYears);

  const result: ProCalculationResult = {
    profile,
    hourlyValue,
    annualIncome,
    annualWorkHours,
    projectionYears,
    habits: habitProjections,
    totals: {
      annualDirectCost: totalAnnualDirectCost,
      annualTimeOpportunityCost: totalAnnualTimeOpportunityCost,
      annualCombinedCost: totalAnnualCombinedCost,
      projectionDirectCost: totalProjectionDirectCost,
      projectionTimeOpportunityCost: totalProjectionTimeOpportunityCost,
      projectionCombinedCost: totalProjectionCombinedCost,
      annualHours: totalAnnualHours,
      projectionHours: totalProjectionHours,
      daysLost,
      yearsLost,
    },
    investmentProjection,
    validation: { passed: true, errors: [] },
  };

  return result;
}
