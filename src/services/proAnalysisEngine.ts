import Decimal from 'decimal.js';
import type { ProCalculationResult, UserFinancialProfile } from './proCalculationEngine';
import { proDefaultConfig, calculateProjectionYears } from './proCalculationEngine';
import {
  runCompoundWealthEngine,
  type CompoundWealthResult,
  type InvestmentScenario,
} from './compoundWealthEngine';
import { runPriorityV3Engine, type PriorityV3Output } from './priorityV3Engine';
import { runSmartSwapEngine, type SmartSwapOutput } from './smartSwapEngine';
import { runFireEngine, type FireImpact } from './fireEngine';
import { runRecoveryRoadmapEngine, type RecoveryRoadmap } from './recoveryRoadmapEngine';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// PRO ANALYSIS ENGINE — V3.0 AGGREGATOR (SPEC PART 19 + 20)
// Combines all V3 analytical engines into a single result with error isolation.
// If one module fails, the others still return valid results.
// ============================================================================

export interface ModuleError {
  module: string;
  message: string;
}

export interface ProAnalysisResult {
  investmentProjections: CompoundWealthResult | null;
  priorityRanking: PriorityV3Output | null;
  smartSwaps: SmartSwapOutput | null;
  fireImpact: FireImpact | null;
  roadmap: RecoveryRoadmap | null;
  errors: ModuleError[];
  projectionYears: Decimal;
}

// ============================================================================
// MONTHLY SAVINGS TARGET — derived from total annual direct cost
// This is the amount that "could be redirected" monthly if all habits
// were optimized. Used as the monthly contribution for compound wealth.
// ============================================================================

function deriveMonthlyContribution(calcResult: ProCalculationResult): Decimal {
  return calcResult.totals.annualDirectCost.dividedBy(12);
}

// ============================================================================
// PUBLIC API — runProAnalysis
// Each engine is wrapped in try/catch. A failure in one does NOT block others.
// ============================================================================

export function runProAnalysis(
  calcResult: ProCalculationResult,
  profile: UserFinancialProfile,
  scenarios?: InvestmentScenario[],
): ProAnalysisResult {
  const errors: ModuleError[] = [];
  const projectionYears = calcResult.projectionYears;

  // --- Compound Wealth Engine ---
  let investmentProjections: CompoundWealthResult | null = null;
  try {
    const monthlyContribution = deriveMonthlyContribution(calcResult);
    investmentProjections = runCompoundWealthEngine(monthlyContribution, scenarios);
  } catch {
    errors.push({
      module: 'compoundWealth',
      message: 'Investment simulation unavailable.',
    });
  }

  // --- Priority V3 Engine ---
  let priorityRanking: PriorityV3Output | null = null;
  try {
    priorityRanking = runPriorityV3Engine(calcResult);
  } catch {
    errors.push({
      module: 'priority',
      message: 'Priority ranking unavailable.',
    });
  }

  // --- Smart Swap Engine ---
  let smartSwaps: SmartSwapOutput | null = null;
  try {
    smartSwaps = runSmartSwapEngine(calcResult);
  } catch {
    errors.push({
      module: 'smartSwap',
      message: 'Swap recommendations unavailable.',
    });
  }

  // --- FIRE Engine ---
  let fireImpact: FireImpact | null = null;
  try {
    const annualRecovered = smartSwaps
      ? smartSwaps.totalAnnualRecovery
      : new Decimal(0);
    fireImpact = runFireEngine(profile, annualRecovered);
  } catch {
    errors.push({
      module: 'fire',
      message: 'FIRE calculation unavailable.',
    });
  }

  // --- Recovery Roadmap Engine ---
  let roadmap: RecoveryRoadmap | null = null;
  try {
    if (priorityRanking && smartSwaps) {
      roadmap = runRecoveryRoadmapEngine(calcResult, priorityRanking, smartSwaps);
    } else {
      throw new Error('roadmap inputs unavailable');
    }
  } catch {
    errors.push({
      module: 'roadmap',
      message: 'Recovery roadmap unavailable.',
    });
  }

  return {
    investmentProjections,
    priorityRanking,
    smartSwaps,
    fireImpact,
    roadmap,
    errors,
    projectionYears,
  };
}

// ============================================================================
// CONVENIENCE: Full pipeline from raw ProCalculationInput → ProAnalysisResult
// ============================================================================

export { proDefaultConfig, calculateProjectionYears };
