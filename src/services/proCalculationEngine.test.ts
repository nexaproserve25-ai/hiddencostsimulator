import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  proCalculate,
  validateProInput,
  calculateProjectionYears,
  proDefaultConfig,
  ProCalculationError,
  type ProCalculationInput,
  type ProHabitInput,
  type UserFinancialProfile,
} from './proCalculationEngine';

// ============================================================================
// HELPERS
// ============================================================================

function makeProfile(
  income = '5000',
  workHours = '40',
  age?: string,
  baseline?: string,
): UserFinancialProfile {
  return {
    id: 'test-profile',
    monthlyIncome: new Decimal(income),
    weeklyWorkHours: new Decimal(workHours),
    currency: 'USD',
    ...(age !== undefined ? { age: new Decimal(age) } : {}),
    ...(baseline !== undefined ? { baselineMonthlyExpenses: new Decimal(baseline) } : {}),
  };
}

function makeHabit(
  name: string,
  cost: string,
  costFreq: 'daily' | 'weekly' | 'monthly' | 'yearly',
  time: string,
  timeFreq: 'daily' | 'weekly' | 'monthly' | 'yearly',
  importance: 1 | 2 | 3 | 4 | 5 = 3,
  category: 'food' | 'beverage' | 'shopping' | 'entertainment' | 'subscription' | 'transport' | 'other' = 'other',
): ProHabitInput {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    category,
    costAmount: new Decimal(cost),
    costFrequency: costFreq,
    timeAmount: new Decimal(time),
    timeFrequency: timeFreq,
    importance,
  };
}

function makeInput(habits: ProHabitInput[], profile?: UserFinancialProfile, projectionOverride?: string): ProCalculationInput {
  return {
    profile: profile ?? makeProfile(),
    habits,
    ...(projectionOverride !== undefined ? { projectionYearsOverride: new Decimal(projectionOverride) } : {}),
  };
}

// ============================================================================
// PART 9 — HOURLY VALUE OF TIME
// ============================================================================

describe('Hourly Value of Time (Section 9)', () => {
  it('Computes hourly value from the spec example: 5000/mo, 40h/wk = 28.74/h', () => {
    const input = makeInput([makeHabit('Coffee', '10', 'daily', '0.5', 'daily')]);
    const result = proCalculate(input);
    // Annual income = 5000 × 12 = 60000
    expect(result.annualIncome.toString()).toBe('60000');
    // Annual work hours = 40 × 52.178571... = 2087.14...
    const expectedWorkHours = new Decimal('40').times(proDefaultConfig.WeeksPerYear);
    expect(result.annualWorkHours.equals(expectedWorkHours)).toBe(true);
    // Hourly = 60000 / 2087.14... = 28.74...
    const expectedHourly = new Decimal('60000').dividedBy(expectedWorkHours);
    expect(result.hourlyValue.equals(expectedHourly)).toBe(true);
    // Sanity: approximately 28.74
    expect(result.hourlyValue.toDecimalPlaces(2).toNumber()).toBeCloseTo(28.74, 1);
  });
});

// ============================================================================
// PART 8.2 — ANNUAL COST CONVERSION
// ============================================================================

describe('Annual Cost Conversion (Section 8.2)', () => {
  it('Daily: $10 × 365.25 = $3652.50/year', () => {
    const input = makeInput([makeHabit('Coffee', '10', 'daily', '0', 'daily')]);
    const result = proCalculate(input);
    expect(result.habits[0].annualCost.toString()).toBe('3652.5');
  });

  it('Weekly: amount × 52.178571...', () => {
    const input = makeInput([makeHabit('Gym', '20', 'weekly', '0', 'weekly')]);
    const result = proCalculate(input);
    const expected = new Decimal('20').times(proDefaultConfig.WeeksPerYear);
    expect(result.habits[0].annualCost.equals(expected)).toBe(true);
  });

  it('Monthly: amount × 12', () => {
    const input = makeInput([makeHabit('Netflix', '15', 'monthly', '0', 'monthly')]);
    const result = proCalculate(input);
    expect(result.habits[0].annualCost.toString()).toBe('180');
  });

  it('Yearly: amount unchanged', () => {
    const input = makeInput([makeHabit('Amazon', '139', 'yearly', '0', 'yearly')]);
    const result = proCalculate(input);
    expect(result.habits[0].annualCost.toString()).toBe('139');
  });
});

// ============================================================================
// PART 8.3 — ANNUAL TIME CONVERSION
// ============================================================================

describe('Annual Time Conversion (Section 8.3)', () => {
  it('30 min daily = 0.5h × 365.25 = 182.625 h/year', () => {
    const input = makeInput([makeHabit('Coffee', '0', 'daily', '0.5', 'daily')]);
    const result = proCalculate(input);
    expect(result.habits[0].annualHours.toString()).toBe('182.625');
  });
});

// ============================================================================
// PART 10 — SEPARATE COST CATEGORIES
// ============================================================================

describe('Separate Cost Categories (Section 10)', () => {
  it('Direct financial cost and time opportunity cost are never mixed', () => {
    const input = makeInput([makeHabit('Coffee', '10', 'daily', '0.5', 'daily')], makeProfile('5000', '40'));
    const result = proCalculate(input);
    const habit = result.habits[0];

    // Direct financial: 10 × 365.25 = 3652.50 annual, × 10 = 36525 projection
    expect(habit.directFinancialCost.toString()).toBe('36525');

    // Time opportunity: 182.625 h/yr × 28.74... × 10 years
    const hourlyValue = result.hourlyValue;
    const expectedTimeOpp = new Decimal('182.625').times(hourlyValue).times(10);
    expect(habit.timeOpportunityCost.equals(expectedTimeOpp)).toBe(true);

    // Combined = direct + time opportunity (never one merged bill)
    expect(habit.combinedCost.equals(habit.directFinancialCost.plus(habit.timeOpportunityCost))).toBe(true);

    // Totals also separate
    expect(result.totals.projectionDirectCost.toString()).toBe('36525');
    expect(result.totals.projectionTimeOpportunityCost.equals(expectedTimeOpp)).toBe(true);
  });
});

// ============================================================================
// PART 11 — PROJECTION HORIZONS
// ============================================================================

describe('Projection Horizons (Section 11)', () => {
  it('Default is 10 years when age not provided', () => {
    const input = makeInput([makeHabit('X', '5', 'daily', '1', 'daily')], makeProfile('5000', '40'));
    const result = proCalculate(input);
    expect(result.projectionYears.toString()).toBe('10');
  });

  it('Age 35 → 80-35=45 years projection', () => {
    const profile = makeProfile('5000', '40', '35');
    expect(calculateProjectionYears(profile, proDefaultConfig).toString()).toBe('45');
  });

  it('Age 20 → 60, clamped to max 50', () => {
    const profile = makeProfile('5000', '40', '20');
    expect(calculateProjectionYears(profile, proDefaultConfig).toString()).toBe('50');
  });

  it('Age 75 → 5, clamped to min 10', () => {
    const profile = makeProfile('5000', '40', '75');
    expect(calculateProjectionYears(profile, proDefaultConfig).toString()).toBe('10');
  });

  it('Explicit projectionYearsOverride takes precedence', () => {
    const input = makeInput([makeHabit('X', '5', 'daily', '1', 'daily')], makeProfile('5000', '40', '35'), '20');
    const result = proCalculate(input);
    expect(result.projectionYears.toString()).toBe('20');
  });
});

// ============================================================================
// INVESTMENT SIMULATION
// ============================================================================

describe('Investment Simulation', () => {
  it('Future value of redirected money with 7% return over 10 years', () => {
    const input = makeInput([makeHabit('Coffee', '10', 'daily', '0', 'daily')], makeProfile('5000', '40'));
    const result = proCalculate(input);
    // Annual direct cost = 3652.5
    // FV = 3652.5 × [((1.07)^10 - 1) / 0.07]
    const expected = new Decimal('3652.5').times(
      new Decimal(1.07).pow(10).minus(1).dividedBy(0.07)
    );
    expect(result.investmentProjection.futureValueIfInvested.equals(expected)).toBe(true);
    expect(result.investmentProjection.annualInvestmentAmount.toString()).toBe('3652.5');
    expect(result.investmentProjection.returnRate.toString()).toBe('0.07');
  });

  it('Zero return rate falls back to simple multiplication', () => {
    const input = makeInput([makeHabit('Coffee', '10', 'daily', '0', 'daily')], makeProfile('5000', '40'));
    const result = proCalculate(input, { ...proDefaultConfig, DefaultInvestmentReturnRate: new Decimal(0) });
    // With override already set, we need to pass returnRate explicitly
    // Actually we passed it via config default — but the engine uses input.investmentReturnRate ?? config.Default
    // So set it via input
    const input2 = { ...input, investmentReturnRate: new Decimal(0) };
    const result2 = proCalculate(input2);
    // FV = 3652.5 × 10 = 36525
    expect(result2.investmentProjection.futureValueIfInvested.toString()).toBe('36525');
  });
});

// ============================================================================
// PART 12 — VALIDATION
// ============================================================================

describe('Validation (Section 12)', () => {
  it('Empty habits array fails', () => {
    const result = validateProInput(makeInput([]));
    expect(result.passed).toBe(false);
  });

  it('Negative cost fails', () => {
    const result = validateProInput(makeInput([makeHabit('Bad', '-5', 'daily', '1', 'daily')]));
    expect(result.passed).toBe(false);
  });

  it('Negative time fails', () => {
    const result = validateProInput(makeInput([makeHabit('Bad', '5', 'daily', '-1', 'daily')]));
    expect(result.passed).toBe(false);
  });

  it('Empty name fails', () => {
    const result = validateProInput(makeInput([makeHabit('  ', '5', 'daily', '1', 'daily')]));
    expect(result.passed).toBe(false);
  });

  it('Invalid frequency fails', () => {
    const bad = { ...makeHabit('X', '5', 'daily', '1', 'daily'), costFrequency: 'hourly' as 'daily' };
    const result = validateProInput(makeInput([bad]));
    expect(result.passed).toBe(false);
  });

  it('Invalid importance fails', () => {
    const bad = { ...makeHabit('X', '5', 'daily', '1', 'daily'), importance: 6 as 5 };
    const result = validateProInput(makeInput([bad]));
    expect(result.passed).toBe(false);
  });

  it('Zero work hours fails', () => {
    const result = validateProInput(makeInput([makeHabit('X', '5', 'daily', '1', 'daily')], makeProfile('5000', '0')));
    expect(result.passed).toBe(false);
  });

  it('Valid input passes', () => {
    const result = validateProInput(makeInput([
      makeHabit('Coffee', '10', 'daily', '0.5', 'daily', 5, 'beverage'),
    ], makeProfile('5000', '40', '35')));
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('proCalculate throws ProCalculationError on invalid input', () => {
    expect(() => proCalculate(makeInput([]))).toThrow(ProCalculationError);
    expect(() => proCalculate(makeInput([]))).toThrow(/At least one habit/);
  });
});

// ============================================================================
// SPEC EXAMPLE — SECTION 7
// ============================================================================

describe('Spec Example (Section 7)', () => {
  it('Coffee + Restaurants + Gaming with profile: 5000/mo, 40h/wk, age 35', () => {
    const profile = makeProfile('5000', '40', '35');
    const habits = [
      makeHabit('Coffee outside home', '10', 'daily', '0.5', 'daily', 5, 'beverage'),
      makeHabit('Restaurant meals', '300', 'monthly', '12', 'monthly', 3, 'food'),
      makeHabit('Gaming', '50', 'monthly', '20', 'monthly', 4, 'entertainment'),
    ];
    const result = proCalculate(makeInput(habits, profile));

    // Projection years = 45
    expect(result.projectionYears.toString()).toBe('45');

    // Coffee annual cost = 10 × 365.25 = 3652.5
    expect(result.habits[0].annualCost.toString()).toBe('3652.5');
    // Coffee annual hours = 0.5 × 365.25 = 182.625
    expect(result.habits[0].annualHours.toString()).toBe('182.625');

    // Restaurants annual cost = 300 × 12 = 3600
    expect(result.habits[1].annualCost.toString()).toBe('3600');
    // Restaurants annual hours = 12 × 12 = 144
    expect(result.habits[1].annualHours.toString()).toBe('144');

    // Gaming annual cost = 50 × 12 = 600
    expect(result.habits[2].annualCost.toString()).toBe('600');
    // Gaming annual hours = 20 × 12 = 240
    expect(result.habits[2].annualHours.toString()).toBe('240');

    // Totals: annual direct = 3652.5 + 3600 + 600 = 7852.5
    expect(result.totals.annualDirectCost.toString()).toBe('7852.5');

    // Totals: annual hours = 182.625 + 144 + 240 = 566.625
    expect(result.totals.annualHours.toString()).toBe('566.625');

    // Projection direct = 7852.5 × 45 = 353362.5
    expect(result.totals.projectionDirectCost.toString()).toBe('353362.5');

    // Each habit percentage sums to 100
    const pctSum = result.habits.reduce((s, h) => s.plus(h.percentageOfTotal), new Decimal(0));
    expect(pctSum.toDecimalPlaces(2).toNumber()).toBeCloseTo(100, 1);
  });
});

// ============================================================================
// PRECISION & DETERMINISM
// ============================================================================

describe('Precision & Determinism', () => {
  it('Decimal precision is preserved (no floating point errors)', () => {
    const input = makeInput([makeHabit('Snack', '3.50', 'daily', '0.25', 'daily')]);
    const result = proCalculate(input);
    // 3.50 × 365.25 = 1278.375
    expect(result.habits[0].annualCost.toString()).toBe('1278.375');
    // 0.25 × 365.25 = 91.3125
    expect(result.habits[0].annualHours.toString()).toBe('91.3125');
  });

  it('Identical inputs produce identical outputs (5 runs)', () => {
    const input = makeInput([
      makeHabit('A', '10.5', 'daily', '2', 'daily'),
      makeHabit('B', '25', 'weekly', '5', 'weekly'),
    ]);
    const results: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = proCalculate(input);
      results.push(JSON.stringify({
        direct: r.totals.projectionDirectCost.toString(),
        opp: r.totals.projectionTimeOpportunityCost.toString(),
        hours: r.totals.projectionHours.toString(),
        fv: r.investmentProjection.futureValueIfInvested.toString(),
      }));
    }
    expect(new Set(results).size).toBe(1);
  });

  it('Extreme values do not lose precision', () => {
    const input = makeInput(
      [makeHabit('Yacht', '1000000', 'monthly', '100', 'daily')],
      makeProfile('100000000', '1'),
      '30',
    );
    const result = proCalculate(input);
    // 1M × 12 × 30 = 360M
    expect(result.totals.projectionDirectCost.toString()).toBe('360000000');
  });
});

// ============================================================================
// HABIT SUM INTEGRITY
// ============================================================================

describe('Habit Sum Integrity', () => {
  it('Sum of habit projection costs equals total projection direct cost', () => {
    const input = makeInput([
      makeHabit('A', '10', 'daily', '1', 'daily'),
      makeHabit('B', '50', 'weekly', '5', 'weekly'),
      makeHabit('C', '200', 'monthly', '10', 'monthly'),
    ]);
    const result = proCalculate(input);
    const sum = result.habits.reduce((s, h) => s.plus(h.projectionCost), new Decimal(0));
    expect(sum.equals(result.totals.projectionDirectCost)).toBe(true);
  });

  it('Sum of habit projection hours equals total projection hours', () => {
    const input = makeInput([
      makeHabit('A', '10', 'daily', '1', 'daily'),
      makeHabit('B', '50', 'weekly', '5', 'weekly'),
    ]);
    const result = proCalculate(input);
    const sum = result.habits.reduce((s, h) => s.plus(h.projectionHours), new Decimal(0));
    expect(sum.equals(result.totals.projectionHours)).toBe(true);
  });

  it('Sum of habit combined costs equals total combined cost', () => {
    const input = makeInput([
      makeHabit('A', '10', 'daily', '1', 'daily'),
      makeHabit('B', '50', 'weekly', '5', 'weekly'),
    ]);
    const result = proCalculate(input);
    const sum = result.habits.reduce((s, h) => s.plus(h.combinedCost), new Decimal(0));
    expect(sum.equals(result.totals.projectionCombinedCost)).toBe(true);
  });
});

// ============================================================================
// TIME CONVERSION CHAIN
// ============================================================================

describe('Time Conversion Chain', () => {
  it('Hours ÷ 365.25 = days, days ÷ 365.25 = years (using DaysPerYear)', () => {
    const input = makeInput([makeHabit('X', '0', 'daily', '2', 'daily')], makeProfile('5000', '40'), '10');
    const result = proCalculate(input);
    // projection hours = 2 × 365.25 × 10 = 7305
    expect(result.totals.projectionHours.toString()).toBe('7305');
    // days = 7305 / 365.25 = 20
    expect(result.totals.daysLost.toString()).toBe('20');
    // years = 20 / 365.25
    const expectedYears = new Decimal('20').dividedBy('365.25');
    expect(result.totals.yearsLost.equals(expectedYears)).toBe(true);
  });
});

// ============================================================================
// RANDOMIZED CONSISTENCY
// ============================================================================

describe('Randomized Consistency', () => {
  it('50 random trials: habit sums always equal totals', () => {
    for (let trial = 0; trial < 50; trial++) {
      const numHabits = 1 + Math.floor(Math.random() * 10);
      const habits: ProHabitInput[] = [];
      const freqs: Array<'daily' | 'weekly' | 'monthly' | 'yearly'> = ['daily', 'weekly', 'monthly', 'yearly'];
      for (let i = 0; i < numHabits; i++) {
        habits.push(makeHabit(
          `H${i}`,
          (Math.random() * 100).toFixed(2),
          freqs[Math.floor(Math.random() * 4)],
          (Math.random() * 5).toFixed(2),
          freqs[Math.floor(Math.random() * 4)],
          (1 + Math.floor(Math.random() * 5)) as 1 | 2 | 3 | 4 | 5,
        ));
      }
      const salary = String(1000 + Math.floor(Math.random() * 9000));
      const hours = String(10 + Math.floor(Math.random() * 40));
      const input = makeInput(habits, makeProfile(salary, hours));

      const result = proCalculate(input);

      const costSum = result.habits.reduce((s, h) => s.plus(h.projectionCost), new Decimal(0));
      expect(costSum.equals(result.totals.projectionDirectCost)).toBe(true);

      const hourSum = result.habits.reduce((s, h) => s.plus(h.projectionHours), new Decimal(0));
      expect(hourSum.equals(result.totals.projectionHours)).toBe(true);

      const combinedSum = result.habits.reduce((s, h) => s.plus(h.combinedCost), new Decimal(0));
      expect(combinedSum.equals(result.totals.projectionCombinedCost)).toBe(true);
    }
  });
});
