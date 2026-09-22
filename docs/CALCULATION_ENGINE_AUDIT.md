# Calculation Engine Audit — Complete Technical Documentation

**Scope**: Every calculated metric in the Hidden Cost application, documented exactly as implemented. No improvements proposed.

**Arithmetic system**: Two parallel systems coexist:
- **Legacy simulator** (`src/lib/calculations.ts`): native JavaScript `number` math.
- **Pro engines** (`src/services/*Engine.ts`): `decimal.js` at precision 30, rounding `ROUND_HALF_UP`, avoiding floating-point drift.

---

## Table of Contents

1. [Legacy Simulator Metrics](#1-legacy-simulator-metrics)
2. [Reality Check Engine Metrics](#2-reality-check-engine-metrics)
3. [Pro Calculation Engine Metrics](#3-pro-calculation-engine-metrics)
4. [Compound Wealth Engine Metrics](#4-compound-wealth-engine-metrics)
5. [Priority V3 Engine Metrics](#5-priority-v3-engine-metrics)
6. [Legacy Priority Engine Metrics](#6-legacy-priority-engine-metrics)
7. [Smart Swap Engine Metrics](#7-smart-swap-engine-metrics)
8. [Swap Recommendation Engine Metrics](#8-swap-recommendation-engine-metrics)
9. [FIRE Engine Metrics](#9-fire-engine-metrics)
10. [Recovery Roadmap (V3) Engine Metrics](#10-recovery-roadmap-v3-engine-metrics)
11. [Legacy Roadmap Engine Metrics](#11-legacy-roadmap-engine-metrics)
12. [Pro Analysis Aggregator Metrics](#12-pro-analysis-aggregator-metrics)
13. [Challenge / Share Card Metrics](#13-challenge--share-card-metrics)
14. [PDF Report Metrics](#14-pdf-report-metrics)

---

## 1. Legacy Simulator Metrics

**Source file**: `src/lib/calculations.ts`

### 1.1 Hourly Income

| Field | Value |
|---|---|
| **Purpose** | Converts monthly salary to an hourly wage for time-cost calculations |
| **Function** | `calculateHourlyIncome(monthlyIncome)` |
| **Formula** | `hourlyIncome = monthlyIncome / 176` |
| **Variables** | `monthlyIncome` — user's monthly salary (number) |
| **Constants** | `176` — assumed working hours per month (22 days × 8 hours) |
| **Assumptions** | 22 working days/month, 8-hour workday. No part-time adjustment. |
| **Units** | Currency per hour |
| **Input validation** | Returns `0` if `monthlyIncome <= 0` |
| **Output format** | `number` (unrounded) |
| **Example** | `monthlyIncome = 4000` → `4000 / 176 = 22.727...` |
| **Components using** | `calculateResult` (all decision types), `getBreakdownData` |
| **Dependencies** | None |
| **Related** | Financial Work Hours (1.6) uses this as a divisor |

### 1.2 Financial Score

| Field | Value |
|---|---|
| **Purpose** | Measures how large a purchase/cost is relative to monthly income |
| **Function** | `calculateFinancialScore(cost, monthlyIncome)` |
| **Formula** | `financialScore = clamp(cost / monthlyIncome × 100, 0, 100)` |
| **Variables** | `cost` — purchase price or entertainment cost (number); `monthlyIncome` (number) |
| **Constants** | `100` (max), `0` (min) |
| **Assumptions** | Score is the percentage of one month's income consumed by the cost |
| **Units** | Percentage (0–100) |
| **Input validation** | Returns `0` if `monthlyIncome <= 0`; clamped to [0, 100] |
| **Output format** | `number` (unrounded, clamped) |
| **Example** | `cost = 500, monthlyIncome = 4000` → `500/4000×100 = 12.5` |
| **Components using** | `calculateResult` for purchase & entertainment decisions |
| **Dependencies** | None |
| **Related** | Overall Score (1.7), monthlyIncomePercent field |

### 1.3 Time Score

| Field | Value |
|---|---|
| **Purpose** | Measures how much free time is consumed by the activity |
| **Function** | `calculateTimeScore(hours, weeklyFreeHours)` |
| **Formula** | `timeScore = clamp(hours / weeklyFreeHours × 100, 0, 100)` |
| **Variables** | `hours` — hours consumed (number); `weeklyFreeHours = freeHoursPerDay × 7` |
| **Constants** | `100` (max), `0` (min) |
| **Assumptions** | Free time is `freeHoursPerDay × 7` hours per week. For extra_work, `hours` = `hoursPerWeek`. For entertainment, `hours` = `durationHours`. For purchase, `hours` = 0 (time score = 0). |
| **Units** | Percentage (0–100) |
| **Input validation** | Returns `100` if `weeklyFreeHours <= 0` (worst case) |
| **Output format** | `number` (unrounded, clamped) |
| **Example** | `hours = 10, weeklyFreeHours = 40` → `10/40×100 = 25` |
| **Components using** | `calculateResult` (all decision types) |
| **Dependencies** | None |
| **Related** | Overall Score (1.7) |

### 1.4 Motivation Score

| Field | Value |
|---|---|
| **Purpose** | Scores the psychological vulnerability of the purchase motivation |
| **Function** | Direct lookup: `motivationFactors[motivation]` |
| **Formula** | Fixed mapping — no calculation |
| **Variables** | `motivation` — one of `genuine`, `fomo`, `boredom`, `emotional` |
| **Constants** | `motivationFactors = { genuine: 15, fomo: 75, boredom: 65, emotional: 85 }` |
| **Assumptions** | Genuine needs score low; emotional spending scores highest |
| **Units** | Points (1–100 scale) |
| **Input validation** | Guaranteed by enum; no fallback |
| **Output format** | `number` (constant) |
| **Example** | `motivation = 'emotional'` → `85` |
| **Components using** | `calculateResult` (all decision types) |
| **Dependencies** | None |
| **Related** | Overall Score (1.7) |

### 1.5 Weekly Free Hours

| Field | Value |
|---|---|
| **Purpose** | Total discretionary hours per week |
| **Function** | Inline in `calculateResult`: `state.freeHoursPerDay × 7` |
| **Formula** | `weeklyFreeHours = freeHoursPerDay × 7` |
| **Variables** | `freeHoursPerDay` — user-input (number, ≥ 0) |
| **Constants** | `7` — days per week |
| **Assumptions** | Every day has the same amount of free time |
| **Units** | Hours per week |
| **Input validation** | `calculateResult` returns `null` if `!state.freeHoursPerDay` (falsy, includes 0) |
| **Output format** | `number` |
| **Example** | `freeHoursPerDay = 6` → `42` |
| **Components using** | `calculateResult`, Time Score (1.3), Time Consumption Percent (1.9) |
| **Dependencies** | None |

### 1.6 Financial Work Hours

| Field | Value |
|---|---|
| **Purpose** | How many labor hours are required to pay for the cost |
| **Function** | Inline in `calculateResult` (purchase & entertainment only) |
| **Formula** | `financialWorkHours = cost / hourlyIncome` (if `hourlyIncome > 0`, else `0`) |
| **Variables** | `cost` — `state.price` (purchase) or `state.cost` (entertainment); `hourlyIncome` from 1.1 |
| **Constants** | None |
| **Assumptions** | Pre-tax wages; no benefits or deductions |
| **Units** | Hours |
| **Input validation** | Division guarded against zero hourly income |
| **Output format** | `number` (unrounded) |
| **Example** | `cost = 500, hourlyIncome = 22.73` → `22.0` hours |
| **Components using** | `SimulationResult.financialWorkHours`, `getBreakdownData`, `generateQuote` |
| **Dependencies** | Hourly Income (1.1) |
| **Related** | Hidden Time Cost (1.11), Time Consumption Percent (1.9) |

### 1.7 Overall Hidden Cost Score

| Field | Value |
|---|---|
| **Purpose** | Composite score representing the "hidden cost" severity |
| **Function** | `calculateResult` → `clampScore(...)` |
| **Formula (purchase/entertainment)** | `score = clamp(financialScore × 0.35 + timeScore × 0.35 + motivationScore × 0.30)` |
| **Formula (extra_work)** | `score = clamp(timeScore × 0.50 + motivationScore × 0.25 + financialScore × 0.25)` |
| **Variables** | `financialScore` (1.2), `timeScore` (1.3), `motivationScore` (1.4) |
| **Constants** | Weights: `0.35/0.35/0.30` (purchase/entertainment), `0.50/0.25/0.25` (extra_work) |
| **Assumptions** | Time dominates the extra_work score; financial and time are equal for purchases |
| **Units** | Points (1–100, integer) |
| **Input validation** | `clampScore` rounds to nearest integer and clamps to [1, 100] |
| **Output format** | `number` (integer 1–100) |
| **Example** | `fin=12.5, time=25, mot=85` (purchase) → `12.5×0.35 + 25×0.35 + 85×0.30 = 4.375 + 8.75 + 25.5 = 38.625` → `39` |
| **Components using** | `SimulationResult.score`, `StoryCard`, `Challenge`, `ShareCard` |
| **Dependencies** | Financial Score (1.2), Time Score (1.3), Motivation Score (1.4) |
| **Related** | Level (1.8) |

### 1.8 Level Classification

| Field | Value |
|---|---|
| **Purpose** | Assigns a severity label to the score |
| **Function** | `levelFor(score, decisionType)` |
| **Formula** | **extra_work**: `<25 → 'light'`, `<50 → 'moderate'`, `<75 → 'heavy'`, `≥75 → 'extreme'` |
| | **other**: `<25 → 'low'`, `<50 → 'moderate'`, `<75 → 'high'`, `≥75 → 'extreme'` |
| **Variables** | `score` (1–100), `decisionType` |
| **Constants** | Thresholds: 25, 50, 75 |
| **Assumptions** | Different label sets for work vs. spending decisions |
| **Units** | String label |
| **Input validation** | None (score is pre-clamped) |
| **Output format** | `string` |
| **Example** | `score = 39, decisionType = 'purchase'` → `'moderate'` |
| **Components using** | `SimulationResult.level`, challenge payload |
| **Dependencies** | Overall Score (1.7) |

### 1.9 Time Consumption Percent

| Field | Value |
|---|---|
| **Purpose** | Percentage of weekly free time consumed |
| **Function** | Inline in `calculateResult` |
| **Formula (entertainment)** | `max(duration/weeklyFreeHours×100, financialWorkHours/40×100)`, both clamped to [0,100] |
| **Formula (purchase)** | `min(100, financialWorkHours / 40 × 100)` |
| **Formula (extra_work)** | `min(100, hoursPerWeek / weeklyFreeHours × 100)` |
| **Variables** | `duration` (entertainment hours), `financialWorkHours` (1.6), `weeklyFreeHours` (1.5), `hoursPerWeek` |
| **Constants** | `40` — `STANDARD_WEEKLY_FREE_HOURS` benchmark for purchase path |
| **Assumptions** | Entertainment uses the greater of direct-time or work-hours-equivalent; purchase uses 40h benchmark |
| **Units** | Percentage (0–100) |
| **Input validation** | All branches clamped to 100; entertainment guards `weeklyFreeHours > 0` |
| **Output format** | `number` (unrounded, 0–100) |
| **Example** | `financialWorkHours = 22, decisionType = 'purchase'` → `22/40×100 = 55` |
| **Components using** | `SimulationResult.timeConsumptionPercent`, `generateQuote` |
| **Dependencies** | Financial Work Hours (1.6), Weekly Free Hours (1.5) |

### 1.10 Monthly Equivalent (extra_work only)

| Field | Value |
|---|---|
| **Purpose** | Normalizes extra income to a monthly figure |
| **Function** | Inline in `calculateResult` |
| **Formula** | If `frequency = 'weekly'`: `monthlyEquivalent = extraIncome × 52 / 12` |
| | If `frequency = 'monthly'`: `monthlyEquivalent = extraIncome` |
| **Variables** | `extraIncome`, `frequency` |
| **Constants** | `52` weeks/year, `12` months/year |
| **Assumptions** | 52-week year (no 52.14 adjustment) |
| **Units** | Currency per month |
| **Input validation** | None beyond `calculateResult` guards |
| **Output format** | `number` (unrounded) |
| **Example** | `extraIncome = 200/week` → `200 × 52 / 12 = 866.67` |
| **Components using** | `SimulationResult.monthlyEquivalent`, `generateQuote` |
| **Dependencies** | None |
| **Related** | Effective Hourly Rate (1.12), Financial Score for extra_work |

### 1.11 Effective Hourly Rate (extra_work only)

| Field | Value |
|---|---|
| **Purpose** | Actual hourly wage from the extra work |
| **Function** | Inline in `calculateResult` |
| **Formula** | `effectiveHourlyRate = weeklyEquivalent / hoursPerWeek` (if `hoursPerWeek > 0`, else `0`) |
| **Variables** | `weeklyEquivalent` — `extraIncome` (weekly) or `extraIncome / 4.33` (monthly); `hoursPerWeek` |
| **Constants** | `4.33` — weeks per month approximation |
| **Assumptions** | 4.33 weeks per month for monthly→weekly conversion |
| **Units** | Currency per hour |
| **Input validation** | Division guarded against zero |
| **Output format** | `number` (unrounded) |
| **Example** | `extraIncome = 200/week, hoursPerWeek = 10` → `200/10 = 20` |
| **Components using** | `SimulationResult.effectiveHourlyRate` |
| **Dependencies** | Monthly Equivalent (1.10) |

### 1.12 Breakdown Data — Hidden Time Cost

| Field | Value |
|---|---|
| **Purpose** | Monetary value of the time "hidden" in a purchase |
| **Function** | `getBreakdownData(result, state)` |
| **Formula** | `hiddenTimeCost = financialWorkHours × hourlyIncome × (motivationScore / 100)` |
| **Variables** | `financialWorkHours` (1.6), `hourlyIncome` (1.1), `motivationScore` (1.4) |
| **Constants** | `100` — to convert motivation score from percentage to fraction |
| **Assumptions** | Higher motivation vulnerability → more "hidden" time cost. Uses `hourly = 1` as fallback when `hourlyIncome = 0`. |
| **Units** | Currency |
| **Input validation** | `hourlyIncome` falls back to 1 to avoid zero-multiplication |
| **Output format** | `number` (rounded via `Math.round`) |
| **Example** | `workHours = 22, hourly = 22.73, motivation = 85` → `22 × 22.73 × 0.85 = 424.8` → `425` |
| **Components using** | `BreakdownData.hiddenTimeCost`, StoryCard breakdown chart |
| **Dependencies** | Financial Work Hours (1.6), Hourly Income (1.1), Motivation Score (1.4) |

### 1.13 Breakdown Data — Opportunity Cost (5-year)

| Field | Value |
|---|---|
| **Purpose** | Foregone investment returns if the money were invested at 7% for 5 years |
| **Function** | `getBreakdownData(result, state)` |
| **Formula** | `opportunityCost = basePrice × ((1.07)^5 − 1)` |
| **Variables** | `basePrice` — `state.price` (purchase), `state.cost` (entertainment), `state.extraIncome` (extra_work) |
| **Constants** | `1.07` — assumed 7% annual return; `5` — 5-year horizon |
| **Assumptions** | Single lump-sum investment at 7% annual return, compounded once yearly for 5 years. This is the *gain* only (not the future value). |
| **Units** | Currency |
| **Input validation** | None |
| **Output format** | `number` (rounded via `Math.round`) |
| **Example** | `basePrice = 500` → `500 × (1.07^5 − 1) = 500 × 0.40255 = 201.3` → `201` |
| **Components using** | `BreakdownData.opportunityCost`, StoryCard breakdown chart |
| **Dependencies** | None |

### 1.14 Score Clamp

| Field | Value |
|---|---|
| **Purpose** | Normalizes a raw score to the 1–100 integer range |
| **Function** | `clampScore(value)` |
| **Formula** | `Math.min(100, Math.max(1, Math.round(value)))` |
| **Variables** | `value` — raw composite score |
| **Constants** | `100` (max), `1` (min) |
| **Assumptions** | Minimum score is 1, not 0 (avoids "zero hidden cost" display) |
| **Units** | Points (1–100, integer) |
| **Output format** | `number` (integer) |
| **Example** | `value = 38.625` → `39` |

### 1.15 Title Key

| Field | Value |
|---|---|
| **Purpose** | Assigns a persona title based on decision type and motivation |
| **Function** | `titleFor(decisionType, motivation)` |
| **Formula** | Direct lookup from a 3×4 matrix of string keys |
| **Variables** | `decisionType`, `motivation` |
| **Constants** | 12 title keys (e.g., `fomo_taxpayer`, `emotional_checkout`, `strategic_hustler`) |
| **Output format** | `string` (title key for i18n lookup) |
| **Example** | `purchase + fomo` → `'fomo_taxpayer'` |

---

## 2. Reality Check Engine Metrics

**Source file**: `src/lib/realityCheck.ts` → delegates to `src/services/calculationEngine.ts`

### 2.1 Reality Check Adapter

| Field | Value |
|---|---|
| **Purpose** | Bridges the Reality Check UI state to the Decimal.js calculation engine |
| **Function** | `buildEngineInput(state)` / `runCalculation(state)` |
| **Formula** | Maps `RealityCheckState` → `CalculationInput` with `Decimal` conversions |
| **Variables** | `state.habits` (cost, timeLost, frequencies), `state.monthlyIncome`, `state.monthlyBaselineExpenses`, `state.workHoursPerWeek` |
| **Constants** | `lifetimeYears = 10` (hardcoded) |
| **Assumptions** | Frequency mapping: `daily → Daily`, `weekly → Weekly`, `monthly → Monthly`. No `Yearly` option in Reality Check. |
| **Units** | Varies (currency, hours) |
| **Input validation** | `h.cost || 0`, `h.timeLost || 0` — falsy values become 0 |
| **Output format** | `CalculationInput` (Decimal-typed) |
| **Components using** | `RealityCheck` component |
| **Dependencies** | `calculationEngine.calculate()` |

### 2.2 Initial Reality State Defaults

| Field | Value |
|---|---|
| **Constants** | `hourlyWage: 25`, `monthlyIncome: 4000`, `monthlyBaselineExpenses: 1500`, `workHoursPerWeek: 40`, `lifetimeYears: 10` |

---

## 3. Pro Calculation Engine Metrics

**Source file**: `src/services/proCalculationEngine.ts`

**Configuration** (`proDefaultConfig`):

| Constant | Value |
|---|---|
| `DaysPerYear` | `365.25` |
| `WeeksPerYear` | `365.25 / 7 = 52.178...` |
| `MonthsPerYear` | `12` |
| `DefaultProjectionYears` | `10` |
| `MaxProjectionYears` | `50` |
| `MinProjectionYears` | `10` |
| `AssumedLifespanAge` | `80` |
| `DefaultInvestmentReturnRate` | `0.07` (7%) |

### 3.1 Pro Hourly Value of Time

| Field | Value |
|---|---|
| **Purpose** | Precise hourly wage from annual income / annual work hours |
| **Function** | `calculateHourlyValue(profile, config)` |
| **Formula** | `hourlyValue = (monthlyIncome × 12) / (weeklyWorkHours × (365.25 / 7))` |
| **Variables** | `profile.monthlyIncome`, `profile.weeklyWorkHours` |
| **Constants** | `12` months, `365.25/7` weeks/year |
| **Assumptions** | Full-year work; no vacation deduction |
| **Units** | Currency per hour (Decimal) |
| **Input validation** | Throws `ProCalculationError` if `annualWorkHours <= 0` |
| **Output format** | `Decimal` |
| **Example** | `monthlyIncome = 4000, weeklyWorkHours = 40` → `48000 / 2087.14 = 22.998...` |
| **Components using** | All Pro habit projections, time opportunity cost |
| **Dependencies** | None |
| **Related** | Time Opportunity Cost (3.6) |

### 3.2 Projection Years

| Field | Value |
|---|---|
| **Purpose** | Years over which habit costs are projected |
| **Function** | `calculateProjectionYears(profile, config)` |
| **Formula** | If `age` provided: `clamp(80 − age, 10, 50)`; else `10` |
| **Variables** | `profile.age` (optional) |
| **Constants** | `AssumedLifespanAge = 80`, `MinProjectionYears = 10`, `MaxProjectionYears = 50` |
| **Assumptions** | Lifespan of 80 years; minimum 10-year projection even for older users |
| **Units** | Years (Decimal) |
| **Input validation** | `age > 0` required; otherwise uses default |
| **Output format** | `Decimal` |
| **Example** | `age = 30` → `80 − 30 = 50` → clamped to `50`; `age = 72` → `80 − 72 = 8` → clamped to `10` |
| **Components using** | All projection calculations in the Pro engine |
| **Dependencies** | None |

### 3.3 Pro Annual Cost (per habit)

| Field | Value |
|---|---|
| **Purpose** | Normalizes a habit's cost to an annual figure |
| **Function** | `convertToAnnual(value, frequency, config)` |
| **Formula** | `daily: value × 365.25`; `weekly: value × (365.25/7)`; `monthly: value × 12`; `yearly: value` |
| **Variables** | `habit.costAmount`, `habit.costFrequency` |
| **Constants** | `365.25`, `365.25/7`, `12` |
| **Assumptions** | 365.25 days/year accounts for leap years |
| **Units** | Currency per year (Decimal) |
| **Input validation** | Throws on unknown frequency |
| **Output format** | `Decimal` |
| **Example** | `$5/day coffee` → `5 × 365.25 = 1826.25` |
| **Components using** | `HabitProjection.annualCost`, `ProTotalsResult.annualDirectCost` |
| **Dependencies** | None |

### 3.4 Pro Annual Hours (per habit)

| Field | Value |
|---|---|
| **Purpose** | Normalizes a habit's time consumption to annual hours |
| **Function** | `convertToAnnual(value, frequency, config)` |
| **Formula** | Same frequency conversion as 3.3, applied to `timeAmount` |
| **Variables** | `habit.timeAmount`, `habit.timeFrequency` |
| **Units** | Hours per year (Decimal) |
| **Example** | `1 hour/day` → `1 × 365.25 = 365.25` |
| **Components using** | `HabitProjection.annualHours`, `ProTotalsResult.annualHours` |
| **Dependencies** | None |

### 3.5 Projection Cost (per habit)

| Field | Value |
|---|---|
| **Purpose** | Total cost of a habit over the projection horizon |
| **Function** | Inline in `proCalculate` |
| **Formula** | `projectionCost = annualCost × projectionYears` |
| **Variables** | `annualCost` (3.3), `projectionYears` (3.2) |
| **Units** | Currency (Decimal) |
| **Example** | `annualCost = 1826.25, projectionYears = 10` → `18262.50` |
| **Components using** | `HabitProjection.projectionCost`, `directFinancialCost` |

### 3.6 Time Opportunity Cost (per habit)

| Field | Value |
|---|---|
| **Purpose** | Monetary value of time lost to a habit |
| **Function** | Inline in `proCalculate` |
| **Formula** | `timeOpportunityCost = projectionHours × hourlyValue` |
| **Variables** | `projectionHours = annualHours × projectionYears`, `hourlyValue` (3.1) |
| **Units** | Currency (Decimal) |
| **Example** | `projectionHours = 3652.5, hourlyValue = 23` → `83957.50` |
| **Components using** | `HabitProjection.timeOpportunityCost`, Priority & Swap engines |

### 3.7 Combined Cost (per habit)

| Field | Value |
|---|---|
| **Purpose** | Total hidden cost: direct money + time opportunity |
| **Function** | Inline in `proCalculate` |
| **Formula** | `combinedCost = directFinancialCost + timeOpportunityCost` |
| **Variables** | `directFinancialCost = projectionCost` (3.5), `timeOpportunityCost` (3.6) |
| **Units** | Currency (Decimal) |
| **Example** | `direct = 18262.50, time = 83957.50` → `102220.00` |
| **Components using** | `HabitProjection.combinedCost`, percentage calculation, Priority V3, Swap engines |

### 3.8 Percentage of Total (per habit)

| Field | Value |
|---|---|
| **Purpose** | Each habit's share of total combined cost |
| **Function** | Inline in `proCalculate` |
| **Formula** | `percentageOfTotal = (combinedCost / totalProjectionCombinedCost) × 100` |
| **Variables** | `combinedCost` (3.7), `totalProjectionCombinedCost` (3.13) |
| **Units** | Percentage (Decimal, unrounded) |
| **Input validation** | Only computed if `totalProjectionCombinedCost > 0`; otherwise 0 |
| **Example** | `combined = 102220, total = 250000` → `40.888%` |

### 3.9 Pro Annual Direct Cost (total)

| Field | Value |
|---|---|
| **Purpose** | Total money spent across all habits per year |
| **Function** | Inline in `proCalculate` |
| **Formula** | `totalAnnualDirectCost = Σ(habit.annualCost)` — sum of parts, not `Σ × years` |
| **Units** | Currency per year (Decimal) |
| **Note** | Summed from individual annual costs to avoid precision divergence |

### 3.10 Pro Annual Time Opportunity Cost (total)

| Field | Value |
|---|---|
| **Purpose** | Total monetary value of time lost per year |
| **Function** | Inline in `proCalculate` |
| **Formula** | `totalAnnualTimeOpportunityCost = Σ(habit.annualHours × hourlyValue)` |
| **Units** | Currency per year (Decimal) |

### 3.11 Pro Annual Combined Cost (total)

| Field | Value |
|---|---|
| **Formula** | `totalAnnualCombinedCost = totalAnnualDirectCost + totalAnnualTimeOpportunityCost` |
| **Units** | Currency per year (Decimal) |

### 3.12 Pro Projection Totals

| Field | Value |
|---|---|
| **Formula** | `totalProjectionDirectCost = Σ(habit.projectionCost)` |
| | `totalProjectionHours = Σ(habit.projectionHours)` |
| | `totalProjectionTimeOpportunityCost = Σ(habit.timeOpportunityCost)` |
| | `totalProjectionCombinedCost = Σ(habit.combinedCost)` |
| **Note** | All totals are sums of per-habit parts, not `annual × projectionYears`, to preserve precision-30 exactness |

### 3.13 Pro Days Lost

| Field | Value |
|---|---|
| **Purpose** | Total projection hours expressed in days |
| **Function** | Inline in `proCalculate` |
| **Formula** | `daysLost = totalProjectionHours / 365.25` |
| **Constants** | `365.25` |
| **Units** | Days (Decimal) |
| **Example** | `totalProjectionHours = 3652.5` → `10.0` days |

### 3.14 Pro Years Lost

| Field | Value |
|---|---|
| **Formula** | `yearsLost = daysLost / 365.25` |
| **Units** | Years (Decimal) |
| **Example** | `daysLost = 3652.5` → `10.0` years |

### 3.15 Pro Investment Projection (Future Value)

| Field | Value |
|---|---|
| **Purpose** | Future value if the annual direct cost were invested instead |
| **Function** | `calculateInvestmentProjection(annualDirectCost, returnRate, projectionYears)` |
| **Formula** | `FV = PMT × [((1 + r)^n − 1) / r]` (future value of an annuity) |
| | If `r = 0`: `FV = PMT × n` |
| **Variables** | `PMT = annualDirectCost`, `r = returnRate` (default 0.07), `n = projectionYears` |
| **Constants** | `DefaultInvestmentReturnRate = 0.07` |
| **Assumptions** | Ordinary annuity (end-of-period payments), annual compounding |
| **Units** | Currency (Decimal) |
| **Example** | `PMT = 1826.25, r = 0.07, n = 10` → `1826.25 × [((1.07)^10 − 1) / 0.07]` = `1826.25 × 13.8164` = `25234.9` |
| **Components using** | `ProCalculationResult.investmentProjection`, roadmap engine |
| **Related** | Compound Wealth Engine (§4) uses a monthly variant |

---

## 4. Compound Wealth Engine Metrics

**Source file**: `src/services/compoundWealthEngine.ts`

### 4.1 Future Value of Monthly Contributions

| Field | Value |
|---|---|
| **Purpose** | Projects the future value of redirecting habit money into investments |
| **Function** | `futureValueOfMonthlyContributions(monthlyContribution, annualReturn, years)` |
| **Formula** | `FV = P × ((1 + r/12)^(12×t) − 1) / (r/12)` |
| | If `r = 0`: `FV = P × t × 12` |
| **Variables** | `P = monthlyContribution`, `r = annualReturn`, `t = years` |
| **Constants** | `12` — compounding periods per year |
| **Assumptions** | Monthly compounding, end-of-period contributions (ordinary annuity) |
| **Units** | Currency (Decimal) |
| **Input validation** | Returns `0` if `monthlyContribution <= 0` |
| **Output format** | `Decimal` |
| **Example** | `P = 152, r = 0.07, t = 10` → `152 × ((1.005833)^120 − 1) / 0.005833` ≈ `26358` |
| **Components using** | `CompoundWealthResult.projections` |
| **Dependencies** | None |

### 4.2 Total Contributions

| Field | Value |
|---|---|
| **Formula** | `totalContributions = monthlyContribution × years × 12` |
| **Units** | Currency (Decimal) |

### 4.3 Growth Amount

| Field | Value |
|---|---|
| **Formula** | `growthAmount = futureValue − totalContributions` |
| **Units** | Currency (Decimal) |

### 4.4 Investment Scenarios

| Scenario | `annualReturn` |
|---|---|
| Conservative | `0.04` (4%) |
| Balanced | `0.07` (7%) |
| Growth | `0.08` (8%) |

### 4.5 Default Horizons

| Constant | Value |
|---|---|
| `DEFAULT_HORIZONS` | `[10, 20, 30]` years |

### 4.6 Monthly Contribution Derivation

| Field | Value |
|---|---|
| **Purpose** | Derives the monthly investable amount from annual direct cost |
| **Function** | `deriveMonthlyContribution(calcResult)` in `proAnalysisEngine.ts` |
| **Formula** | `monthlyContribution = annualDirectCost / 12` |
| **Assumptions** | The entire annual direct cost is redirectable (optimistic upper bound) |

---

## 5. Priority V3 Engine Metrics

**Source file**: `src/services/priorityV3Engine.ts`

### 5.1 Priority Score

| Field | Value |
|---|---|
| **Purpose** | Ranks habits by a blend of financial impact, time impact, and ease of change |
| **Function** | `runPriorityV3Engine(result)` |
| **Formula** | `PriorityScore_i = (0.6 × CS_i + 0.4 × TS_i) × IW_i` |
| **Variables** | `CS_i` (financial weight), `TS_i` (time weight), `IW_i` (resistance factor) |
| **Constants** | `FINANCIAL_WEIGHT = 0.6`, `TIME_WEIGHT = 0.4` |
| **Assumptions** | Financial impact is 1.5× more important than time impact; easier habits rank higher |
| **Units** | Dimensionless score (Decimal, 0–1 range) |
| **Output format** | `Decimal` |
| **Example** | `CS = 0.5, TS = 0.3, IW = 0.8` → `(0.6×0.5 + 0.4×0.3) × 0.8 = (0.30 + 0.12) × 0.8 = 0.336` |
| **Components using** | `PriorityV3Output.rankings`, Recovery Roadmap V3 |
| **Dependencies** | `ProCalculationResult` totals |

### 5.2 Financial Weight (CS)

| Field | Value |
|---|---|
| **Formula** | `CS_i = habit.annualCost / totalAnnualDirectCost` (if total > 0, else 0) |
| **Units** | Fraction (0–1) |

### 5.3 Time Weight (TS)

| Field | Value |
|---|---|
| **Formula** | `TS_i = habit.annualHours / totalAnnualHours` (if total > 0, else 0) |
| **Units** | Fraction (0–1) |

### 5.4 Resistance Factor (IW)

| Field | Value |
|---|---|
| **Formula** | `IW_i = (6 − importance_i) / 5` |
| **Variables** | `importance` — integer 1–5 |
| **Constants** | `6`, `5` |
| **Assumptions** | Importance 1 → IW = 1.0 (easiest to change); Importance 5 → IW = 0.2 (hardest) |
| **Units** | Fraction (0.2–1.0) |
| **Example** | `importance = 3` → `(6−3)/5 = 0.6` |

### 5.5 Priority Reason Text

| Field | Value |
|---|---|
| **Purpose** | Human-readable explanation for the priority ranking |
| **Function** | `buildReason(habit, cs, ts, iw)` |
| **Logic** | Branches on `IW` thresholds (`≥0.8`, `≥0.4`, `<0.4`) and percentage thresholds (`finPct ≥ 30`, `timePct ≥ 30/40`) |
| **Output** | One of 7 fixed English strings |

---

## 6. Legacy Priority Engine Metrics

**Source file**: `src/services/priorityEngine.ts`

### 6.1 Impact Score

| Field | Value |
|---|---|
| **Purpose** | Simple percentage of total combined cost per habit |
| **Function** | `rankHabits(result, lang)` |
| **Formula** | `impactScore = (habit.combinedCost / totalProjectionCombinedCost) × 100` |
| **Units** | Percentage (Decimal, 0–100) |

### 6.2 Priority Tier

| Field | Value |
|---|---|
| **Function** | `classifyTier(impactScore)` |
| **Thresholds** | `≥40 → 'critical'`, `≥20 → 'high'`, `≥10 → 'moderate'`, `<10 → 'low'` |

### 6.3 Recommended Action

| Field | Value |
|---|---|
| **Function** | `recommendedActionKey(tier, importance, isTimeDominated)` |
| **Logic** | Branches on tier × importance (≤2 vs >2) × time-dominated; returns i18n key |
| **Keys** | `critical_low`, `critical_high`, `high_low`, `high_high`, `moderate_time`, `moderate_general`, `low` |

---

## 7. Smart Swap Engine Metrics

**Source file**: `src/services/smartSwapEngine.ts`

### 7.1 Reduction Rate by Importance

| Field | Value |
|---|---|
| **Function** | `reductionRateForImportance(importance)` |
| **Formula** | `importance = 5 → 0.30` (30% reduction, hybrid replacement) |
| | `importance = 3 or 4 → 0.50` (50% reduction, frequency optimization) |
| | `importance = 1 or 2 → 0.80` (80% reduction, strong replacement) |
| **Assumptions** | Higher importance habits get smaller reductions; 100% is never recommended |

### 7.2 Suggested Monthly Cost

| Field | Value |
|---|---|
| **Formula** | `suggestedMonthlyCost = currentMonthlyCost × (1 − reductionRate)` |
| **Variables** | `currentMonthlyCost = annualCost / 12` |
| **Units** | Currency per month (Decimal) |

### 7.3 Monthly Saving

| Field | Value |
|---|---|
| **Formula** | `monthlySaving = currentMonthlyCost − suggestedMonthlyCost` |
| **Units** | Currency per month (Decimal) |

### 7.4 Annual Recovery

| Field | Value |
|---|---|
| **Formula** | `annualRecovery = monthlySaving × 12` |
| **Units** | Currency per year (Decimal) |

### 7.5 Ten-Year Recovery

| Field | Value |
|---|---|
| **Formula** | `tenYearRecovery = annualRecovery × 10` |
| **Units** | Currency (Decimal) |

### 7.6 Total Monthly/Annual Recovery

| Field | Value |
|---|---|
| **Formula** | `totalMonthlyRecovery = Σ(monthlySaving)`; `totalAnnualRecovery = totalMonthlyRecovery × 12` |
| **Units** | Currency (Decimal) |

### 7.7 Category Swap Database

| Category | Strategy | Default Reduction | Suggestions |
|---|---|---|---|
| food | frequency_reduction | 0.50 | Home meals, weekly dining budget |
| beverage | hybrid_replacement | 0.30 | Home brew, batch preparation |
| shopping | strong_replacement | 0.80 | 24-hour delay, free alternatives |
| entertainment | frequency_optimization | 0.50 | Free events, consolidate subscriptions |
| subscription | strong_replacement | 0.80 | Cancel unused, consolidate |
| transport | frequency_optimization | 0.50 | Public transit, batch errands |
| other | frequency_optimization | 0.50 | Reduce frequency by half |

---

## 8. Swap Recommendation Engine Metrics

**Source file**: `src/services/swapRecommendationEngine.ts`

### 8.1 Swapped Annual Cost

| Field | Value |
|---|---|
| **Formula** | `swappedAnnualCost = annualCost × costMultiplier` |
| **Units** | Currency per year (Decimal) |

### 8.2 Annual Savings

| Field | Value |
|---|---|
| **Formula** | `annualSavings = annualCost − swappedAnnualCost` |
| **Units** | Currency per year (Decimal) |

### 8.3 Projection Savings

| Field | Value |
|---|---|
| **Formula** | `projectionSavings = annualSavings × projectionYears` |
| **Units** | Currency (Decimal) |

### 8.4 Realism Score

| Field | Value |
|---|---|
| **Formula** | `realismScore = max(baseRealism − (importance − 1) × 5, 10)` |
| **Variables** | `baseRealism` (per category), `importance` (1–5) |
| **Constants** | Penalty: 0/5/10/15/20 for importance 1–5; floor: 10 |
| **Assumptions** | Higher importance → less realistic to swap |
| **Units** | Score (10–100, Decimal) |

### 8.5 Category Swap Templates

| Category | Cost Multiplier | Difficulty | Base Realism |
|---|---|---|---|
| beverage | 0.15 | easy | 85 |
| food | 0.30 | moderate | 70 |
| shopping | 0.50 | easy | 75 |
| entertainment | 0.25 | moderate | 65 |
| subscription | 0.40 | easy | 90 |
| transport | 0.45 | moderate | 60 |
| other | 0.50 | moderate | 70 |

### 8.6 Total Annual/Projection Savings

| Field | Value |
|---|---|
| **Formula** | `totalAnnualSavings = Σ(annualSavings)`; `totalProjectionSavings = Σ(projectionSavings)` |

---

## 9. FIRE Engine Metrics

**Source file**: `src/services/fireEngine.ts`

### 9.1 Annual Recovered Savings

| Field | Value |
|---|---|
| **Purpose** | Total annual savings from Smart Swap engine, passed to FIRE |
| **Function** | `runFireEngine(profile, totalAnnualRecoveredSavings)` |
| **Formula** | Pass-through from `smartSwaps.totalAnnualRecovery` |
| **Units** | Currency per year (Decimal) |

### 9.2 Potential Portfolio Impact (Rule of 25)

| Field | Value |
|---|---|
| **Purpose** | Portfolio size achievable by investing recovered savings (4% safe withdrawal) |
| **Formula** | `potentialPortfolioImpact = totalAnnualRecoveredSavings × 25` |
| **Constants** | `25` — multiplier from the 4% safe withdrawal rule (1/0.04) |
| **Assumptions** | 4% safe withdrawal rate; recovered savings are fully invested |
| **Units** | Currency (Decimal) |
| **Input validation** | Returns `INSUFFICIENT_DATA` if no monthly income or savings rate; returns 0 if recovered ≤ 0 |
| **Example** | `annualRecovered = 6000` → `6000 × 25 = 150000` |
| **Components using** | `FireImpact.potentialPortfolioImpact`, ProResultsV3 |

---

## 10. Recovery Roadmap (V3) Engine Metrics

**Source file**: `src/services/recoveryRoadmapEngine.ts`

### 10.1 Resistance Score

| Field | Value |
|---|---|
| **Formula** | `resistanceScore = (6 − importance) / 5` |
| **Assumptions** | Mirrors Priority V3's IW formula; higher = easier to change |

### 10.2 Day 30 Phase

| Field | Value |
|---|---|
| **Purpose** | Quick wins — up to 2 lowest-resistance habits |
| **Formula** | Sort all habits by resistance descending; take first 2 |
| **Monthly Recovery** | `Σ(monthlySaving)` for selected habits |
| **Objective** | "Awareness + first easy wins" |

### 10.3 Day 90 Phase

| Field | Value |
|---|---|
| **Purpose** | Behavior stabilization — next 3 habits (indices 2–4) |
| **Monthly Recovery** | `Σ(monthlySaving)` for selected habits |
| **Objective** | "Behavior stabilization" |

### 10.4 Day 180 Phase

| Field | Value |
|---|---|
| **Purpose** | Permanent system — all remaining habits (index 5+) |
| **Monthly Recovery** | `Σ(monthlySaving)` for remaining habits |
| **Total Monthly Recovery** | `Σ(monthlySaving)` for ALL habits |
| **Objective** | "Permanent system & long-term reinvestment" |

---

## 11. Legacy Roadmap Engine Metrics

**Source file**: `src/services/roadmapEngine.ts`

### 11.1 Phase Grouping by Difficulty

| Field | Value |
|---|---|
| **Function** | `buildRoadmap(result, priority, swaps, lang)` |
| **Formula** | Groups swaps into phases: `easy` → Phase 1, `moderate` → Phase 2, `hard` → Phase 3 |
| **Per-phase savings** | `annualSavings = Σ(r.annualSavings)`; `projectionSavings = Σ(r.projectionSavings)` |
| **Cumulative** | Running totals across phases |

### 11.2 Percentage Recoverable

| Field | Value |
|---|---|
| **Formula** | `percentageRecoverable = (totalProjectionRecoverable / projectionDirectCost) × 100` (if > 0, else 0) |
| **Units** | Percentage (Decimal) |

### 11.3 Years to Financial Freedom

| Field | Value |
|---|---|
| **Formula** | `nestEgg = annualDirectCost × 25`; `yearsToFreedom = nestEgg / totalAnnualRecoverable` |
| **Constants** | `25` — Rule of 25 (4% withdrawal) |
| **Assumptions** | Redirected savings fully invested; nest egg = 25× annual habit cost |
| **Units** | Years (Decimal) or `null` if inputs ≤ 0 |

### 11.4 Future Value If Invested

| Field | Value |
|---|---|
| **Formula** | `FV = totalAnnualRecoverable × ((1 + r)^n − 1) / r` (annual annuity) |
| | If `r = 0`: `FV = totalAnnualRecoverable × projectionYears` |
| **Variables** | `r = result.investmentProjection.returnRate`, `n = projectionYears` |
| **Units** | Currency (Decimal) |

### 11.5 Timeframe Labels

| Difficulty | Timeframe |
|---|---|
| easy | i18n `roadmapPhases[lang].timeframes.easy` |
| moderate | i18n `roadmapPhases[lang].timeframes.moderate` |
| hard | i18n `roadmapPhases[lang].timeframes.hard` |

---

## 12. Pro Analysis Aggregator Metrics

**Source file**: `src/services/proAnalysisEngine.ts`

### 12.1 Aggregation Pipeline

| Field | Value |
|---|---|
| **Purpose** | Combines all V3 engines into a single result with error isolation |
| **Function** | `runProAnalysis(calcResult, profile, scenarios?)` |
| **Engines called** | Compound Wealth → Priority V3 → Smart Swap → FIRE → Recovery Roadmap |
| **Error isolation** | Each engine wrapped in `try/catch`; failure pushes to `errors[]` but does not block others |
| **Dependencies** | Roadmap requires both Priority and Smart Swap to succeed |

### 12.2 Monthly Savings Target

| Field | Value |
|---|---|
| **Formula** | `monthlyContribution = calcResult.totals.annualDirectCost / 12` |
| **Assumptions** | Entire annual direct cost is redirectable (upper bound) |
| **Used by** | Compound Wealth Engine as the monthly contribution `P` |

---

## 13. Challenge / Share Card Metrics

**Source file**: `src/lib/challenge.ts`

### 13.1 Challenge Payload

| Field | Value |
|---|---|
| **Purpose** | Encodes a simulation result into a shareable URL |
| **Function** | `createChallenge(result, language)` |
| **Formula** | `payload = { v: 1, title: result.titleKey, score: result.score, level: result.level, lang: language }` |
| **Encoding** | `base64url(JSON.stringify(payload))` — `btoa` with `=` stripped, `+`→`-`, `/`→`_` |
| **URL format** | `{origin}/challenge?d={encoded}` |

### 13.2 Challenge Decoding & Validation

| Field | Value |
|---|---|
| **Function** | `readChallenge(value)` |
| **Validation** | `v === 1`; `title` must be in `validTitles` set (12 keys); `score` must be 1–100; `lang` must be `en` or `ar`; `level` must be in `validLevels` set (6 values) or defaults to `'moderate'` |
| **Valid titles** | `fomo_taxpayer`, `emotional_checkout`, `boredom_buyer`, `intentional_buyer`, `weekend_follower`, `mood_spender`, `anti_boredom_department`, `intentional_explorer`, `hustle_follower`, `escape_hustler`, `busy_bee`, `strategic_hustler` |
| **Valid levels** | `light`, `moderate`, `heavy`, `low`, `high`, `extreme` |

### 13.3 Card ID

| Field | Value |
|---|---|
| **Purpose** | Unique identifier on the share card |
| **Source** | `src/App.tsx` `StoryCard` component |
| **Formula** | `cardId = Math.floor(Math.random() * 90000) + 10000` (5-digit random number) |
| **Units** | Integer (10000–99999) |

---

## 14. PDF Report Metrics

**Source file**: `src/components/PDFReport.tsx`

### 14.1 PDF Report Data

The PDF report receives a `PDFReportData` object with pre-calculated values (no computation occurs inside the PDF component itself):

| Field | Type | Source |
|---|---|---|
| `income` | number | Monthly income (hardcoded sample: 4000) |
| `hourlyRate` | number | Pre-calculated hourly rate (sample: 22.73) |
| `baselineSpend` | number | Monthly baseline expenses (sample: 500) |
| `currentSpend` | number | Current spending after optimization (sample: 350) |
| `moneyRecovered` | number | Total money recovered (sample: 450) |
| `timeRecoveredHours` | number | Hours recovered (sample: 19) |
| `timeRecoveredMinutes` | number | Minutes recovered (sample: 48) |
| `lifeScore` | number | Life satisfaction score (sample: 72, 0–100) |
| `topHabits` | string[] | Top habits by impact (sample: Coffee, Eating out, Subscriptions) |
| `decisionPattern` | string | Persona label (sample: "The Convenience Seeker") |
| `day` | number | Day in recovery journey (sample: 180) |

### 14.2 PDF Generation

| Field | Value |
|---|---|
| **Library** | `html2pdf.js` (dynamic import) |
| **Settings** | `margin: [10,10,10,10]mm`, `format: 'a4'`, `orientation: 'portrait'`, `image quality: 0.98`, `html2canvas scale: 2`, `backgroundColor: '#0b1a28'` |
| **Filename** | `Financial_Recovery_Roadmap.pdf` |
| **Error handling** | `catch` block swallows errors silently |

---

## Appendix A: Frequency Conversion Constants

All engines use the same base constants, with the Pro engines using Decimal.js:

| Constant | Legacy (JS number) | Pro (Decimal) |
|---|---|---|
| Days per year | N/A (not used) | `365.25` |
| Weeks per year | `52` (extra_work monthly equiv) | `365.25 / 7 = 52.178...` |
| Months per year | `12` | `12` |
| Hours per day | `8` (workday), `24` (Reality Check) | `24` (daysLost calc) |
| Working hours/month | `176` (22×8) | N/A (uses annual) |

**Notable discrepancy**: The legacy simulator uses `52` weeks/year for monthly-equivalent conversion, while the Pro engines use `365.25/7 ≈ 52.18`. The legacy simulator also uses `4.33` weeks/month for monthly→weekly conversion (extra_work effective hourly rate), while the Pro engines do not use this approximation.

## Appendix B: Validation Systems

### Legacy Simulator (`parseSavedState`)
- Validates: language, currency (against `currencies` array), decisionType (enum), motivation (enum), frequency (enum), freeHoursPerDay (finite, ≥ 0), all numeric fields (finite, ≥ 0)
- Returns `null` for any non-conforming input

### Reality Check Engine (`validate`)
- Requires: ≥ 1 habit, non-empty names, non-negative amounts/time, valid frequencies, `lifetimeYears > 0`, `monthlySalary ≥ 0`, `workingHoursPerWeek > 0`, `baselineExpenses ≥ 0`

### Pro Engine (`validateProInput`)
- Requires: profile with `monthlyIncome ≥ 0`, `weeklyWorkHours > 0`, `age ≥ 0` (if provided), `currentSavingsRate ≥ 0` (if provided), `baselineMonthlyExpenses ≥ 0` (if provided)
- Per habit: non-empty name, finite non-negative cost/time amounts, valid frequencies, valid categories (7 values), importance 1–5
- Throws `ProCalculationError('INVALID_INPUT', ...)` on failure

### Pro Result Validation (`validateResult`)
- Verifies: sum of habit lifetime costs = total lifetime cost; sum of habit hours = total hours; hours/24 = days; days/365.25 = years; percentages sum to 100% (±0.01, only when total > 0)

## Appendix C: Largest Remainder Method (Hare–Niemeyer)

**Source**: `src/services/calculationEngine.ts` → `largestRemainder()`

**Purpose**: Distributes percentage points so they sum to exactly 100%, handling rounding errors.

**Algorithm**:
1. If all values are zero → return all zeros
2. If single habit → return [100]
3. Floor each raw percentage to 2 decimal places
4. Calculate remainder for each (raw − floored)
5. Sort by remainder descending
6. Distribute `0.01` increments to highest-remainder items until sum reaches target
7. If overshot, retract from lowest-remainder items
8. Round each to 2 decimal places

---

*Documentation complete. This document describes the implementation as of 2026-09-21. No code was modified.*
