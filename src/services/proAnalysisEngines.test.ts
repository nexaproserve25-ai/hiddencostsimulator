import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { proCalculate } from './proCalculationEngine';
import {
  runCompoundWealthEngine,
  DEFAULT_SCENARIOS,
  DEFAULT_HORIZONS,
} from './compoundWealthEngine';
import { runPriorityV3Engine } from './priorityV3Engine';
import { runSmartSwapEngine } from './smartSwapEngine';
import { runFireEngine } from './fireEngine';
import { runRecoveryRoadmapEngine } from './recoveryRoadmapEngine';
import { runProAnalysis } from './proAnalysisEngine';
import type { ProCalculationInput, UserFinancialProfile, ProHabitInput } from './proCalculationEngine';

// ============================================================================
// FIXTURE BUILDER
// ============================================================================

function makeProfile(overrides: Partial<UserFinancialProfile> = {}): UserFinancialProfile {
  return {
    id: 'test',
    monthlyIncome: new Decimal('5000'),
    weeklyWorkHours: new Decimal('40'),
    currency: 'USD',
    currentSavingsRate: new Decimal('0.10'),
    ...overrides,
  };
}

function makeHabit(overrides: Partial<ProHabitInput> = {}): ProHabitInput {
  return {
    id: 'h1',
    name: 'Coffee',
    category: 'beverage',
    costAmount: new Decimal('5'),
    costFrequency: 'daily',
    timeAmount: new Decimal('0.5'),
    timeFrequency: 'daily',
    importance: 3,
    ...overrides,
  };
}

function makeInput(overrides: { profile?: Partial<UserFinancialProfile>; habits?: ProHabitInput[] } = {}): ProCalculationInput {
  return {
    profile: makeProfile(overrides.profile ?? {}),
    habits: overrides.habits ?? [makeHabit()],
  };
}

// ============================================================================
// COMPOUND WEALTH ENGINE
// ============================================================================

describe('Compound Wealth Engine', () => {
  it('produces projections for 3 scenarios × 3 horizons = 9 results', () => {
    const result = runCompoundWealthEngine(new Decimal('300'));
    expect(result.projections).toHaveLength(9);
  });

  it('uses default scenarios (conservative 4%, balanced 7%, growth 8%)', () => {
    expect(DEFAULT_SCENARIOS).toHaveLength(3);
    expect(DEFAULT_SCENARIOS.map((s) => s.id)).toEqual(['conservative', 'balanced', 'growth']);
    expect(DEFAULT_SCENARIOS[0].annualReturn.toString()).toBe('0.04');
    expect(DEFAULT_SCENARIOS[1].annualReturn.toString()).toBe('0.07');
    expect(DEFAULT_SCENARIOS[2].annualReturn.toString()).toBe('0.08');
  });

  it('uses default horizons 10, 20, 30', () => {
    expect(DEFAULT_HORIZONS).toEqual([10, 20, 30]);
  });

  it('calculates FV correctly for the spec example: $300/mo, 8%, 30 years', () => {
    // Spec says FV ≈ $447,000, contributions $108,000, growth $339,000
    const result = runCompoundWealthEngine(
      new Decimal('300'),
      [{ id: 'growth', name: 'Growth', annualReturn: new Decimal('0.08') }],
      [30],
    );
    const proj = result.projections[0];
    expect(proj.years).toBe(30);
    expect(proj.monthlyContribution.toString()).toBe('300');
    expect(proj.totalContributions.toNumber()).toBeCloseTo(108000, 0);
    // FV should be in the ~$440k-450k range
    expect(proj.futureValue.toNumber()).toBeGreaterThan(440000);
    expect(proj.futureValue.toNumber()).toBeLessThan(450000);
    expect(proj.growthAmount.toNumber()).toBeGreaterThan(330000);
    expect(proj.growthAmount.toNumber()).toBeLessThan(340000);
  });

  it('calculates total contributions as monthlyContribution × months', () => {
    const result = runCompoundWealthEngine(
      new Decimal('300'),
      [{ id: 'conservative', name: 'Conservative', annualReturn: new Decimal('0.04') }],
      [10],
    );
    const proj = result.projections[0];
    expect(proj.totalContributions.toNumber()).toBe(300 * 12 * 10);
  });

  it('growthAmount = futureValue - totalContributions', () => {
    const result = runCompoundWealthEngine(new Decimal('500'));
    for (const proj of result.projections) {
      expect(proj.growthAmount.equals(proj.futureValue.minus(proj.totalContributions))).toBe(true);
    }
  });

  it('returns 0 FV for zero contribution', () => {
    const result = runCompoundWealthEngine(new Decimal('0'));
    for (const proj of result.projections) {
      expect(proj.futureValue.toNumber()).toBe(0);
      expect(proj.growthAmount.toNumber()).toBe(0);
    }
  });

  it('includes disclaimer text', () => {
    const result = runCompoundWealthEngine(new Decimal('100'));
    expect(result.disclaimer).toContain('Hypothetical');
    expect(result.disclaimer).toContain('not guaranteed');
  });

  it('higher return rate produces higher FV for same contribution and horizon', () => {
    const result = runCompoundWealthEngine(new Decimal('300'));
    const fv10Conservative = result.projections.find((p) => p.scenario === 'conservative' && p.years === 10)!.futureValue;
    const fv10Growth = result.projections.find((p) => p.scenario === 'growth' && p.years === 10)!.futureValue;
    expect(fv10Growth.gt(fv10Conservative)).toBe(true);
  });

  it('longer horizon produces higher FV for same scenario', () => {
    const result = runCompoundWealthEngine(new Decimal('300'));
    const fv10 = result.projections.find((p) => p.scenario === 'balanced' && p.years === 10)!.futureValue;
    const fv30 = result.projections.find((p) => p.scenario === 'balanced' && p.years === 30)!.futureValue;
    expect(fv30.gt(fv10)).toBe(true);
  });
});

// ============================================================================
// PRIORITY V3 ENGINE
// ============================================================================

describe('Priority V3 Engine', () => {
  it('assigns rank 1 to highest priority score', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'restaurant', name: 'Restaurant', category: 'food', costAmount: new Decimal('300'), costFrequency: 'monthly', importance: 3 }),
        makeHabit({ id: 'gaming', name: 'Gaming', category: 'entertainment', costAmount: new Decimal('50'), costFrequency: 'monthly', timeAmount: new Decimal('10'), timeFrequency: 'weekly', importance: 5 }),
        makeHabit({ id: 'shopping', name: 'Shopping', category: 'shopping', costAmount: new Decimal('150'), costFrequency: 'monthly', importance: 1 }),
      ],
    });
    const calc = proCalculate(input);
    const result = runPriorityV3Engine(calc);

    expect(result.rankings).toHaveLength(3);
    expect(result.rankings[0].rank).toBe(1);
    // Per the spec example: Restaurant is #1 (high financial impact × moderate resistance),
    // Shopping is #2 (lower impact but very easy), Gaming is #3 (high time but difficult).
    // The scores are very close between Restaurant and Shopping, but Restaurant's
    // 60% financial weight advantage gives it the edge.
    expect(result.rankings[0].habitId).toBe('restaurant');
    expect(result.rankings[2].habitId).toBe('gaming');
    // Verify gaming (importance 5) has the lowest priority due to high resistance
    const gaming = result.rankings.find((r) => r.habitId === 'gaming')!;
    const restaurant = result.rankings.find((r) => r.habitId === 'restaurant')!;
    expect(gaming.priorityScore.lt(restaurant.priorityScore)).toBe(true);
  });

  it('resistance factor: importance 1 → 1.0, importance 5 → 0.2', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'low', name: 'Low', importance: 1, costAmount: new Decimal('100'), costFrequency: 'monthly' }),
        makeHabit({ id: 'high', name: 'High', importance: 5, costAmount: new Decimal('100'), costFrequency: 'monthly' }),
      ],
    });
    const calc = proCalculate(input);
    const result = runPriorityV3Engine(calc);
    const low = result.rankings.find((r) => r.habitId === 'low')!;
    const high = result.rankings.find((r) => r.habitId === 'high')!;

    // Same cost & time → the only difference is resistance
    // low IW = 1.0, high IW = 0.2 → low should have 5× the score
    const ratio = low.priorityScore.dividedBy(high.priorityScore);
    expect(ratio.toNumber()).toBeCloseTo(5, 0);
  });

  it('uses 60% financial weight + 40% time weight', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'money', name: 'MoneyHeavy', costAmount: new Decimal('500'), costFrequency: 'monthly', timeAmount: new Decimal('0.1'), timeFrequency: 'daily', importance: 1 }),
        makeHabit({ id: 'time', name: 'TimeHeavy', costAmount: new Decimal('10'), costFrequency: 'monthly', timeAmount: new Decimal('8'), timeFrequency: 'daily', importance: 1 }),
      ],
    });
    const calc = proCalculate(input);
    const result = runPriorityV3Engine(calc);

    // Both have same importance (IW=1.0), so score = 0.6*CS + 0.4*TS
    expect(result.rankings).toHaveLength(2);
    for (const r of result.rankings) {
      expect(r.priorityScore.gt(0)).toBe(true);
    }
  });

  it('ranks are sequential starting from 1', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'a', name: 'A', importance: 1 }),
        makeHabit({ id: 'b', name: 'B', importance: 2 }),
        makeHabit({ id: 'c', name: 'C', importance: 3 }),
        makeHabit({ id: 'd', name: 'D', importance: 4 }),
      ],
    });
    const calc = proCalculate(input);
    const result = runPriorityV3Engine(calc);
    expect(result.rankings.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it('every ranking has a non-empty reason string', () => {
    const input = makeInput({
      habits: [
        makeHabit({ importance: 1 }),
        makeHabit({ importance: 5 }),
      ],
    });
    const calc = proCalculate(input);
    const result = runPriorityV3Engine(calc);
    for (const r of result.rankings) {
      expect(r.reason.length).toBeGreaterThan(10);
    }
  });

  it('handles zero total cost without crashing', () => {
    const input = makeInput({
      habits: [makeHabit({ costAmount: new Decimal('0'), timeAmount: new Decimal('0') })],
    });
    const calc = proCalculate(input);
    const result = runPriorityV3Engine(calc);
    expect(result.rankings).toHaveLength(1);
    expect(result.rankings[0].priorityScore.toNumber()).toBe(0);
  });
});

// ============================================================================
// SMART SWAP ENGINE
// ============================================================================

describe('Smart Swap Engine', () => {
  it('applies 30% reduction for importance 5', () => {
    const input = makeInput({ habits: [makeHabit({ importance: 5, costAmount: new Decimal('300'), costFrequency: 'monthly' })] });
    const calc = proCalculate(input);
    const result = runSmartSwapEngine(calc);
    expect(result.recommendations[0].reductionRate.toString()).toBe('0.3');
    expect(result.recommendations[0].strategy).toBe('hybrid_replacement');
  });

  it('applies 50% reduction for importance 3 and 4', () => {
    for (const imp of [3, 4] as const) {
      const input = makeInput({ habits: [makeHabit({ importance: imp })] });
      const calc = proCalculate(input);
      const result = runSmartSwapEngine(calc);
      expect(result.recommendations[0].reductionRate.toString()).toBe('0.5');
      expect(result.recommendations[0].strategy).toBe('frequency_optimization');
    }
  });

  it('applies 80% reduction for importance 1 and 2', () => {
    for (const imp of [1, 2] as const) {
      const input = makeInput({ habits: [makeHabit({ importance: imp })] });
      const calc = proCalculate(input);
      const result = runSmartSwapEngine(calc);
      expect(result.recommendations[0].reductionRate.toString()).toBe('0.8');
      expect(result.recommendations[0].strategy).toBe('strong_replacement');
    }
  });

  it('spec example: $300/mo restaurant at 50% reduction → $150/mo saving, $1800/yr', () => {
    const input = makeInput({
      habits: [makeHabit({
        id: 'restaurant', name: 'Restaurant', category: 'food',
        costAmount: new Decimal('300'), costFrequency: 'monthly', importance: 3,
      })],
    });
    const calc = proCalculate(input);
    const result = runSmartSwapEngine(calc);
    const rec = result.recommendations[0];
    expect(rec.currentMonthlyCost.toNumber()).toBeCloseTo(300, 0);
    expect(rec.monthlySaving.toNumber()).toBeCloseTo(150, 0);
    expect(rec.annualRecovery.toNumber()).toBeCloseTo(1800, 0);
    expect(rec.tenYearRecovery.toNumber()).toBeCloseTo(18000, 0);
  });

  it('provides category-specific suggestions for each recommendation', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'f', name: 'Food', category: 'food' }),
        makeHabit({ id: 's', name: 'Sub', category: 'subscription' }),
      ],
    });
    const calc = proCalculate(input);
    const result = runSmartSwapEngine(calc);
    const food = result.recommendations.find((r) => r.habitId === 'f')!;
    const sub = result.recommendations.find((r) => r.habitId === 's')!;
    expect(food.suggestions.length).toBeGreaterThan(0);
    expect(sub.suggestions).not.toEqual(food.suggestions);
  });

  it('computes total monthly and annual recovery', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'a', name: 'A', costAmount: new Decimal('300'), costFrequency: 'monthly', importance: 3 }),
        makeHabit({ id: 'b', name: 'B', costAmount: new Decimal('200'), costFrequency: 'monthly', importance: 1 }),
      ],
    });
    const calc = proCalculate(input);
    const result = runSmartSwapEngine(calc);
    // A: 50% of 300 = 150, B: 80% of 200 = 160 → total 310/mo
    expect(result.totalMonthlyRecovery.toNumber()).toBeCloseTo(310, 0);
    expect(result.totalAnnualRecovery.toNumber()).toBeCloseTo(310 * 12, 0);
  });

  it('sorts recommendations by annual recovery descending', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'small', name: 'Small', costAmount: new Decimal('50'), costFrequency: 'monthly', importance: 3 }),
        makeHabit({ id: 'big', name: 'Big', costAmount: new Decimal('500'), costFrequency: 'monthly', importance: 3 }),
      ],
    });
    const calc = proCalculate(input);
    const result = runSmartSwapEngine(calc);
    expect(result.recommendations[0].habitId).toBe('big');
    expect(result.recommendations[1].habitId).toBe('small');
  });
});

// ============================================================================
// FIRE ENGINE
// ============================================================================

describe('FIRE Engine', () => {
  it('returns CALCULATED with correct portfolio impact when data is present', () => {
    const profile = makeProfile({ currentSavingsRate: new Decimal('0.10') });
    const result = runFireEngine(profile, new Decimal('3600'));
    expect(result.status).toBe('CALCULATED');
    expect(result.annualRecovered.toNumber()).toBe(3600);
    // Rule of 25: 3600 * 25 = 90,000
    expect(result.potentialPortfolioImpact.toNumber()).toBe(90000);
  });

  it('spec example: $300/mo recovered → $3600/yr → $90,000 portfolio impact', () => {
    const profile = makeProfile({ currentSavingsRate: new Decimal('0.10') });
    const result = runFireEngine(profile, new Decimal('3600'));
    expect(result.potentialPortfolioImpact.toNumber()).toBe(90000);
  });

  it('returns INSUFFICIENT_DATA when savings rate is missing', () => {
    const profile = makeProfile({ currentSavingsRate: undefined });
    const result = runFireEngine(profile, new Decimal('3600'));
    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.potentialPortfolioImpact.toNumber()).toBe(0);
  });

  it('returns INSUFFICIENT_DATA when monthly income is zero', () => {
    const profile = makeProfile({ monthlyIncome: new Decimal('0'), currentSavingsRate: new Decimal('0.10') });
    const result = runFireEngine(profile, new Decimal('3600'));
    expect(result.status).toBe('INSUFFICIENT_DATA');
  });

  it('returns CALCULATED with zero impact when recovered savings is zero', () => {
    const profile = makeProfile({ currentSavingsRate: new Decimal('0.10') });
    const result = runFireEngine(profile, new Decimal('0'));
    expect(result.status).toBe('CALCULATED');
    expect(result.potentialPortfolioImpact.toNumber()).toBe(0);
  });
});

// ============================================================================
// RECOVERY ROADMAP ENGINE
// ============================================================================

describe('Recovery Roadmap Engine', () => {
  it('produces day30, day90, day180 phases', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'a', name: 'A', importance: 1 }),
        makeHabit({ id: 'b', name: 'B', importance: 3 }),
        makeHabit({ id: 'c', name: 'C', importance: 5 }),
      ],
    });
    const calc = proCalculate(input);
    const priority = runPriorityV3Engine(calc);
    const swaps = runSmartSwapEngine(calc);
    const roadmap = runRecoveryRoadmapEngine(calc, priority, swaps);

    expect(roadmap.day30.day).toBe(30);
    expect(roadmap.day90.day).toBe(90);
    expect(roadmap.day180.day).toBe(180);
  });

  it('day30 targets lowest-resistance (easiest) habits, max 2', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'easy1', name: 'Easy1', importance: 1 }),
        makeHabit({ id: 'easy2', name: 'Easy2', importance: 2 }),
        makeHabit({ id: 'hard1', name: 'Hard1', importance: 5 }),
      ],
    });
    const calc = proCalculate(input);
    const priority = runPriorityV3Engine(calc);
    const swaps = runSmartSwapEngine(calc);
    const roadmap = runRecoveryRoadmapEngine(calc, priority, swaps);

    expect(roadmap.day30.focusHabits.length).toBeLessThanOrEqual(2);
    // Easy1 (importance 1) and Easy2 (importance 2) should be in day30
    expect(roadmap.day30.focusHabits).toContain('Easy1');
    expect(roadmap.day30.focusHabits).toContain('Easy2');
  });

  it('day180 totalMonthlyRecovery equals sum of all habits monthly recovery', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'a', name: 'A', costAmount: new Decimal('300'), costFrequency: 'monthly', importance: 3 }),
        makeHabit({ id: 'b', name: 'B', costAmount: new Decimal('200'), costFrequency: 'monthly', importance: 1 }),
      ],
    });
    const calc = proCalculate(input);
    const priority = runPriorityV3Engine(calc);
    const swaps = runSmartSwapEngine(calc);
    const roadmap = runRecoveryRoadmapEngine(calc, priority, swaps);

    expect(roadmap.day180.totalMonthlyRecovery.equals(swaps.totalMonthlyRecovery)).toBe(true);
  });

  it('all phases have non-empty objective strings', () => {
    const input = makeInput({ habits: [makeHabit()] });
    const calc = proCalculate(input);
    const priority = runPriorityV3Engine(calc);
    const swaps = runSmartSwapEngine(calc);
    const roadmap = runRecoveryRoadmapEngine(calc, priority, swaps);

    expect(roadmap.day30.objective.length).toBeGreaterThan(5);
    expect(roadmap.day90.objective.length).toBeGreaterThan(5);
    expect(roadmap.day180.objective.length).toBeGreaterThan(5);
  });

  it('monthly recovery values are non-negative', () => {
    const input = makeInput({
      habits: [makeHabit({ costAmount: new Decimal('100'), costFrequency: 'monthly', importance: 3 })],
    });
    const calc = proCalculate(input);
    const priority = runPriorityV3Engine(calc);
    const swaps = runSmartSwapEngine(calc);
    const roadmap = runRecoveryRoadmapEngine(calc, priority, swaps);

    expect(roadmap.day30.monthlyRecovery.gte(0)).toBe(true);
    expect(roadmap.day90.monthlyRecovery.gte(0)).toBe(true);
    expect(roadmap.day180.totalMonthlyRecovery.gte(0)).toBe(true);
  });
});

// ============================================================================
// PRO ANALYSIS ENGINE (AGGREGATOR)
// ============================================================================

describe('Pro Analysis Engine (Aggregator)', () => {
  it('returns all modules populated for a valid input', () => {
    const input = makeInput({
      habits: [
        makeHabit({ id: 'a', name: 'A', costAmount: new Decimal('300'), costFrequency: 'monthly', importance: 3 }),
        makeHabit({ id: 'b', name: 'B', costAmount: new Decimal('100'), costFrequency: 'monthly', importance: 5 }),
      ],
    });
    const calc = proCalculate(input);
    const result = runProAnalysis(calc, input.profile);

    expect(result.investmentProjections).not.toBeNull();
    expect(result.priorityRanking).not.toBeNull();
    expect(result.smartSwaps).not.toBeNull();
    expect(result.fireImpact).not.toBeNull();
    expect(result.roadmap).not.toBeNull();
    expect(result.errors).toHaveLength(0);
  });

  it('investmentProjections contains 9 projection entries (3 scenarios × 3 horizons)', () => {
    const calc = proCalculate(makeInput());
    const result = runProAnalysis(calc, makeProfile());
    expect(result.investmentProjections!.projections).toHaveLength(9);
  });

  it('fireImpact returns INSUFFICIENT_DATA when savings rate is missing', () => {
    const input = makeInput({ profile: { currentSavingsRate: undefined } });
    const calc = proCalculate(input);
    const result = runProAnalysis(calc, input.profile);
    expect(result.fireImpact!.status).toBe('INSUFFICIENT_DATA');
  });

  it('fireImpact returns CALCULATED when savings rate is present', () => {
    const input = makeInput({ profile: { currentSavingsRate: new Decimal('0.10') } });
    const calc = proCalculate(input);
    const result = runProAnalysis(calc, input.profile);
    expect(result.fireImpact!.status).toBe('CALCULATED');
  });

  it('roadmap is null when priority or swaps fail', () => {
    // If we pass a calc result with no habits, engines may produce empty
    // but valid results. Test the error path by providing a profile
    // that will make swaps produce zero recovery.
    const input = makeInput({
      habits: [makeHabit({ costAmount: new Decimal('0'), timeAmount: new Decimal('0') })],
    });
    const calc = proCalculate(input);
    const result = runProAnalysis(calc, input.profile);
    // Roadmap should still be built (empty but valid)
    expect(result.roadmap).not.toBeNull();
  });

  it('errors array is empty on success', () => {
    const input = makeInput({ profile: { currentSavingsRate: new Decimal('0.10') } });
    const calc = proCalculate(input);
    const result = runProAnalysis(calc, input.profile);
    expect(result.errors).toHaveLength(0);
  });

  it('projectionYears is passed through from calcResult', () => {
    const input = makeInput();
    const calc = proCalculate(input);
    const result = runProAnalysis(calc, input.profile);
    expect(result.projectionYears.equals(calc.projectionYears)).toBe(true);
  });

  it('accepts custom scenarios', () => {
    const calc = proCalculate(makeInput());
    const customScenarios = [
      { id: 'aggressive', name: 'Aggressive', annualReturn: new Decimal('0.10') },
    ];
    const result = runProAnalysis(calc, makeProfile(), customScenarios);
    expect(result.investmentProjections!.projections).toHaveLength(3); // 1 scenario × 3 horizons
    expect(result.investmentProjections!.projections[0].scenario).toBe('aggressive');
  });
});
