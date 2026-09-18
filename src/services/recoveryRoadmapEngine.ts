import Decimal from 'decimal.js';
import type { ProCalculationResult } from './proCalculationEngine';
import type { PriorityV3Output } from './priorityV3Engine';
import type { SmartSwapOutput } from './smartSwapEngine';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// 180-DAY FINANCIAL RECOVERY ROADMAP — V3.0 SPEC PART 18
// Dynamic roadmap built from priority rankings + recommended reductions.
// ============================================================================

export interface RoadmapPhase {
  day: number;
  objective: string;
  focusHabits: string[];
  monthlyRecovery: Decimal;
}

export interface RecoveryRoadmap {
  day30: RoadmapPhase;
  day90: RoadmapPhase;
  day180: RoadmapPhase & { totalMonthlyRecovery: Decimal };
}

// ============================================================================
// PHASE LOGIC (spec 18.2-18.4)
//
// Day 30:  Quick wins — lowest resistance habits (highest IW), max 2 habits.
// Day 90:  Behavior stabilization — medium resistance habits.
// Day 180: Permanent system — remaining habits + total recovery summary.
//
// Resistance is derived from importance: higher importance = higher resistance.
// PriorityV3 already sorted by priorityScore, but for the roadmap we want
// to attack by resistance (easiest first), not by score.
// ============================================================================

function resistanceScore(importance: number): number {
  // Mirror the IW formula: (6 - importance) / 5 → higher = easier
  return (6 - importance) / 5;
}

function buildPhases(
  priority: PriorityV3Output,
  swaps: SmartSwapOutput,
): RecoveryRoadmap {
  // Build a lookup from habitId → swap recommendation
  const swapMap = new Map(swaps.recommendations.map((s) => [s.habitId, s]));

  // Enrich priority rankings with resistance and monthly recovery
  const enriched = priority.rankings.map((r) => {
    const swap = swapMap.get(r.habitId);
    const habitProjectionRef = swap ?? null;
    return {
      habitId: r.habitId,
      habitName: r.habitName,
      reason: r.reason,
      resistance: resistanceScore(
        habitProjectionRef?.importance ?? 3,
      ),
      monthlyRecovery: habitProjectionRef?.monthlySaving ?? new Decimal(0),
    };
  });

  // Sort by resistance descending (easiest habits first)
  const byEase = [...enriched].sort((a, b) => b.resistance - a.resistance);

  // Day 30: up to 2 lowest-resistance habits
  const day30Habits = byEase.slice(0, 2);
  const day30Recovery = day30Habits.reduce(
    (s, h) => s.plus(h.monthlyRecovery), new Decimal(0),
  );

  // Day 90: next batch — medium resistance (skip those already in day30)
  const remainingAfter30 = byEase.slice(2);
  const day90Habits = remainingAfter30.slice(0, 3);
  const day90Recovery = day90Habits.reduce(
    (s, h) => s.plus(h.monthlyRecovery), new Decimal(0),
  );

  // Day 180: all remaining + cumulative total
  const day180Habits = remainingAfter30.slice(3);
  const allHabits = byEase; // all habits contribute to total recovery
  const totalRecovery = allHabits.reduce(
    (s, h) => s.plus(h.monthlyRecovery), new Decimal(0),
  );

  return {
    day30: {
      day: 30,
      objective: 'Awareness + first easy wins',
      focusHabits: day30Habits.map((h) => h.habitName),
      monthlyRecovery: day30Recovery,
    },
    day90: {
      day: 90,
      objective: 'Behavior stabilization',
      focusHabits: day90Habits.map((h) => h.habitName),
      monthlyRecovery: day90Recovery,
    },
    day180: {
      day: 180,
      objective: 'Permanent system & long-term reinvestment',
      focusHabits: day180Habits.map((h) => h.habitName),
      monthlyRecovery: day180Habits.reduce(
        (s, h) => s.plus(h.monthlyRecovery), new Decimal(0),
      ),
      totalMonthlyRecovery: totalRecovery,
    },
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function runRecoveryRoadmapEngine(
  _calcResult: ProCalculationResult,
  priority: PriorityV3Output,
  swaps: SmartSwapOutput,
): RecoveryRoadmap {
  return buildPhases(priority, swaps);
}
