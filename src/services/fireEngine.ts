import Decimal from 'decimal.js';
import type { UserFinancialProfile } from './proCalculationEngine';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// FIRE ENGINE — V3.0 SPEC PART 17
// Financial Independence Acceleration Engine (Rule of 25)
// ============================================================================

export interface FireImpact {
  annualRecovered: Decimal;
  potentialPortfolioImpact: Decimal;
  status: 'CALCULATED' | 'INSUFFICIENT_DATA';
}

// ============================================================================
// REQUIRED INPUTS (spec 17.2):
//   - Monthly income
//   - Current savings rate
//   - Monthly savings target (derived from recovered savings)
//
// If any are missing → return INSUFFICIENT_DATA (never estimate)
// ============================================================================

export function runFireEngine(
  profile: UserFinancialProfile,
  totalAnnualRecoveredSavings: Decimal,
): FireImpact {
  const hasMonthlyIncome = profile.monthlyIncome && profile.monthlyIncome.isFinite() && profile.monthlyIncome.gt(0);
  const hasSavingsRate = profile.currentSavingsRate !== undefined
    && profile.currentSavingsRate.isFinite()
    && profile.currentSavingsRate.gte(0);

  if (!hasMonthlyIncome || !hasSavingsRate) {
    return {
      annualRecovered: new Decimal(0),
      potentialPortfolioImpact: new Decimal(0),
      status: 'INSUFFICIENT_DATA',
    };
  }

  if (totalAnnualRecoveredSavings.lte(0)) {
    return {
      annualRecovered: new Decimal(0),
      potentialPortfolioImpact: new Decimal(0),
      status: 'CALCULATED',
    };
  }

  // Rule of 25: Portfolio Impact = RecoveredAnnualSavings * 25
  const portfolioImpact = totalAnnualRecoveredSavings.times(25);

  return {
    annualRecovered: totalAnnualRecoveredSavings,
    potentialPortfolioImpact: portfolioImpact,
    status: 'CALCULATED',
  };
}
