import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  proCalculate,
  type ProCalculationInput,
  type ProHabitInput,
  type UserFinancialProfile,
} from './proCalculationEngine';
import { rankHabits } from './priorityEngine';
import { generateSwaps } from './swapRecommendationEngine';
import { buildRoadmap } from './roadmapEngine';

// ============================================================================
// HELPERS
// ============================================================================

function makeProfile(income = '5000', workHours = '40', age?: string): UserFinancialProfile {
  return {
    id: 'test',
    monthlyIncome: new Decimal(income),
    weeklyWorkHours: new Decimal(workHours),
    currency: 'USD',
    ...(age !== undefined ? { age: new Decimal(age) } : {}),
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

function makeInput(habits: ProHabitInput[], profile?: UserFinancialProfile, projection?: string): ProCalculationInput {
  return {
    profile: profile ?? makeProfile(),
    habits,
    ...(projection !== undefined ? { projectionYearsOverride: new Decimal(projection) } : {}),
  };
}

// ============================================================================
// PRIORITY ENGINE TESTS
// ============================================================================

describe('Priority Engine', () => {
  it('Ranks habits by combined cost descending', () => {
    const input = makeInput([
      makeHabit('Coffee', '10', 'daily', '0.5', 'daily', 5, 'beverage'),
      makeHabit('Gaming', '50', 'monthly', '20', 'monthly', 4, 'entertainment'),
      makeHabit('Restaurants', '300', 'monthly', '12', 'monthly', 3, 'food'),
    ]);
    const result = proCalculate(input);
    const priority = rankHabits(result);

    expect(priority.rankings).toHaveLength(3);
    expect(priority.rankings[0].rank).toBe(1);
    // Coffee has highest combined cost (3652.5 annual × 10 + high time opp)
    expect(priority.rankings[0].habitName).toBe('Coffee');
  });

  it('Classifies tiers correctly', () => {
    // Single habit = 100% of total = critical
    const input = makeInput([makeHabit('Coffee', '10', 'daily', '0.5', 'daily')]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    expect(priority.rankings[0].tier).toBe('critical');
  });

  it('Moderate tier for mid-range impact', () => {
    const input = makeInput([
      makeHabit('Expensive', '100', 'daily', '8', 'daily'),
      makeHabit('Cheap', '1', 'daily', '0.1', 'daily'),
      makeHabit('Mid', '10', 'daily', '1', 'daily'),
    ]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    // 'Cheap' should be low tier (small fraction of total)
    const cheap = priority.rankings.find((r) => r.habitName === 'Cheap')!;
    expect(['low', 'moderate']).toContain(cheap.tier);
  });

  it('Provides recommended action text', () => {
    const input = makeInput([makeHabit('Coffee', '10', 'daily', '0.5', 'daily', 5, 'beverage')]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    expect(priority.rankings[0].recommendedAction).toBeTruthy();
    expect(priority.rankings[0].recommendedAction.length).toBeGreaterThan(10);
  });

  it('highestImpact points to rank 1', () => {
    const input = makeInput([
      makeHabit('A', '10', 'daily', '1', 'daily'),
      makeHabit('B', '5', 'daily', '0.5', 'daily'),
    ]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    expect(priority.highestImpact).not.toBeNull();
    expect(priority.highestImpact!.rank).toBe(1);
  });

  it('Impact scores sum to 100', () => {
    const input = makeInput([
      makeHabit('A', '10', 'daily', '1', 'daily'),
      makeHabit('B', '50', 'weekly', '5', 'weekly'),
      makeHabit('C', '200', 'monthly', '10', 'monthly'),
    ]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    const sum = priority.rankings.reduce((s, r) => s.plus(r.impactScore), new Decimal(0));
    expect(sum.toDecimalPlaces(2).toNumber()).toBeCloseTo(100, 0);
  });
});

// ============================================================================
// SWAP RECOMMENDATION ENGINE TESTS
// ============================================================================

describe('Swap Recommendation Engine', () => {
  it('Generates a swap for every habit', () => {
    const input = makeInput([
      makeHabit('Coffee', '10', 'daily', '0.5', 'daily', 5, 'beverage'),
      makeHabit('Netflix', '15', 'monthly', '3', 'monthly', 3, 'subscription'),
    ]);
    const result = proCalculate(input);
    const swaps = generateSwaps(result);
    expect(swaps.recommendations).toHaveLength(2);
  });

  it('Beverage swap uses 15% cost multiplier (brew at home)', () => {
    const input = makeInput([makeHabit('Coffee', '10', 'daily', '0', 'daily', 5, 'beverage')]);
    const result = proCalculate(input);
    const swaps = generateSwaps(result);
    // Annual = 3652.5, swapped = 3652.5 × 0.15 = 547.875
    expect(swaps.recommendations[0].swappedAnnualCost.toString()).toBe('547.875');
    // Savings = 3652.5 - 547.875 = 3104.625
    expect(swaps.recommendations[0].annualSavings.toString()).toBe('3104.625');
  });

  it('Projection savings = annual savings × projection years', () => {
    const input = makeInput([makeHabit('Coffee', '10', 'daily', '0', 'daily', 5, 'beverage')], makeProfile('5000', '40'), '10');
    const result = proCalculate(input);
    const swaps = generateSwaps(result);
    expect(swaps.recommendations[0].projectionSavings.equals(
      swaps.recommendations[0].annualSavings.times(10),
    )).toBe(true);
  });

  it('Total annual savings = sum of individual savings', () => {
    const input = makeInput([
      makeHabit('Coffee', '10', 'daily', '0', 'daily', 5, 'beverage'),
      makeHabit('Gaming', '50', 'monthly', '0', 'monthly', 4, 'entertainment'),
    ]);
    const result = proCalculate(input);
    const swaps = generateSwaps(result);
    const sum = swaps.recommendations.reduce((s, r) => s.plus(r.annualSavings), new Decimal(0));
    expect(swaps.totalAnnualSavings.equals(sum)).toBe(true);
  });

  it('Realism score decreases with higher importance', () => {
    const inputLow = makeInput([makeHabit('X', '10', 'daily', '0', 'daily', 1, 'beverage')]);
    const inputHigh = makeInput([makeHabit('X', '10', 'daily', '0', 'daily', 5, 'beverage')]);
    const low = generateSwaps(proCalculate(inputLow));
    const high = generateSwaps(proCalculate(inputHigh));
    expect(high.recommendations[0].realismScore.lt(low.recommendations[0].realismScore)).toBe(true);
  });

  it('Swaps sorted by projection savings descending', () => {
    const input = makeInput([
      makeHabit('Small', '1', 'daily', '0', 'daily', 3, 'beverage'),
      makeHabit('Big', '100', 'daily', '0', 'daily', 3, 'beverage'),
    ]);
    const result = proCalculate(input);
    const swaps = generateSwaps(result);
    expect(swaps.recommendations[0].habitName).toBe('Big');
    expect(swaps.recommendations[1].habitName).toBe('Small');
  });
});

// ============================================================================
// ROADMAP ENGINE TESTS
// ============================================================================

describe('Roadmap Engine', () => {
  it('Builds phases grouped by difficulty', () => {
    const input = makeInput([
      makeHabit('Coffee', '10', 'daily', '0.5', 'daily', 5, 'beverage'),
      makeHabit('Netflix', '15', 'monthly', '3', 'monthly', 3, 'subscription'),
      makeHabit('Shopping', '200', 'monthly', '5', 'monthly', 2, 'shopping'),
    ]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    const swaps = generateSwaps(result);
    const roadmap = buildRoadmap(result, priority, swaps);

    expect(roadmap.phases.length).toBeGreaterThan(0);
    expect(roadmap.phases[0].title).toBe('Quick Wins');
  });

  it('Cumulative savings increase across phases', () => {
    const input = makeInput([
      makeHabit('Coffee', '10', 'daily', '0', 'daily', 5, 'beverage'),
      makeHabit('Restaurants', '300', 'monthly', '12', 'monthly', 3, 'food'),
    ]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    const swaps = generateSwaps(result);
    const roadmap = buildRoadmap(result, priority, swaps);

    for (let i = 1; i < roadmap.phases.length; i++) {
      expect(
        roadmap.phases[i].cumulativeProjectionSavings.gt(roadmap.phases[i - 1].cumulativeProjectionSavings),
      ).toBe(true);
    }
  });

  it('Summary total equals swap total', () => {
    const input = makeInput([
      makeHabit('Coffee', '10', 'daily', '0', 'daily', 5, 'beverage'),
      makeHabit('Gaming', '50', 'monthly', '0', 'monthly', 4, 'entertainment'),
    ]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    const swaps = generateSwaps(result);
    const roadmap = buildRoadmap(result, priority, swaps);

    expect(roadmap.summary.totalAnnualRecoverable.equals(swaps.totalAnnualSavings)).toBe(true);
    expect(roadmap.summary.totalProjectionRecoverable.equals(swaps.totalProjectionSavings)).toBe(true);
  });

  it('Percentage recoverable is 0-100 range', () => {
    const input = makeInput([
      makeHabit('Coffee', '10', 'daily', '0', 'daily', 5, 'beverage'),
    ]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    const swaps = generateSwaps(result);
    const roadmap = buildRoadmap(result, priority, swaps);

    const pct = roadmap.summary.percentageRecoverable.toNumber();
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it('Years to financial freedom is null when no savings', () => {
    const input = makeInput([makeHabit('Free', '0', 'daily', '1', 'daily')]);
    const result = proCalculate(input);
    const priority = rankHabits(result);
    const swaps = generateSwaps(result);
    const roadmap = buildRoadmap(result, priority, swaps);
    // No cost → no savings → null
    expect(roadmap.summary.yearsToFinancialFreedom).toBeNull();
  });

  it('Future value if invested is positive when savings exist', () => {
    const input = makeInput([
      makeHabit('Coffee', '10', 'daily', '0', 'daily', 5, 'beverage'),
    ], makeProfile('5000', '40'), '10');
    const result = proCalculate(input);
    const priority = rankHabits(result);
    const swaps = generateSwaps(result);
    const roadmap = buildRoadmap(result, priority, swaps);
    expect(roadmap.summary.futureValueIfInvested.gt(0)).toBe(true);
  });

  it('Spec example: coffee + restaurants + gaming produces coherent roadmap', () => {
    const profile = makeProfile('5000', '40', '35');
    const habits = [
      makeHabit('Coffee outside home', '10', 'daily', '0.5', 'daily', 5, 'beverage'),
      makeHabit('Restaurant meals', '300', 'monthly', '12', 'monthly', 3, 'food'),
      makeHabit('Gaming', '50', 'monthly', '20', 'monthly', 4, 'entertainment'),
    ];
    const result = proCalculate(makeInput(habits, profile));
    const priority = rankHabits(result);
    const swaps = generateSwaps(result);
    const roadmap = buildRoadmap(result, priority, swaps);

    expect(roadmap.phases.length).toBeGreaterThan(0);
    expect(roadmap.summary.totalAnnualRecoverable.gt(0)).toBe(true);
    expect(roadmap.summary.totalProjectionRecoverable.gt(0)).toBe(true);
    // All phase target habits reference input habits
    const allTargets = roadmap.phases.flatMap((p) => p.targetHabits);
    expect(allTargets.length).toBe(3);
  });
});
