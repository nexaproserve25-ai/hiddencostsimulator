import Decimal from 'decimal.js';
import type { ProCalculationResult, HabitProjection } from './proCalculationEngine';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// PRIORITY V3 ENGINE — SPEC PART 15
// Balances financial impact, time impact, and user resistance.
// Does NOT simply rank by highest spending.
// ============================================================================

export interface PriorityV3Result {
  habitId: string;
  habitName: string;
  priorityScore: Decimal;
  rank: number;
  reason: string;
}

export interface PriorityV3Output {
  rankings: PriorityV3Result[];
}

// ============================================================================
// FORMULAS
//   Financial Weight:  CS_i = AnnualCost_i / TotalAnnualCost
//   Time Weight:       TS_i = AnnualHours_i / TotalAnnualHours
//   Resistance Factor: IW_i = (6 - Importance_i) / 5
//   PriorityScore_i  = (0.6 * CS_i + 0.4 * TS_i) * IW_i
// ============================================================================

const FINANCIAL_WEIGHT = new Decimal('0.6');
const TIME_WEIGHT = new Decimal('0.4');

function resistanceFactor(importance: number): Decimal {
  return new Decimal(6).minus(importance).dividedBy(5);
}

function buildReason(habit: HabitProjection, cs: Decimal, ts: Decimal, iw: Decimal): string {
  const finPct = cs.times(100).toNumber();
  const timePct = ts.times(100).toNumber();

  if (iw.gte('0.8')) {
    if (finPct >= 30) return 'Highest financial impact with very realistic modification potential.';
    return 'Very easy to modify — quick win with meaningful recovery potential.';
  }
  if (iw.gte('0.4')) {
    if (finPct >= 30) return 'High financial impact with moderate modification potential.';
    if (timePct >= 30) return 'Significant time impact with moderate modification potential.';
    return 'Balanced impact — worth addressing after higher-priority items.';
  }
  // iw < 0.4 → difficult to change
  if (finPct >= 40) return 'Major financial drain, but personally important — consider gradual reduction.';
  if (timePct >= 40) return 'Major time cost, but personally important — consider efficiency improvements.';
  return 'Personally important with lower financial impact — maintain mindfully.';
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function runPriorityV3Engine(result: ProCalculationResult): PriorityV3Output {
  const totalAnnualCost = result.totals.annualDirectCost;
  const totalAnnualHours = result.totals.annualHours;

  const rankings: PriorityV3Result[] = result.habits.map((h) => {
    const cs = totalAnnualCost.gt(0)
      ? h.annualCost.dividedBy(totalAnnualCost)
      : new Decimal(0);
    const ts = totalAnnualHours.gt(0)
      ? h.annualHours.dividedBy(totalAnnualHours)
      : new Decimal(0);
    const iw = resistanceFactor(h.importance);

    const score = FINANCIAL_WEIGHT.times(cs)
      .plus(TIME_WEIGHT.times(ts))
      .times(iw);

    return {
      habitId: h.id,
      habitName: h.name,
      priorityScore: score,
      rank: 0,
      reason: buildReason(h, cs, ts, iw),
    };
  });

  // Sort by priority score descending — highest smart-impact first
  rankings.sort((a, b) => b.priorityScore.comparedTo(a.priorityScore));
  rankings.forEach((r, i) => { r.rank = i + 1; });

  return { rankings };
}
