import Decimal from 'decimal.js';
import type { HabitProjection, ProCalculationResult } from './proCalculationEngine';
import { priorityActions, type ProLang } from '@/lib/proI18n';

// ============================================================================
// PRIORITY ENGINE — Identifies highest-impact behavioral changes
// ============================================================================

export type PriorityTier = 'critical' | 'high' | 'moderate' | 'low';

export interface PriorityRanking {
  habitId: string;
  habitName: string;
  rank: number;
  tier: PriorityTier;
  combinedCost: Decimal;
  directCost: Decimal;
  timeOpportunityCost: Decimal;
  annualHours: Decimal;
  importance: 1 | 2 | 3 | 4 | 5;
  impactScore: Decimal;
  recommendedAction: string;
}

export interface PriorityResult {
  rankings: PriorityRanking[];
  highestImpact: PriorityRanking | null;
}

// ============================================================================
// TIER CLASSIFICATION
// ============================================================================

function classifyTier(impactScore: Decimal): PriorityTier {
  const pct = impactScore.toNumber();
  if (pct >= 40) return 'critical';
  if (pct >= 20) return 'high';
  if (pct >= 10) return 'moderate';
  return 'low';
}

// ============================================================================
// RECOMMENDED ACTION GENERATION
// ============================================================================

function recommendedActionKey(tier: PriorityTier, importance: number, isTimeDominated: boolean): string {
  if (tier === 'critical') {
    if (importance <= 2) return 'critical_low';
    return 'critical_high';
  }
  if (tier === 'high') {
    if (importance <= 2) return 'high_low';
    return 'high_high';
  }
  if (tier === 'moderate') {
    return isTimeDominated
      ? 'moderate_time'
      : 'moderate_general';
  }
  return 'low';
}

// ============================================================================
// PUBLIC API: rankHabits()
// ============================================================================

export function rankHabits(result: ProCalculationResult, lang: ProLang = 'en'): PriorityResult {
  const totalCombined = result.totals.projectionCombinedCost;

  const rankings: PriorityRanking[] = result.habits.map((h) => {
    const impactScore = totalCombined.gt(0)
      ? h.combinedCost.dividedBy(totalCombined).times(100)
      : new Decimal(0);

    const isTimeDominated = h.timeOpportunityCost.gt(h.directFinancialCost);
    const tier = classifyTier(impactScore);
    const importance = h.importance;

    return {
      habitId: h.id,
      habitName: h.name,
      rank: 0,
      tier,
      combinedCost: h.combinedCost,
      directCost: h.directFinancialCost,
      timeOpportunityCost: h.timeOpportunityCost,
      annualHours: h.annualHours,
      importance,
      impactScore,
      recommendedAction: priorityActions[lang][recommendedActionKey(tier, importance, isTimeDominated)] ?? priorityActions.en[recommendedActionKey(tier, importance, isTimeDominated)] ?? '',
    };
  });

  // Sort by combined cost descending (highest impact first)
  rankings.sort((a, b) => b.combinedCost.comparedTo(a.combinedCost));

  // Assign ranks
  rankings.forEach((r, i) => { r.rank = i + 1; });

  return {
    rankings,
    highestImpact: rankings.length > 0 ? rankings[0] : null,
  };
}
