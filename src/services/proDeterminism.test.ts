import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { proCalculate } from './proCalculationEngine';
import { runProAnalysis } from './proAnalysisEngine';
import { runPriorityV3Engine } from './priorityV3Engine';
import { runSmartSwapEngine } from './smartSwapEngine';
import { runCompoundWealthEngine, DEFAULT_SCENARIOS, DEFAULT_HORIZONS } from './compoundWealthEngine';
import { runFireEngine } from './fireEngine';
import { runRecoveryRoadmapEngine } from './recoveryRoadmapEngine';
import type { ProCalculationInput, UserFinancialProfile, ProHabitInput } from './proCalculationEngine';

// ============================================================================
// DETERMINISM CONTRACT (SPEC PART 26)
// Given identical inputs, engines MUST produce identical outputs every time.
// ============================================================================

function makeDeterministicInput(): ProCalculationInput {
  const profile: UserFinancialProfile = {
    id: 'det-test',
    monthlyIncome: new Decimal('6000'),
    weeklyWorkHours: new Decimal('40'),
    currency: 'USD',
    currentSavingsRate: new Decimal('0.15'),
  };
  const habits: ProHabitInput[] = [
    { id: 'h1', name: 'Coffee', category: 'beverage', costAmount: new Decimal('5'), costFrequency: 'daily', timeAmount: new Decimal('0.5'), timeFrequency: 'daily', importance: 4 },
    { id: 'h2', name: 'Dining Out', category: 'food', costAmount: new Decimal('300'), costFrequency: 'monthly', timeAmount: new Decimal('2'), timeFrequency: 'weekly', importance: 3 },
    { id: 'h3', name: 'Unused Sub', category: 'subscription', costAmount: new Decimal('15'), costFrequency: 'monthly', timeAmount: new Decimal('0'), timeFrequency: 'monthly', importance: 1 },
  ];
  return { profile, habits };
}

describe('Determinism Contract (Spec 26)', () => {
  it('proCalculate produces identical results on repeated calls', () => {
    const input = makeDeterministicInput();
    const r1 = proCalculate(input);
    const r2 = proCalculate(input);
    expect(r1.totals.projectionCombinedCost.equals(r2.totals.projectionCombinedCost)).toBe(true);
    expect(r1.totals.annualDirectCost.equals(r2.totals.annualDirectCost)).toBe(true);
    expect(r1.totals.annualHours.equals(r2.totals.annualHours)).toBe(true);
    expect(r1.hourlyValue.equals(r2.hourlyValue)).toBe(true);
  });

  it('runProAnalysis produces identical results on repeated calls', () => {
    const input = makeDeterministicInput();
    const calc = proCalculate(input);
    const a1 = runProAnalysis(calc, input.profile);
    const a2 = runProAnalysis(calc, input.profile);

    // Same errors
    expect(a1.errors).toEqual(a2.errors);

    // Same investment projections
    if (a1.investmentProjections && a2.investmentProjections) {
      expect(a1.investmentProjections.projections.length).toBe(a2.investmentProjections.projections.length);
      for (let i = 0; i < a1.investmentProjections.projections.length; i++) {
        const p1 = a1.investmentProjections.projections[i];
        const p2 = a2.investmentProjections.projections[i];
        expect(p1.futureValue.equals(p2.futureValue)).toBe(true);
        expect(p1.growthAmount.equals(p2.growthAmount)).toBe(true);
      }
    }

    // Same priority rankings
    if (a1.priorityRanking && a2.priorityRanking) {
      for (let i = 0; i < a1.priorityRanking.rankings.length; i++) {
        expect(a1.priorityRanking.rankings[i].priorityScore.equals(a2.priorityRanking.rankings[i].priorityScore)).toBe(true);
        expect(a1.priorityRanking.rankings[i].rank).toBe(a2.priorityRanking.rankings[i].rank);
        expect(a1.priorityRanking.rankings[i].reason).toBe(a2.priorityRanking.rankings[i].reason);
      }
    }

    // Same smart swaps
    if (a1.smartSwaps && a2.smartSwaps) {
      expect(a1.smartSwaps.totalAnnualRecovery.equals(a2.smartSwaps.totalAnnualRecovery)).toBe(true);
      for (let i = 0; i < a1.smartSwaps.recommendations.length; i++) {
        expect(a1.smartSwaps.recommendations[i].monthlySaving.equals(a2.smartSwaps.recommendations[i].monthlySaving)).toBe(true);
        expect(a1.smartSwaps.recommendations[i].reductionRate.equals(a2.smartSwaps.recommendations[i].reductionRate)).toBe(true);
      }
    }

    // Same FIRE
    if (a1.fireImpact && a2.fireImpact) {
      expect(a1.fireImpact.status).toBe(a2.fireImpact.status);
      expect(a1.fireImpact.potentialPortfolioImpact.equals(a2.fireImpact.potentialPortfolioImpact)).toBe(true);
    }

    // Same roadmap
    if (a1.roadmap && a2.roadmap) {
      expect(a1.roadmap.day30.monthlyRecovery.equals(a2.roadmap.day30.monthlyRecovery)).toBe(true);
      expect(a1.roadmap.day90.monthlyRecovery.equals(a2.roadmap.day90.monthlyRecovery)).toBe(true);
      expect(a1.roadmap.day180.totalMonthlyRecovery.equals(a2.roadmap.day180.totalMonthlyRecovery)).toBe(true);
    }
  });

  it('compoundWealthEngine is deterministic for same inputs', () => {
    const p1 = runCompoundWealthEngine(new Decimal('300'));
    const p2 = runCompoundWealthEngine(new Decimal('300'));
    for (let i = 0; i < p1.projections.length; i++) {
      expect(p1.projections[i].futureValue.equals(p2.projections[i].futureValue)).toBe(true);
    }
  });

  it('priorityV3Engine is deterministic for same inputs', () => {
    const input = makeDeterministicInput();
    const calc = proCalculate(input);
    const r1 = runPriorityV3Engine(calc);
    const r2 = runPriorityV3Engine(calc);
    for (let i = 0; i < r1.rankings.length; i++) {
      expect(r1.rankings[i].priorityScore.equals(r2.rankings[i].priorityScore)).toBe(true);
      expect(r1.rankings[i].rank).toBe(r2.rankings[i].rank);
    }
  });

  it('smartSwapEngine is deterministic for same inputs', () => {
    const input = makeDeterministicInput();
    const calc = proCalculate(input);
    const r1 = runSmartSwapEngine(calc);
    const r2 = runSmartSwapEngine(calc);
    expect(r1.totalMonthlyRecovery.equals(r2.totalMonthlyRecovery)).toBe(true);
    expect(r1.totalAnnualRecovery.equals(r2.totalAnnualRecovery)).toBe(true);
  });

  it('fireEngine is deterministic for same inputs', () => {
    const profile: UserFinancialProfile = {
      id: 'fire-det',
      monthlyIncome: new Decimal('5000'),
      weeklyWorkHours: new Decimal('40'),
      currency: 'USD',
      currentSavingsRate: new Decimal('0.10'),
    };
    const r1 = runFireEngine(profile, new Decimal('3600'));
    const r2 = runFireEngine(profile, new Decimal('3600'));
    expect(r1.status).toBe(r2.status);
    expect(r1.potentialPortfolioImpact.equals(r2.potentialPortfolioImpact)).toBe(true);
  });

  it('recoveryRoadmapEngine is deterministic for same inputs', () => {
    const input = makeDeterministicInput();
    const calc = proCalculate(input);
    const priority = runPriorityV3Engine(calc);
    const swaps = runSmartSwapEngine(calc);
    const r1 = runRecoveryRoadmapEngine(calc, priority, swaps);
    const r2 = runRecoveryRoadmapEngine(calc, priority, swaps);
    expect(r1.day30.focusHabits).toEqual(r2.day30.focusHabits);
    expect(r1.day90.focusHabits).toEqual(r2.day90.focusHabits);
    expect(r1.day180.totalMonthlyRecovery.equals(r2.day180.totalMonthlyRecovery)).toBe(true);
  });
});

// ============================================================================
// ACCEPTANCE CRITERIA (SPEC PART 27)
// ============================================================================

describe('Acceptance Criteria (Spec 27)', () => {
  it('all financial calculations use Decimal.js (no native float in results)', () => {
    const input = makeDeterministicInput();
    const calc = proCalculate(input);
    // All result fields should be Decimal instances
    expect(calc.totals.projectionCombinedCost).toBeInstanceOf(Decimal);
    expect(calc.totals.annualDirectCost).toBeInstanceOf(Decimal);
    expect(calc.totals.annualHours).toBeInstanceOf(Decimal);
    expect(calc.hourlyValue).toBeInstanceOf(Decimal);
    for (const h of calc.habits) {
      expect(h.directFinancialCost).toBeInstanceOf(Decimal);
      expect(h.timeOpportunityCost).toBeInstanceOf(Decimal);
      expect(h.combinedCost).toBeInstanceOf(Decimal);
    }
  });

  it('no habit appears in results that user did not enter', () => {
    const input = makeDeterministicInput();
    const calc = proCalculate(input);
    const inputNames = input.habits.map((h) => h.name);
    const resultNames = calc.habits.map((h) => h.name);
    expect(resultNames.sort()).toEqual(inputNames.sort());

    // Check priority rankings
    const analysis = runProAnalysis(calc, input.profile);
    if (analysis.priorityRanking) {
      const rankedNames = analysis.priorityRanking.rankings.map((r) => r.habitName);
      expect(rankedNames.sort()).toEqual(inputNames.sort());
    }

    // Check smart swaps
    if (analysis.smartSwaps) {
      const swappedNames = analysis.smartSwaps.recommendations.map((s) => s.habitName);
      expect(swappedNames.sort()).toEqual(inputNames.sort());
    }
  });

  it('no recommendation rendered without supporting input data', () => {
    const input = makeDeterministicInput();
    const calc = proCalculate(input);
    const analysis = runProAnalysis(calc, input.profile);

    // Every swap recommendation must reference a user-entered habit
    if (analysis.smartSwaps) {
      const inputIds = new Set(input.habits.map((h) => h.id));
      for (const rec of analysis.smartSwaps.recommendations) {
        expect(inputIds.has(rec.habitId)).toBe(true);
      }
    }

    // Every priority ranking must reference a user-entered habit
    if (analysis.priorityRanking) {
      const inputIds = new Set(input.habits.map((h) => h.id));
      for (const r of analysis.priorityRanking.rankings) {
        expect(inputIds.has(r.habitId)).toBe(true);
      }
    }
  });

  it('summary totals match sum of individual components', () => {
    const input = makeDeterministicInput();
    const calc = proCalculate(input);

    // projectionCombinedCost = projectionDirectCost + projectionTimeOpportunityCost
    const sumParts = calc.totals.projectionDirectCost.plus(calc.totals.projectionTimeOpportunityCost);
    expect(calc.totals.projectionCombinedCost.equals(sumParts)).toBe(true);

    // Sum of habit direct costs should relate to total direct cost
    const habitsDirectSum = calc.habits.reduce((s, h) => s.plus(h.directFinancialCost), new Decimal(0));
    expect(habitsDirectSum.equals(calc.totals.projectionDirectCost)).toBe(true);

    // Sum of habit combined costs should equal total combined
    const habitsCombinedSum = calc.habits.reduce((s, h) => s.plus(h.combinedCost), new Decimal(0));
    expect(habitsCombinedSum.equals(calc.totals.projectionCombinedCost)).toBe(true);
  });

  it('FIRE returns INSUFFICIENT_DATA when monthly income is blank (no zero estimation)', () => {
    const profile: UserFinancialProfile = {
      id: 'no-income',
      monthlyIncome: new Decimal('0'),
      weeklyWorkHours: new Decimal('40'),
      currency: 'USD',
      currentSavingsRate: new Decimal('0.10'),
    };
    const result = runFireEngine(profile, new Decimal('3600'));
    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.potentialPortfolioImpact.toNumber()).toBe(0);
  });

  it('recommendation engine never recommends complete cancellation for importance >= 3', () => {
    const input = makeDeterministicInput();
    const calc = proCalculate(input);
    const swaps = runSmartSwapEngine(calc);
    for (const rec of swaps.recommendations) {
      if (rec.importance >= 3) {
        // Reduction rate must be < 1 (never 100%)
        expect(rec.reductionRate.lt(1)).toBe(true);
      }
    }
  });

  it('importance 5 gets exactly 30% reduction (spec rule 2)', () => {
    const input: ProCalculationInput = {
      profile: { id: 't', monthlyIncome: new Decimal('5000'), weeklyWorkHours: new Decimal('40'), currency: 'USD' },
      habits: [{ id: 'h1', name: 'Precious', category: 'beverage', costAmount: new Decimal('10'), costFrequency: 'daily', timeAmount: new Decimal('1'), timeFrequency: 'daily', importance: 5 }],
    };
    const calc = proCalculate(input);
    const swaps = runSmartSwapEngine(calc);
    expect(swaps.recommendations[0].reductionRate.toString()).toBe('0.3');
  });

  it('importance 3-4 gets exactly 50% reduction (spec rule 3)', () => {
    for (const imp of [3, 4] as const) {
      const input: ProCalculationInput = {
        profile: { id: 't', monthlyIncome: new Decimal('5000'), weeklyWorkHours: new Decimal('40'), currency: 'USD' },
        habits: [{ id: 'h1', name: 'Test', category: 'food', costAmount: new Decimal('10'), costFrequency: 'daily', timeAmount: new Decimal('1'), timeFrequency: 'daily', importance: imp }],
      };
      const calc = proCalculate(input);
      const swaps = runSmartSwapEngine(calc);
      expect(swaps.recommendations[0].reductionRate.toString()).toBe('0.5');
    }
  });

  it('compound wealth uses 3 scenarios × 3 horizons = 9 projections', () => {
    const result = runCompoundWealthEngine(new Decimal('100'));
    expect(result.projections).toHaveLength(9);
    expect(result.scenarios).toHaveLength(3);
    expect(result.horizons).toEqual([10, 20, 30]);
  });

  it('compound wealth scenarios are exactly 4%, 7%, 8%', () => {
    expect(DEFAULT_SCENARIOS[0].annualReturn.toString()).toBe('0.04');
    expect(DEFAULT_SCENARIOS[1].annualReturn.toString()).toBe('0.07');
    expect(DEFAULT_SCENARIOS[2].annualReturn.toString()).toBe('0.08');
  });

  it('priority weights sum to 100% (60% + 40%)', () => {
    // The formula uses 0.6 * CS + 0.4 * TS
    // For a single habit, CS=1 and TS=1, so score = (0.6 + 0.4) * IW = 1.0 * IW
    const input: ProCalculationInput = {
      profile: { id: 't', monthlyIncome: new Decimal('5000'), weeklyWorkHours: new Decimal('40'), currency: 'USD' },
      habits: [{ id: 'h1', name: 'Only', category: 'food', costAmount: new Decimal('100'), costFrequency: 'monthly', timeAmount: new Decimal('10'), timeFrequency: 'weekly', importance: 1 }],
    };
    const calc = proCalculate(input);
    const priority = runPriorityV3Engine(calc);
    // With one habit, CS=1, TS=1, IW=1.0 → score = (0.6*1 + 0.4*1) * 1.0 = 1.0
    expect(priority.rankings[0].priorityScore.toNumber()).toBeCloseTo(1.0, 5);
  });

  it('error isolation: if FIRE fails, other modules still produce results', () => {
    // Missing savings rate → FIRE returns INSUFFICIENT_DATA, but other engines work
    const input: ProCalculationInput = {
      profile: { id: 't', monthlyIncome: new Decimal('5000'), weeklyWorkHours: new Decimal('40'), currency: 'USD' },
      habits: [{ id: 'h1', name: 'Test', category: 'food', costAmount: new Decimal('100'), costFrequency: 'monthly', timeAmount: new Decimal('5'), timeFrequency: 'weekly', importance: 3 }],
    };
    const calc = proCalculate(input);
    const analysis = runProAnalysis(calc, input.profile);

    expect(analysis.fireImpact!.status).toBe('INSUFFICIENT_DATA');
    expect(analysis.priorityRanking).not.toBeNull();
    expect(analysis.smartSwaps).not.toBeNull();
    expect(analysis.roadmap).not.toBeNull();
    expect(analysis.investmentProjections).not.toBeNull();
  });
});
