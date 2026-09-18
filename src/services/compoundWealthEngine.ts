import Decimal from 'decimal.js';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// COMPOUND WEALTH ENGINE — V3.0 SPEC PART 14
// Hypothetical investment scenarios (NOT guaranteed returns)
// ============================================================================

export interface InvestmentScenario {
  id: string;
  name: string;
  annualReturn: Decimal;
}

export const DEFAULT_SCENARIOS: InvestmentScenario[] = [
  { id: 'conservative', name: 'Conservative', annualReturn: new Decimal('0.04') },
  { id: 'balanced', name: 'Balanced', annualReturn: new Decimal('0.07') },
  { id: 'growth', name: 'Growth', annualReturn: new Decimal('0.08') },
];

export const DEFAULT_HORIZONS: number[] = [10, 20, 30];

export interface InvestmentProjection {
  years: number;
  monthlyContribution: Decimal;
  totalContributions: Decimal;
  futureValue: Decimal;
  growthAmount: Decimal;
  scenario: string;
}

export interface CompoundWealthResult {
  projections: InvestmentProjection[];
  scenarios: InvestmentScenario[];
  horizons: number[];
  disclaimer: string;
}

// ============================================================================
// FORMULA: FV = P * ((1 + r/12)^(12*t) - 1) / (r/12)
// Where P = monthly contribution, r = annual return, t = years
// ============================================================================

function futureValueOfMonthlyContributions(
  monthlyContribution: Decimal,
  annualReturn: Decimal,
  years: number,
): Decimal {
  if (monthlyContribution.lte(0)) return new Decimal(0);
  if (annualReturn.isZero()) return monthlyContribution.times(years * 12);

  const monthlyRate = annualReturn.dividedBy(12);
  const months = years * 12;
  const onePlusR = new Decimal(1).plus(monthlyRate);
  const powered = onePlusR.pow(months);
  const numerator = powered.minus(1);
  const fv = monthlyContribution.times(numerator).dividedBy(monthlyRate);
  return fv;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function runCompoundWealthEngine(
  monthlyContribution: Decimal,
  scenarios: InvestmentScenario[] = DEFAULT_SCENARIOS,
  horizons: number[] = DEFAULT_HORIZONS,
): CompoundWealthResult {
  const projections: InvestmentProjection[] = [];

  for (const scenario of scenarios) {
    for (const years of horizons) {
      const fv = futureValueOfMonthlyContributions(monthlyContribution, scenario.annualReturn, years);
      const totalContributions = monthlyContribution.times(years * 12);
      const growthAmount = fv.minus(totalContributions);

      projections.push({
        years,
        monthlyContribution,
        totalContributions,
        futureValue: fv,
        growthAmount,
        scenario: scenario.id,
      });
    }
  }

  return {
    projections,
    scenarios,
    horizons,
    disclaimer: 'Hypothetical investment scenarios, not guaranteed returns.',
  };
}
