import Decimal from 'decimal.js';
import type { ProCalculationResult } from './proCalculationEngine';
import type { PriorityResult } from './priorityEngine';
import type { SwapResult } from './swapRecommendationEngine';
import { roadmapPhases, type ProLang } from '@/lib/proI18n';

// ============================================================================
// ROADMAP ENGINE — Personalized recovery roadmap
// ============================================================================

export interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  description: string;
  targetHabits: string[];
  annualSavings: Decimal;
  projectionSavings: Decimal;
  cumulativeAnnualSavings: Decimal;
  cumulativeProjectionSavings: Decimal;
  timeframe: string;
}

export interface RecoverySummary {
  totalAnnualRecoverable: Decimal;
  totalProjectionRecoverable: Decimal;
  percentageRecoverable: Decimal;
  yearsToFinancialFreedom: Decimal | null;
  futureValueIfInvested: Decimal;
}

export interface RoadmapResult {
  phases: RoadmapPhase[];
  summary: RecoverySummary;
}

// ============================================================================
// PHASE GENERATION
// ============================================================================

function timeframeForDifficulty(difficulty: 'easy' | 'moderate' | 'hard', lang: ProLang): string {
  const tf = roadmapPhases[lang].timeframes;
  switch (difficulty) {
    case 'easy': return tf.easy;
    case 'moderate': return tf.moderate;
    case 'hard': return tf.hard;
  }
}

// ============================================================================
// PUBLIC API: buildRoadmap()
// ============================================================================

export function buildRoadmap(
  result: ProCalculationResult,
  priority: PriorityResult,
  swaps: SwapResult,
  lang: ProLang = 'en',
): RoadmapResult {
  const L = roadmapPhases[lang];
  // Group swaps into phases by difficulty
  const easySwaps = swaps.recommendations.filter((s) => s.difficulty === 'easy');
  const moderateSwaps = swaps.recommendations.filter((s) => s.difficulty === 'moderate');
  const hardSwaps = swaps.recommendations.filter((s) => s.difficulty === 'hard');

  const groups: { label: string; title: string; description: string; swaps: typeof swaps.recommendations }[] = [
    {
      label: 'easy',
      title: L.quickWins.title,
      description: L.quickWins.description,
      swaps: easySwaps,
    },
    {
      label: 'moderate',
      title: L.sustained.title,
      description: L.sustained.description,
      swaps: moderateSwaps,
    },
    {
      label: 'hard',
      title: L.deep.title,
      description: L.deep.description,
      swaps: hardSwaps,
    },
  ];

  let cumulativeAnnual = new Decimal(0);
  let cumulativeProjection = new Decimal(0);
  let phaseNumber = 0;

  const phases: RoadmapPhase[] = [];

  for (const group of groups) {
    if (group.swaps.length === 0) continue;
    phaseNumber++;

    const annualSavings = group.swaps.reduce((s, r) => s.plus(r.annualSavings), new Decimal(0));
    const projectionSavings = group.swaps.reduce((s, r) => s.plus(r.projectionSavings), new Decimal(0));
    cumulativeAnnual = cumulativeAnnual.plus(annualSavings);
    cumulativeProjection = cumulativeProjection.plus(projectionSavings);

    const timeframe = group.swaps.length > 0
      ? timeframeForDifficulty(group.swaps[0].difficulty, lang)
      : L.timeframes.ongoing;

    phases.push({
      phaseNumber,
      title: group.title,
      description: group.description,
      targetHabits: group.swaps.map((s) => s.habitName),
      annualSavings,
      projectionSavings,
      cumulativeAnnualSavings: cumulativeAnnual,
      cumulativeProjectionSavings: cumulativeProjection,
      timeframe,
    });
  }

  // If no phases were created (edge case), create at least one empty phase
  if (phases.length === 0 && swaps.recommendations.length > 0) {
    phaseNumber++;
    const allSwaps = swaps.recommendations;
    const annualSavings = allSwaps.reduce((s, r) => s.plus(r.annualSavings), new Decimal(0));
    const projectionSavings = allSwaps.reduce((s, r) => s.plus(r.projectionSavings), new Decimal(0));
    phases.push({
      phaseNumber,
      title: L.fallback.title,
      description: L.fallback.description,
      targetHabits: allSwaps.map((s) => s.habitName),
      annualSavings,
      projectionSavings,
      cumulativeAnnualSavings: annualSavings,
      cumulativeProjectionSavings: projectionSavings,
      timeframe: L.timeframes.immediate,
    });
  }

  // Recovery summary
  const totalAnnualRecoverable = swaps.totalAnnualSavings;
  const totalProjectionRecoverable = swaps.totalProjectionSavings;
  const percentageRecoverable = result.totals.projectionDirectCost.gt(0)
    ? totalProjectionRecoverable.dividedBy(result.totals.projectionDirectCost).times(100)
    : new Decimal(0);

  // Financial freedom calculation: how many years of redirected savings equal the annual direct cost
  let yearsToFinancialFreedom: Decimal | null = null;
  if (totalAnnualRecoverable.gt(0) && result.totals.annualDirectCost.gt(0)) {
    // Nest egg needed = annual direct cost × 25 (4% rule)
    const nestEgg = result.totals.annualDirectCost.times(25);
    yearsToFinancialFreedom = nestEgg.dividedBy(totalAnnualRecoverable);
  }

  // Future value of invested redirected savings
  const returnRate = result.investmentProjection.returnRate;
  let futureValueIfInvested = new Decimal(0);
  if (totalAnnualRecoverable.gt(0)) {
    if (returnRate.isZero()) {
      futureValueIfInvested = totalAnnualRecoverable.times(result.projectionYears);
    } else {
      const onePlusR = new Decimal(1).plus(returnRate);
      const powered = onePlusR.pow(result.projectionYears.toNumber());
      const factor = powered.minus(1).dividedBy(returnRate);
      futureValueIfInvested = totalAnnualRecoverable.times(factor);
    }
  }

  return {
    phases,
    summary: {
      totalAnnualRecoverable,
      totalProjectionRecoverable,
      percentageRecoverable,
      yearsToFinancialFreedom,
      futureValueIfInvested,
    },
  };
}
