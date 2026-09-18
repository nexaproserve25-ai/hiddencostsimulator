import Decimal from 'decimal.js';
import type { ProCalculationResult, HabitProjection, HabitCategory } from './proCalculationEngine';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// SMART SWAP ENGINE — V3.0 SPEC PART 16
// "Reduce intelligently" — never "Stop completely."
// Reduction is based on user importance, not generic assumptions.
// ============================================================================

export interface SwapRule {
  category: HabitCategory;
  strategy: string;
  defaultReduction: Decimal;
  suggestions: string[];
}

export interface SwapRecommendation {
  habitId: string;
  habitName: string;
  category: HabitCategory;
  importance: number;
  reductionRate: Decimal;
  strategy: string;
  currentMonthlyCost: Decimal;
  suggestedMonthlyCost: Decimal;
  monthlySaving: Decimal;
  annualRecovery: Decimal;
  tenYearRecovery: Decimal;
  suggestions: string[];
}

export interface SmartSwapOutput {
  recommendations: SwapRecommendation[];
  totalMonthlyRecovery: Decimal;
  totalAnnualRecovery: Decimal;
}

// ============================================================================
// SWAP DATABASE — per-category strategies & suggestions
// ============================================================================

const SWAP_RULES: Record<HabitCategory, SwapRule> = {
  food: {
    category: 'food',
    strategy: 'frequency_reduction',
    defaultReduction: new Decimal('0.50'),
    suggestions: ['Prepare selected meals at home', 'Create a weekly dining budget'],
  },
  beverage: {
    category: 'beverage',
    strategy: 'hybrid_replacement',
    defaultReduction: new Decimal('0.30'),
    suggestions: ['Brew at home on most days, keep café for special occasions', 'Batch-prepare drinks weekly'],
  },
  shopping: {
    category: 'shopping',
    strategy: 'strong_replacement',
    defaultReduction: new Decimal('0.80'),
    suggestions: ['Implement a 24-hour cooling-off period before purchases', 'Replace with free or low-cost alternatives'],
  },
  entertainment: {
    category: 'entertainment',
    strategy: 'frequency_optimization',
    defaultReduction: new Decimal('0.50'),
    suggestions: ['Seek free community events and libraries', 'Consolidate overlapping subscriptions'],
  },
  subscription: {
    category: 'subscription',
    strategy: 'strong_replacement',
    defaultReduction: new Decimal('0.80'),
    suggestions: ['Cancel unused subscriptions', 'Consolidate overlapping services into one plan'],
  },
  transport: {
    category: 'transport',
    strategy: 'frequency_optimization',
    defaultReduction: new Decimal('0.50'),
    suggestions: ['Use public transit or carpool for some trips', 'Batch errands to reduce trips'],
  },
  other: {
    category: 'other',
    strategy: 'frequency_optimization',
    defaultReduction: new Decimal('0.50'),
    suggestions: ['Reduce frequency by half while keeping the core benefit', 'Find a lower-cost alternative that preserves value'],
  },
};

// ============================================================================
// REDUCTION RULES (spec 16.2)
//   Importance 5   → 30% reduction (hybrid replacement)
//   Importance 3-4 → 50% reduction (frequency optimization)
//   Importance 1-2 → 80-100% reduction (strong replacement)
// ============================================================================

function reductionRateForImportance(importance: number): { rate: Decimal; strategy: string } {
  if (importance === 5) {
    return { rate: new Decimal('0.30'), strategy: 'hybrid_replacement' };
  }
  if (importance === 3 || importance === 4) {
    return { rate: new Decimal('0.50'), strategy: 'frequency_optimization' };
  }
  // importance 1-2 → 80-100% reduction; use 80% as the actionable default
  // (100% is reserved for truly unused items; 80% keeps the "reduce" framing)
  return { rate: new Decimal('0.80'), strategy: 'strong_replacement' };
}

function monthlyCostFromAnnual(annualCost: Decimal): Decimal {
  return annualCost.dividedBy(12);
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function runSmartSwapEngine(result: ProCalculationResult): SmartSwapOutput {
  const recommendations: SwapRecommendation[] = result.habits.map((h: HabitProjection) => {
    const { rate, strategy } = reductionRateForImportance(h.importance);
    const rule = SWAP_RULES[h.category];

    const currentMonthlyCost = monthlyCostFromAnnual(h.annualCost);
    const suggestedMonthlyCost = currentMonthlyCost.times(new Decimal(1).minus(rate));
    const monthlySaving = currentMonthlyCost.minus(suggestedMonthlyCost);
    const annualRecovery = monthlySaving.times(12);
    const tenYearRecovery = annualRecovery.times(10);

    return {
      habitId: h.id,
      habitName: h.name,
      category: h.category,
      importance: h.importance,
      reductionRate: rate,
      strategy: strategy || rule.strategy,
      currentMonthlyCost,
      suggestedMonthlyCost,
      monthlySaving,
      annualRecovery,
      tenYearRecovery,
      suggestions: rule.suggestions,
    };
  });

  // Sort by annual recovery descending — biggest recoverable amount first
  recommendations.sort((a, b) => b.annualRecovery.comparedTo(a.annualRecovery));

  const totalMonthlyRecovery = recommendations.reduce(
    (s, r) => s.plus(r.monthlySaving), new Decimal(0),
  );
  const totalAnnualRecovery = totalMonthlyRecovery.times(12);

  return { recommendations, totalMonthlyRecovery, totalAnnualRecovery };
}
