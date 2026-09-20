// src/lib/narrativeData.ts

export interface NarrativeHook {
  id: string;
  headline: string;
  subheadline: string;
}

export interface DecisionPatternInsight {
  patternName: string;
  tagline: string;
  description: string;
  keyTakeaway: string;
  conditionalQuote: string;
}

export const HERO_HOOKS: NarrativeHook[] = [
  {
    id: 'hook_1',
    headline: 'WHAT IS YOUR MONEY REALLY COSTING YOU?',
    subheadline: 'You see the price. We show you the life behind it. Every purchase costs more than money — it costs the time you spent earning it.',
  },
  {
    id: 'hook_2',
    headline: 'YOU KNOW WHAT YOU SPEND. DO YOU KNOW WHAT IT COSTS IN TIME?',
    subheadline: 'Your bank account shows money. We show the working hours behind every decision.',
  },
  {
    id: 'hook_3',
    headline: '$20 ISN’T JUST $20.',
    subheadline: 'It is the exact amount of your life and labor it took you to earn it.',
  },
];

export const CORE_PHILOSOPHY = {
  mainQuote: 'You don’t just spend money. You spend the time it took to earn it.',
  subQuote: 'Your money has a price. Your time has a value. Now see the hidden cost of your decisions.',
  closingQuote: 'You can’t get your time back. But you can make your next decision count.',
};

// Engine to select dynamic narrative quote based on habit profile
export function getBehavioralQuote(profile: {
  isFrequentSmall: boolean;
  isConvenience: boolean;
  isImpulse: boolean;
  isSubscriptions: boolean;
  isDiningOutHigh: boolean;
  isLowExposure: boolean;
}): string {
  if (profile.isFrequentSmall) {
    return "It's not the big purchases hurting your numbers. It's the small decisions you stopped noticing.";
  }
  if (profile.isConvenience) {
    return "You are not necessarily buying things. You may be buying convenience with your working time.";
  }
  if (profile.isImpulse) {
    return "The decision takes seconds. The hidden cost can take hours to earn back.";
  }
  if (profile.isSubscriptions) {
    return "Some expenses leave your account every month without asking for your attention.";
  }
  if (profile.isDiningOutHigh) {
    return "Your meals may be costing more working time than you realize.";
  }
  if (profile.isLowExposure) {
    return "Your spending pattern shows relatively low hidden-cost exposure. Your biggest opportunity may be optimization rather than restriction.";
  }
  return "Your biggest hidden cost isn't one expensive decision. It's repetition.";
}

// 180-Day Timeline & Milestone Reports Data
export const TIMELINE_MILESTONES = {
  day1: {
    title: 'DAY 1 / 180',
    quote: 'Today isn’t about changing everything. Today is about seeing everything clearly.',
    mission: 'Record every non-essential purchase you make today.',
    cta: 'START TODAY',
  },
  day12: {
    title: 'DAY 12 CHECK-IN',
    reflectionQuestion: 'How did you feel about your decisions today?',
    moods: ['Controlled 😊', 'Mixed 😐', 'Impulsive 😞'],
    avoidedPrompt: 'Did you avoid any purchase you would normally make?',
  },
  day30: {
    title: 'YOUR FIRST 30 DAYS',
    subtitle: 'Building Awareness',
    projectedMessage: (annualSavings: string) =>
      `If this improvement continues, your current habits could cost you approximately ${annualSavings} less over the next year.`,
  },
  day90: {
    title: 'HALF WAY THERE — 90 DAYS',
    heroStatement: '90 days ago, these numbers belonged to your habits. Now they belong to your decisions.',
  },
  day180: {
    title: 'YOUR 180-DAY TRANSFORMATION',
    finalStatement: 'You didn’t become richer by earning more. You became richer by keeping more of what you already earned.',
  },
};

// Complete PDF Report Section Structure
export const PDF_REPORT_STRUCTURE = [
  '1. Your Starting Point (Income, Hourly Rate, Baseline Spend)',
  '2. Your Hidden Cost Profile (Top Habit Drivers)',
  '3. Your Decision Pattern (Psychological Behavioral Analysis)',
  '4. Your 180-Day Personalized Recovery Plan',
  '5. Progress Visualizations & Metrics Charts',
  '6. Total Money Recovered ($)',
  '7. Total Working Time Recovered (Hours/Days)',
  '8. Biggest Behavior Changes & Successes',
  '9. Remaining Challenges & Optimization Points',
  '10. Your Next 180 Days Roadmap',
];

// Pricing & Offer Positioning
export const OFFER_DETAILS = {
  heading: 'TURN YOUR NUMBER INTO A PLAN',
  subheading: 'We created a personalized 180-day plan designed around your actual habits, not generic financial advice.',
  monthlyPrice: '$3/month',
  annualPrice: '$29/year',
  savingsBadge: 'Save ~20% (2 Months Free)',
  guaranteeText: 'Cancel anytime. Less than the cost of one small purchase — designed to help you question hundreds of them.',
  features: [
    'Personalized daily recovery actions',
    'Daily spending check-in & habit log',
    'Money saved & time recovered tracking',
    'Life Recovery Score (0–100 scale)',
    'Milestone reports (Day 30, 90, 180)',
    'Professional downloadable PDF comparison reports',
    'Day 1 vs Day 180 full behavioral transformation analysis',
  ],
};

// Affiliate Program Framing
export const AFFILIATE_DATA = {
  title: 'BECOME A HIDDEN COST PARTNER',
  subtext: 'Help people discover the hidden cost of their everyday decisions.',
  commission: 'Earn 30% recurring commission for every customer you refer.',
  modelExplanation: 'No clicks required. No impressions required. You earn when someone becomes a paying customer.',
  funnelFlow: 'Affiliate Partner Link → Free Calculator → Shock Result → $3/mo Plan Conversion',
};
