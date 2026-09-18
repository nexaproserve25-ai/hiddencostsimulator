import Decimal from 'decimal.js';
import type { HabitProjection, ProCalculationResult, HabitCategory } from './proCalculationEngine';
import { swapTemplates, type ProLang } from '@/lib/proI18n';

// ============================================================================
// SWAP RECOMMENDATION ENGINE — Suggests lower-cost alternatives
// ============================================================================

export interface SwapRecommendation {
  habitId: string;
  habitName: string;
  category: HabitCategory;
  currentAnnualCost: Decimal;
  swappedAnnualCost: Decimal;
  annualSavings: Decimal;
  projectionSavings: Decimal;
  swapDescription: string;
  swapLabel: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  realismScore: Decimal; // 0-100, higher = more realistic
}

export interface SwapResult {
  recommendations: SwapRecommendation[];
  totalAnnualSavings: Decimal;
  totalProjectionSavings: Decimal;
}

// ============================================================================
// CATEGORY-SPECIFIC SWAP DEFINITIONS
// ============================================================================

interface SwapTemplate {
  label: string;
  description: string;
  costMultiplier: Decimal; // fraction of original cost (0-1)
  difficulty: 'easy' | 'moderate' | 'hard';
  realism: Decimal; // base realism score 0-100
}

const SWAP_TEMPLATES: Record<HabitCategory, SwapTemplate> = {
  beverage: {
    label: 'Brew at home',
    description: 'Replace daily café purchases with home-brewed equivalents — same caffeine, a fraction of the cost.',
    costMultiplier: new Decimal('0.15'),
    difficulty: 'easy',
    realism: new Decimal('85'),
  },
  food: {
    label: 'Cook at home / meal prep',
    description: 'Replace restaurant meals with home-cooked alternatives using batch preparation.',
    costMultiplier: new Decimal('0.30'),
    difficulty: 'moderate',
    realism: new Decimal('70'),
  },
  shopping: {
    label: '24-hour purchase delay',
    description: 'Implement a mandatory 24-hour cooling-off period before any non-essential purchase.',
    costMultiplier: new Decimal('0.50'),
    difficulty: 'easy',
    realism: new Decimal('75'),
  },
  entertainment: {
    label: 'Free / low-cost alternatives',
    description: 'Substitute paid entertainment with free community events, libraries, or outdoor activities.',
    costMultiplier: new Decimal('0.25'),
    difficulty: 'moderate',
    realism: new Decimal('65'),
  },
  subscription: {
    label: 'Audit & consolidate',
    description: 'Cancel unused subscriptions and consolidate overlapping services into a single plan.',
    costMultiplier: new Decimal('0.40'),
    difficulty: 'easy',
    realism: new Decimal('90'),
  },
  transport: {
    label: 'Public transit / carpool',
    description: 'Replace solo driving with public transit, carpooling, or trip batching.',
    costMultiplier: new Decimal('0.45'),
    difficulty: 'moderate',
    realism: new Decimal('60'),
  },
  other: {
    label: 'Frequency reduction',
    description: 'Reduce the frequency of this habit by 50% while maintaining the core benefit.',
    costMultiplier: new Decimal('0.50'),
    difficulty: 'moderate',
    realism: new Decimal('70'),
  },
};

// ============================================================================
// IMPORTANCE ADJUSTMENT
// ============================================================================

function adjustRealismForImportance(baseRealism: Decimal, importance: number): Decimal {
  // Higher importance = harder to swap, lower realism
  const penalty = new Decimal((importance - 1) * 5); // 0, 5, 10, 15, 20
  const adjusted = baseRealism.minus(penalty);
  return Decimal.max(adjusted, new Decimal('10'));
}

// ============================================================================
// PUBLIC API: generateSwaps()
// ============================================================================

export function generateSwaps(result: ProCalculationResult, lang: ProLang = 'en'): SwapResult {
  const localizedTemplates = swapTemplates[lang];
  const recommendations: SwapRecommendation[] = result.habits.map((h: HabitProjection) => {
    const template = SWAP_TEMPLATES[h.category];
    const swappedAnnualCost = h.annualCost.times(template.costMultiplier);
    const annualSavings = h.annualCost.minus(swappedAnnualCost);
    const projectionSavings = annualSavings.times(result.projectionYears);
    const realismScore = adjustRealismForImportance(template.realism, h.importance);

    return {
      habitId: h.id,
      habitName: h.name,
      category: h.category,
      currentAnnualCost: h.annualCost,
      swappedAnnualCost,
      annualSavings,
      projectionSavings,
      swapDescription: localizedTemplates[h.category].description,
      swapLabel: localizedTemplates[h.category].label,
      difficulty: template.difficulty,
      realismScore,
    };
  });

  // Sort by projection savings descending
  recommendations.sort((a, b) => b.projectionSavings.comparedTo(a.projectionSavings));

  const totalAnnualSavings = recommendations.reduce((s, r) => s.plus(r.annualSavings), new Decimal(0));
  const totalProjectionSavings = recommendations.reduce((s, r) => s.plus(r.projectionSavings), new Decimal(0));

  return {
    recommendations,
    totalAnnualSavings,
    totalProjectionSavings,
  };
}
