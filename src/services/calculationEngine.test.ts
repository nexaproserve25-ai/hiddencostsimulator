import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { calculate, validate, getAuditReport, defaultConfig, type CalculationInput, type HabitInput } from './calculationEngine';

function makeHabit(name: string, amount: string, amountFreq: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly', lostTime: string, lostTimeFreq: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'): HabitInput {
  return { name, amount: new Decimal(amount), amountFrequency: amountFreq, lostTime: new Decimal(lostTime), lostTimeFrequency: lostTimeFreq };
}

function makeInput(habits: HabitInput[], salary = '3000', baseline = '1500', hours = '40', lifetime = '10'): CalculationInput {
  return {
    habits,
    lifetimeYears: new Decimal(lifetime),
    incomeData: { monthlySalary: new Decimal(salary), monthlyBaselineExpenses: new Decimal(baseline), workingHoursPerWeek: new Decimal(hours) },
  };
}

describe('Basic Frequency Tests', () => {
  it('Daily habit: annual cost = amount × 365.25', () => {
    const input = makeInput([makeHabit('Coffee', '5', 'Daily', '0.5', 'Daily')]);
    const result = calculate(input);
    expect(result.validation.passed).toBe(true);
    // Annual = 5 × 365.25 = 1826.25; Lifetime = 1826.25 × 10 = 18262.5
    expect(result.totals.annualCost.toString()).toBe('1826.25');
    expect(result.totals.lifetimeCost.toString()).toBe('18262.5');
    // Annual hours = 0.5 × 365.25 = 182.625; Lifetime = 1826.25
    expect(result.totals.annualHours.toString()).toBe('182.625');
    expect(result.totals.lifetimeHours.toString()).toBe('1826.25');
  });

  it('Weekly habit: annual cost = amount × (365.25/7)', () => {
    const input = makeInput([makeHabit('Gym', '20', 'Weekly', '1', 'Weekly')]);
    const result = calculate(input);
    expect(result.validation.passed).toBe(true);
    const expectedAnnual = new Decimal('20').times(defaultConfig.WeeksPerYear);
    expect(result.totals.annualCost.equals(expectedAnnual)).toBe(true);
  });

  it('Monthly habit: annual cost = amount × 12', () => {
    const input = makeInput([makeHabit('Netflix', '15', 'Monthly', '0', 'Monthly')]);
    const result = calculate(input);
    expect(result.validation.passed).toBe(true);
    expect(result.totals.annualCost.toString()).toBe('180');
    expect(result.totals.lifetimeCost.toString()).toBe('1800');
  });

  it('Yearly habit: annual cost = amount', () => {
    const input = makeInput([makeHabit('Amazon Prime', '139', 'Yearly', '0', 'Yearly')]);
    const result = calculate(input);
    expect(result.validation.passed).toBe(true);
    expect(result.totals.annualCost.toString()).toBe('139');
    expect(result.totals.lifetimeCost.toString()).toBe('1390');
  });
});

describe('Complex Tests', () => {
  it('Mixed frequencies combine correctly', () => {
    const input = makeInput([
      makeHabit('Coffee', '5', 'Daily', '0.5', 'Daily'),
      makeHabit('Gym', '20', 'Weekly', '0', 'Weekly'),
      makeHabit('Netflix', '15', 'Monthly', '2', 'Monthly'),
      makeHabit('Amazon', '139', 'Yearly', '0', 'Yearly'),
    ]);
    const result = calculate(input);
    expect(result.validation.passed).toBe(true);
    expect(result.habits).toHaveLength(4);
    // Sum of habit lifetime costs = total lifetime cost
    const sumLC = result.habits.reduce((s, h) => s.plus(h.lifetimeCost), new Decimal(0));
    expect(sumLC.equals(result.totals.lifetimeCost)).toBe(true);
  });

  it('Zero values handled correctly', () => {
    const input = makeInput([makeHabit('Free', '0', 'Daily', '0', 'Daily')]);
    const result = calculate(input);
    expect(result.validation.passed).toBe(true);
    expect(result.totals.lifetimeCost.toString()).toBe('0');
    expect(result.totals.lifetimeHours.toString()).toBe('0');
    expect(result.habits[0].percentage).toBe(0);
  });

  it('Extreme values do not lose precision', () => {
    const input = makeInput([makeHabit('Yacht', '1000000', 'Monthly', '100', 'Daily')], '100000000', '0', '1', '30');
    const result = calculate(input);
    expect(result.validation.passed).toBe(true);
    // 1M monthly × 12 × 30 = 360M
    expect(result.totals.lifetimeCost.toString()).toBe('360000000');
  });

  it('Decimal values preserve precision', () => {
    const input = makeInput([makeHabit('Snack', '3.50', 'Daily', '0.25', 'Daily')]);
    const result = calculate(input);
    expect(result.validation.passed).toBe(true);
    // 3.50 × 365.25 = 1278.375; × 10 = 12783.75
    expect(result.totals.lifetimeCost.toString()).toBe('12783.75');
    // 0.25 × 365.25 = 91.3125; × 10 = 913.125
    expect(result.totals.lifetimeHours.toString()).toBe('913.125');
  });

  it('100+ habits produce correct results', () => {
    const habits: HabitInput[] = [];
    for (let i = 0; i < 120; i++) {
      habits.push(makeHabit(`Habit${i}`, '1', 'Daily', '0.1', 'Daily'));
    }
    const input = makeInput(habits);
    const result = calculate(input);
    expect(result.validation.passed).toBe(true);
    expect(result.habits).toHaveLength(120);
    // Each: 1 × 365.25 × 10 = 3652.5; total = 3652.5 × 120 = 438300
    expect(result.totals.lifetimeCost.toString()).toBe('438300');
    // Percentage sum must equal 100
    const pctSum = result.habits.reduce((s, h) => s + h.percentage, 0);
    expect(Math.abs(pctSum - 100)).toBeLessThanOrEqual(0.01);
  });
});

describe('Accuracy Tests', () => {
  it('Financial totals: habit costs sum to total', () => {
    const input = makeInput([
      makeHabit('A', '10', 'Daily', '1', 'Daily'),
      makeHabit('B', '50', 'Weekly', '5', 'Weekly'),
      makeHabit('C', '200', 'Monthly', '10', 'Monthly'),
    ]);
    const result = calculate(input);
    const sum = result.habits.reduce((s, h) => s.plus(h.lifetimeCost), new Decimal(0));
    expect(sum.equals(result.totals.lifetimeCost)).toBe(true);
  });

  it('Time totals: habit hours sum to total', () => {
    const input = makeInput([
      makeHabit('A', '10', 'Daily', '1', 'Daily'),
      makeHabit('B', '50', 'Weekly', '5', 'Weekly'),
    ]);
    const result = calculate(input);
    const sum = result.habits.reduce((s, h) => s.plus(h.lifetimeHours), new Decimal(0));
    expect(sum.equals(result.totals.lifetimeHours)).toBe(true);
  });

  it('Percentage totals always equal 100%', () => {
    const input = makeInput([
      makeHabit('A', '10', 'Daily', '1', 'Daily'),
      makeHabit('B', '50', 'Weekly', '5', 'Weekly'),
      makeHabit('C', '200', 'Monthly', '10', 'Monthly'),
    ]);
    const result = calculate(input);
    const pctSum = result.habits.reduce((s, h) => s + h.percentage, 0);
    expect(Math.abs(pctSum - 100)).toBeLessThanOrEqual(0.01);
  });

  it('Time conversion chain: Hours ÷ 24 = Days, Days ÷ 365.25 = Years', () => {
    const input = makeInput([makeHabit('Coffee', '5', 'Daily', '2', 'Daily')]);
    const result = calculate(input);
    // lifetimeHours = 2 × 365.25 × 10 = 7305
    expect(result.totals.lifetimeHours.toString()).toBe('7305');
    // days = 7305 / 24 = 304.375
    expect(result.totals.daysLost.toString()).toBe('304.375');
    // years = 304.375 / 365.25
    const expectedYears = new Decimal('304.375').dividedBy('365.25');
    expect(result.totals.yearsLost.equals(expectedYears)).toBe(true);
  });
});

describe('Financial Independence', () => {
  it('Returns CALCULATED when savings capacity is positive', () => {
    const input = makeInput([makeHabit('Coffee', '5', 'Daily', '0', 'Daily')], '5000', '1000', '40');
    const result = calculate(input);
    expect(result.freedomAnalysis.freedomDelayStatus).toBe('CALCULATED');
    expect(result.freedomAnalysis.freedomDelayYears).not.toBeNull();
  });

  it('Returns INSUFFICIENT_DATA when savings capacity <= 0', () => {
    const input = makeInput([makeHabit('Coffee', '5', 'Daily', '0', 'Daily')], '1000', '1500', '40');
    const result = calculate(input);
    expect(result.freedomAnalysis.freedomDelayStatus).toBe('INSUFFICIENT_DATA');
    expect(result.freedomAnalysis.freedomDelayYears).toBeNull();
  });

  it('Freedom delay formula: (annualHabitCost × 25) / (annualSalary - annualBaseline)', () => {
    const input = makeInput([makeHabit('Coffee', '5', 'Daily', '0', 'Daily')], '5000', '1000', '40');
    const result = calculate(input);
    // annualHabitCost = 5 × 365.25 = 1826.25
    // requiredNestEgg = 1826.25 × 25 = 45656.25
    // annualSavings = 5000×12 - 1000×12 = 48000
    // delay = 45656.25 / 48000 = 0.951171875
    expect(result.freedomAnalysis.freedomDelayYears!.toString()).toBe('0.951171875');
  });
});

describe('Validation Tests', () => {
  it('Empty habits array fails validation', () => {
    const input = makeInput([]);
    const result = validate(input);
    expect(result.passed).toBe(false);
  });

  it('Negative amount fails validation', () => {
    const input = makeInput([makeHabit('Bad', '-5', 'Daily', '1', 'Daily')]);
    const result = validate(input);
    expect(result.passed).toBe(false);
  });

  it('Zero working hours fails validation', () => {
    const input = makeInput([makeHabit('Coffee', '5', 'Daily', '0', 'Daily')], '3000', '1500', '0');
    const result = validate(input);
    expect(result.passed).toBe(false);
  });
});

describe('Audit Report', () => {
  it('Produces complete audit trail', () => {
    const input = makeInput([makeHabit('Coffee', '5', 'Daily', '0.5', 'Daily')]);
    const result = calculate(input);
    const audit = getAuditReport(input, result);
    expect(audit.habitAnnualConversions).toHaveLength(1);
    expect(audit.habitAnnualConversions[0].annualCost).toBe('1826.25');
    expect(audit.lifetimeConversions.totalLifetimeCost).toBe('18262.5');
    expect(audit.percentageCalculations).toHaveLength(1);
    expect(audit.validation.passed).toBe(true);
  });
});

describe('Golden Snapshot Test', () => {
  it('Fixed dataset always produces identical output', () => {
    const input = makeInput([
      makeHabit('Coffee', '4.50', 'Daily', '0.5', 'Daily'),
      makeHabit('Lunch Out', '15', 'Weekly', '1', 'Weekly'),
      makeHabit('Streaming', '12.99', 'Monthly', '3', 'Monthly'),
    ], '4500', '1800', '40', '10');

    const result = calculate(input);
    const snapshot = {
      lifetimeCost: result.totals.lifetimeCost.toString(),
      lifetimeHours: result.totals.lifetimeHours.toString(),
      daysLost: result.totals.daysLost.toString(),
      yearsLost: result.totals.yearsLost.toString(),
      freedomDelay: result.freedomAnalysis.freedomDelayYears?.toString(),
      percentages: result.habits.map((h) => h.percentage),
      validation: result.validation.passed,
    };

    // These exact values must never change
    expect(snapshot.lifetimeCost).toBe('25821.8357142857142857142857143');
    expect(snapshot.lifetimeHours).toBe('2708.03571428571428571428571429');
    expect(snapshot.daysLost).toBe('112.834821428571428571428571429');
    expect(snapshot.yearsLost).toBe('0.308924904664124376650044001175');
    expect(snapshot.validation).toBe(true);
    expect(snapshot.percentages.reduce((s, v) => s + v, 0)).toBe(100);
  });
});

describe('Determinism Test', () => {
  it('Identical inputs produce identical outputs (run 5 times)', () => {
    const input = makeInput([
      makeHabit('A', '10.5', 'Daily', '2', 'Daily'),
      makeHabit('B', '25', 'Weekly', '5', 'Weekly'),
    ]);
    const results: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = calculate(input);
      results.push(JSON.stringify({
        cost: r.totals.lifetimeCost.toString(),
        hours: r.totals.lifetimeHours.toString(),
        days: r.totals.daysLost.toString(),
        years: r.totals.yearsLost.toString(),
        pcts: r.habits.map((h) => h.percentage),
      }));
    }
    // All 5 runs must be identical
    expect(new Set(results).size).toBe(1);
  });
});

describe('Randomized Consistency Test', () => {
  it('Random inputs: habit sums always equal totals', () => {
    for (let trial = 0; trial < 50; trial++) {
      const numHabits = 1 + Math.floor(Math.random() * 10);
      const habits: HabitInput[] = [];
      const freqs: Array<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'> = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
      for (let i = 0; i < numHabits; i++) {
        const amount = (Math.random() * 100).toFixed(2);
        const time = (Math.random() * 5).toFixed(2);
        habits.push(makeHabit(`H${i}`, amount, freqs[Math.floor(Math.random() * 4)], time, freqs[Math.floor(Math.random() * 4)]));
      }
      const salary = String(1000 + Math.floor(Math.random() * 9000));
      const baseline = String(Math.floor(Math.random() * 2000));
      const input = makeInput(habits, salary, baseline, '40', String(5 + Math.floor(Math.random() * 25)));
      const result = calculate(input);

      // Financial sum
      const costSum = result.habits.reduce((s, h) => s.plus(h.lifetimeCost), new Decimal(0));
      expect(costSum.equals(result.totals.lifetimeCost)).toBe(true);

      // Hours sum
      const hourSum = result.habits.reduce((s, h) => s.plus(h.lifetimeHours), new Decimal(0));
      expect(hourSum.equals(result.totals.lifetimeHours)).toBe(true);

      // Percentage sum = 100
      if (result.habits.length > 0 && result.totals.lifetimeCost.gt(0)) {
        const pctSum = result.habits.reduce((s, h) => s + h.percentage, 0);
        expect(Math.abs(pctSum - 100)).toBeLessThanOrEqual(0.01);
      }
    }
  });
});

describe('Comparisons', () => {
  it('Comparisons are data-driven from total lifetime hours', () => {
    const input = makeInput([makeHabit('Coffee', '5', 'Daily', '2', 'Daily')]);
    const result = calculate(input);
    // lifetimeHours = 2 × 365.25 × 10 = 7305
    // languages (1000h) = floor(7305/1000) = 7
    expect(result.comparisons.find((c) => c.id === 'languages')!.achievableCount).toBe(7);
    // books (8h) = floor(7305/8) = 913
    expect(result.comparisons.find((c) => c.id === 'books')!.achievableCount).toBe(913);
  });
});
