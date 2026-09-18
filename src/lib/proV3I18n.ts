import type { ProLang } from './proI18n';

// ============================================================================
// V3 ANALYTICAL REPORT — BILINGUAL DICTIONARY
// Strings for Compound Wealth, Priority V3, Smart Swaps, FIRE, Roadmap
// ============================================================================

export const v3Copy: Record<ProLang, Record<string, string>> = {
  en: {
    // Compound Wealth
    compoundWealthTitle: 'Compound Wealth Simulation',
    compoundWealthSub: 'What your redirected spending could become over time.',
    scenarioConservative: 'Conservative (4%)',
    scenarioBalanced: 'Balanced (7%)',
    scenarioGrowth: 'Growth (8%)',
    horizon: 'Years',
    monthlyContribution: 'Monthly Contribution',
    totalContributions: 'Total Contributions',
    futureValue: 'Potential Future Value',
    growthAmount: 'Investment Growth',
    compoundDisclaimer: 'Hypothetical investment scenarios, not guaranteed returns.',
    insufficientData: 'Insufficient data — calculation omitted.',
    investmentUnavailable: 'Investment simulation unavailable because required data is incomplete.',

    // Priority V3
    priorityV3Title: 'Priority Rankings',
    priorityV3Sub: 'Habits ranked by financial impact, time impact, and ease of change.',
    priorityScore: 'Priority Score',
    rank: 'Rank',
    reason: 'Reason',

    // Smart Swaps
    smartSwapTitle: 'Smart Swap Recommendations',
    smartSwapSub: 'Intelligent reductions based on what matters to you.',
    currentMonthlyCost: 'Current Monthly Cost',
    suggestedReduction: 'Suggested Reduction',
    monthlySaving: 'Monthly Saving',
    annualRecovery: 'Annual Recovery',
    tenYearRecovery: '10-Year Recovery',
    strategy: 'Strategy',
    suggestions: 'Suggestions',
    strategyHybrid: 'Hybrid Replacement',
    strategyFrequency: 'Frequency Optimization',
    strategyStrong: 'Strong Replacement',
    totalMonthlyRecovery: 'Total Monthly Recovery',
    totalAnnualRecovery: 'Total Annual Recovery',

    // FIRE
    fireTitle: 'Financial Independence Impact',
    fireSub: 'How recovered money could accelerate your path to financial freedom.',
    annualRecovered: 'Annual Recovered Amount',
    portfolioImpact: 'Potential Portfolio Impact',
    fireCalc: 'Calculated',
    fireInsufficient: 'Insufficient Data',
    fireOmitted: 'FIRE calculation omitted — monthly income or savings rate not provided.',

    // 180-Day Roadmap
    roadmapTitle: '180-Day Recovery Roadmap',
    roadmapSub: 'A phased plan to redirect your spending, step by step.',
    day30: 'Day 30 — Quick Wins',
    day90: 'Day 90 — Behavior Stabilization',
    day180: 'Day 180 — Permanent System',
    day30Objective: 'Awareness + first easy wins',
    day90Objective: 'Behavior stabilization',
    day180Objective: 'Permanent system & long-term reinvestment',
    focusHabits: 'Focus Habits',
    monthlyRecovery: 'Monthly Recovery',
    totalMonthlyRecoveryAll: 'Total Monthly Recovery',
    none: 'None',

    // PDF report
    reportVersion: 'Version 3.0',
    reportGenerated: 'Generated',
    reportDisclaimer: 'Educational financial analysis, not financial advice.',
    reportWebsite: 'hiddencostsimulator.com',
    page: 'Page',
    of: 'of',
    personalizedRecoveryBlueprint: 'Your Personalized Recovery Blueprint',
    financialProfile: 'Financial Profile',
    habitsAnalysis: 'Habits Analysis',
    yourHabit: 'Your Habit',
    noHabitsInPhase: 'No specific habits in this phase.',
  },

  ar: {
    // Compound Wealth
    compoundWealthTitle: 'محاكاة الثروة المركّبة',
    compoundWealthSub: 'ماذا يمكن أن يصبح إنفاقك المُعاد توجيهه بمرور الوقت.',
    scenarioConservative: 'محافظ (4%)',
    scenarioBalanced: 'متوازن (7%)',
    scenarioGrowth: 'نمو (8%)',
    horizon: 'سنوات',
    monthlyContribution: 'المساهمة الشهرية',
    totalContributions: 'إجمالي المساهمات',
    futureValue: 'القيمة المستقبلية المحتملة',
    growthAmount: 'نمو الاستثمار',
    compoundDisclaimer: 'سيناريوهات استثمار افتراضية، ليست عوائد مضمونة.',
    insufficientData: 'بيانات غير كافية — تم حذف الحساب.',
    investmentUnavailable: 'محاكاة الاستثمار غير متاحة لعدم اكتمال البيانات المطلوبة.',

    // Priority V3
    priorityV3Title: 'ترتيب الأولويات',
    priorityV3Sub: 'العادات مرتبة حسب التأثير المالي والزمني وسهولة التغيير.',
    priorityScore: 'درجة الأولوية',
    rank: 'الترتيب',
    reason: 'السبب',

    // Smart Swaps
    smartSwapTitle: 'توصيات البدائل الذكية',
    smartSwapSub: 'تخفيضات ذكية بناءً على ما يهمك.',
    currentMonthlyCost: 'التكلفة الشهرية الحالية',
    suggestedReduction: 'التخفيض المقترح',
    monthlySaving: 'الادخار الشهري',
    annualRecovery: 'الاسترداد السنوي',
    tenYearRecovery: 'استرداد 10 سنوات',
    strategy: 'الاستراتيجية',
    suggestions: 'اقتراحات',
    strategyHybrid: 'استبدال هجين',
    strategyFrequency: 'تحسين التكرار',
    strategyStrong: 'استبدال قوي',
    totalMonthlyRecovery: 'إجمالي الاسترداد الشهري',
    totalAnnualRecovery: 'إجمالي الاسترداد السنوي',

    // FIRE
    fireTitle: 'تأثير الاستقلال المالي',
    fireSub: 'كيف يمكن للأموال المستردة تسريع طريقك نحو الحرية المالية.',
    annualRecovered: 'المبلغ السنوي المسترد',
    portfolioImpact: 'تأثير المحفظة المحتمل',
    fireCalc: 'تم الحساب',
    fireInsufficient: 'بيانات غير كافية',
    fireOmitted: 'تم حذف حساب FIRE — لم يتم تقديم الدخل الشهري أو معدل الادخار.',

    // 180-Day Roadmap
    roadmapTitle: 'خارطة طريق التعافي — 180 يوماً',
    roadmapSub: 'خطة مراحل لإعادة توجيه إنفاقك، خطوة بخطوة.',
    day30: 'اليوم 30 — مكاسب سريعة',
    day90: 'اليوم 90 — استقرار السلوك',
    day180: 'اليوم 180 — نظام دائم',
    day30Objective: 'الوعي + أول مكاسب سهلة',
    day90Objective: 'استقرار السلوك',
    day180Objective: 'نظام دائم وإعادة استثمار طويلة الأجل',
    focusHabits: 'العادات المستهدفة',
    monthlyRecovery: 'الاسترداد الشهري',
    totalMonthlyRecoveryAll: 'إجمالي الاسترداد الشهري',
    none: 'لا شيء',

    // PDF report
    reportVersion: 'الإصدار 3.0',
    reportGenerated: 'تاريخ الإنشاء',
    reportDisclaimer: 'تحليل مالي تعليمي، وليس نصيحة مالية.',
    reportWebsite: 'hiddencostsimulator.com',
    page: 'صفحة',
    of: 'من',
    personalizedRecoveryBlueprint: 'خطتك الشخصية للتعافي',
    financialProfile: 'الملف المالي',
    habitsAnalysis: 'تحليل العادات',
    yourHabit: 'عادتك',
    noHabitsInPhase: 'لا توجد عادات محددة في هذه المرحلة.',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export function scenarioName(lang: ProLang, scenarioId: string): string {
  const t = v3Copy[lang];
  if (scenarioId === 'conservative') return t.scenarioConservative;
  if (scenarioId === 'balanced') return t.scenarioBalanced;
  if (scenarioId === 'growth') return t.scenarioGrowth;
  return scenarioId;
}

export function strategyLabel(lang: ProLang, strategy: string): string {
  const t = v3Copy[lang];
  if (strategy === 'hybrid_replacement') return t.strategyHybrid;
  if (strategy === 'frequency_optimization') return t.strategyFrequency;
  if (strategy === 'strong_replacement') return t.strategyStrong;
  return strategy;
}
