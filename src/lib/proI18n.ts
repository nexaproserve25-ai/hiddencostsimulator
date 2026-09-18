import type { ProFrequency, HabitCategory } from '@/services/proCalculationEngine';
import type { PriorityTier } from '@/services/priorityEngine';

export type ProLang = 'en' | 'ar';

// ============================================================================
// PRO WIZARD + RESULTS — FULL BILINGUAL DICTIONARY
// ============================================================================

export const proCopy = {
  en: {
    // Header
    headerTagline: 'Financial Recovery System',
    proBadge: 'Pro',

    // Wizard navigation
    back: 'Back',
    step: 'Step',
    of: 'of',

    // Step 1 — Financial Profile
    step1Label: '01 / Financial Profile',
    step1Title: 'Tell us about your finances',
    step1Sub: 'This powers the opportunity cost calculations. All data stays in your browser.',
    monthlyIncome: 'Monthly net income',
    weeklyWorkHours: 'Weekly work hours',
    ageOptional: 'Age (optional)',
    currency: 'Currency',
    step1Helper: 'Your hourly value is calculated as annual income ÷ annual work hours. This determines the opportunity cost of time spent on habits.',
    continue: 'Continue',

    // Step 2 — Habits
    step2Label: '02 / Your Habits',
    step2Title: 'What are you spending on?',
    step2Sub: 'Add any habit — coffee, dining, gaming, subscriptions. Be honest about cost and time.',
    habitNamePlaceholder: 'e.g. Coffee outside home',
    habitNameAria: 'Habit name',
    habitNumber: 'Habit',
    removeHabit: 'Remove habit',
    category: 'Category',
    costAmount: 'Cost amount',
    costFrequency: 'Cost frequency',
    timeHours: 'Time (hours)',
    timeFrequency: 'Time frequency',
    importance: 'Importance (1-5)',
    addHabit: 'Add another habit',
    analyze: 'Analyze My Habits',

    // Categories
    cat_food: 'Food',
    cat_beverage: 'Beverage',
    cat_shopping: 'Shopping',
    cat_entertainment: 'Entertainment',
    cat_subscription: 'Subscription',
    cat_transport: 'Transport',
    cat_other: 'Other',

    // Frequencies
    freq_daily: 'Daily',
    freq_weekly: 'Weekly',
    freq_monthly: 'Monthly',
    freq_yearly: 'Yearly',

    // Validation errors
    errStep1: 'Please enter your monthly income and weekly work hours.',
    errStep2: 'Each habit needs a name and non-negative amounts.',
    errCalc: 'Unable to verify calculation accuracy. Please check your inputs.',
    errPdf: 'Could not generate the PDF. Please try again.',

    // Results — header bar
    backToWizard: 'Back to wizard',
    downloadReport: 'Download Report',
    generating: 'Generating...',
    startOver: 'Start over',

    // Results — title section
    reportTitle: 'Hidden Cost Pro — Financial Recovery Report',
    reportSubtitle: 'Your Personal Financial Analysis',
    projectionHorizon: 'Projection horizon',
    years: 'years',
    hourlyValue: 'Hourly value',
    hr: 'hr',

    // Results — summary cards
    directSpending: 'Direct Spending',
    overYears: 'Over',
    timeOpportunityCost: 'Time Opportunity Cost',
    hoursLost: 'hours lost',
    totalCombinedCost: 'Total Combined Cost',
    directPlusOpportunity: 'Direct + opportunity',

    // Results — investment projection
    ifInvestedInstead: 'If You Invested Instead',
    redirectingAnnual: 'Redirecting your annual spending of',
    intoInvestments: 'into investments at',
    returnWouldGrow: 'return would grow to:',
    futureValueOver: 'Future value over',

    // Results — priority rankings
    priorityRankings: 'Priority Rankings',
    prioritySub: 'Habits ranked by combined financial + time impact.',

    // Results — swap recommendations
    swapRecommendations: 'Swap Recommendations',
    swapSub: 'Lower-cost alternatives for each habit.',
    save: 'Save',
    realistic: 'realistic',
    totalRecoverable: 'Total recoverable:',

    // Results — recovery roadmap
    recoveryRoadmap: 'Recovery Roadmap',
    roadmapSub: 'A phased plan to redirect your spending.',
    cumulativeSavings: 'Cumulative savings',
    recoverable: 'Recoverable',
    ifInvested: 'If Invested',
    yearsToFreedom: 'Years to Freedom',
    yrs: 'yrs',
    na: 'N/A',

    // Results — per-habit breakdown
    perHabitBreakdown: 'Per-Habit Breakdown',
    colHabit: 'Habit',
    colDirect: 'Direct',
    colOpportunity: 'Opportunity',
    colCombined: 'Combined',
    colHours: 'Hours',

    // Results — footer
    disclaimer: 'A reflection tool, not financial advice. Calculations use arbitrary-precision decimal arithmetic.',

    // Difficulty labels
    diff_easy: 'easy',
    diff_moderate: 'moderate',
    diff_hard: 'hard',

    // Tier labels (display)
    tier_critical: 'critical',
    tier_high: 'high',
    tier_moderate: 'moderate',
    tier_low: 'low',
  },

  ar: {
    // Header
    headerTagline: 'نظام التعافي المالي',
    proBadge: 'برو',

    // Wizard navigation
    back: 'رجوع',
    step: 'خطوة',
    of: 'من',

    // Step 1 — Financial Profile
    step1Label: '01 / الملف المالي',
    step1Title: 'أخبرنا عن وضعك المالي',
    step1Sub: 'هذا يغذي حسابات تكلفة الفرصة. جميع البيانات تبقى في متصفحك.',
    monthlyIncome: 'صافي الدخل الشهري',
    weeklyWorkHours: 'ساعات العمل الأسبوعية',
    ageOptional: 'العمر (اختياري)',
    currency: 'العملة',
    step1Helper: 'تُحسب قيمتك بالساعة كالدخل السنوي ÷ ساعات العمل السنوية. يحدد هذا تكلفة الفرصة للوقت المُنفَق على العادات.',
    continue: 'متابعة',

    // Step 2 — Habits
    step2Label: '02 / عاداتك',
    step2Title: 'على ماذا تنفق؟',
    step2Sub: 'أضف أي عادة — قهوة، طعام خارجي، ألعاب، اشتراكات. كن صادقًا حول التكلفة والوقت.',
    habitNamePlaceholder: 'مثال: قهوة خارج المنزل',
    habitNameAria: 'اسم العادة',
    habitNumber: 'عادة',
    removeHabit: 'إزالة العادة',
    category: 'الفئة',
    costAmount: 'مبلغ التكلفة',
    costFrequency: 'تكرار التكلفة',
    timeHours: 'الوقت (ساعات)',
    timeFrequency: 'تكرار الوقت',
    importance: 'الأهمية (1-5)',
    addHabit: 'أضف عادة أخرى',
    analyze: 'حلل عاداتي',

    // Categories
    cat_food: 'طعام',
    cat_beverage: 'مشروبات',
    cat_shopping: 'تسوق',
    cat_entertainment: 'ترفيه',
    cat_subscription: 'اشتراكات',
    cat_transport: 'مواصلات',
    cat_other: 'أخرى',

    // Frequencies
    freq_daily: 'يومي',
    freq_weekly: 'أسبوعي',
    freq_monthly: 'شهري',
    freq_yearly: 'سنوي',

    // Validation errors
    errStep1: 'يرجى إدخال دخلك الشهري وساعات عملك الأسبوعية.',
    errStep2: 'كل عادة تحتاج اسمًا ومبالغ غير سالبة.',
    errCalc: 'تعذر التحقق من دقة الحسابات. يرجى مراجعة المدخلات.',
    errPdf: 'تعذر إنشاء ملف PDF. يرجى المحاولة مرة أخرى.',

    // Results — header bar
    backToWizard: 'رجوع للمعالج',
    downloadReport: 'تحميل التقرير',
    generating: 'جارٍ الإنشاء...',
    startOver: 'ابدأ من جديد',

    // Results — title section
    reportTitle: 'التكلفة الخفية برو — تقرير التعافي المالي',
    reportSubtitle: 'تحليلك المالي الشخصي',
    projectionHorizon: 'أفق الإسقاط',
    years: 'سنوات',
    hourlyValue: 'القيمة بالساعة',
    hr: 'ساعة',

    // Results — summary cards
    directSpending: 'الإنفاق المباشر',
    overYears: 'خلال',
    timeOpportunityCost: 'تكلفة الفرصة الزمنية',
    hoursLost: 'ساعة مفقودة',
    totalCombinedCost: 'إجمالي التكلفة المجمعة',
    directPlusOpportunity: 'مباشر + فرصة',

    // Results — investment projection
    ifInvestedInstead: 'لو استثمرت بدلاً من ذلك',
    redirectingAnnual: 'إعادة توجيه إنفاقك السنوي البالغ',
    intoInvestments: 'إلى استثمارات بعائد',
    returnWouldGrow: 'سينمو إلى:',
    futureValueOver: 'القيمة المستقبلية خلال',

    // Results — priority rankings
    priorityRankings: 'ترتيب الأولويات',
    prioritySub: 'العادات مرتبة حسب التأثير المالي والزمني المجمَع.',

    // Results — swap recommendations
    swapRecommendations: 'توصيات البدائل',
    swapSub: 'بدائل أقل تكلفة لكل عادة.',
    save: 'وفّر',
    realistic: 'واقعي',
    totalRecoverable: 'إجمالي القابل للاسترداد:',

    // Results — recovery roadmap
    recoveryRoadmap: 'خارطة طريق التعافي',
    roadmapSub: 'خطة مراحل لإعادة توجيه إنفاقك.',
    cumulativeSavings: 'المدخرات التراكمية',
    recoverable: 'قابل للاسترداد',
    ifInvested: 'لو استُثمر',
    yearsToFreedom: 'سنوات للحرية',
    yrs: 'سنة',
    na: 'غير متاح',

    // Results — per-habit breakdown
    perHabitBreakdown: 'تفصيل كل عادة',
    colHabit: 'العادة',
    colDirect: 'مباشر',
    colOpportunity: 'فرصة',
    colCombined: 'مجمّع',
    colHours: 'ساعات',

    // Results — footer
    disclaimer: 'أداة تأمل وليست نصيحة مالية. تستخدم الحسابات دقة عشرية عالية.',

    // Difficulty labels
    diff_easy: 'سهل',
    diff_moderate: 'متوسط',
    diff_hard: 'صعب',

    // Tier labels (display)
    tier_critical: 'حرج',
    tier_high: 'مرتفع',
    tier_moderate: 'متوسط',
    tier_low: 'منخفض',
  },
} as const;

// ============================================================================
// ENGINE-GENERATED TEXT — bilingual lookup maps
// ============================================================================

// --- Priority engine: recommended action strings ---
export const priorityActions: Record<ProLang, Record<string, string>> = {
  en: {
    critical_low: 'Eliminate or drastically reduce this habit — low personal importance, high financial impact.',
    critical_high: 'This habit matters to you, but the financial drain is severe. Consider reducing frequency by 50%.',
    high_low: 'Strong candidate for elimination — low importance with significant cost.',
    high_high: 'Reduce frequency or find a lower-cost alternative that preserves the core value.',
    moderate_time: 'The time cost exceeds the financial cost. Look for ways to make this habit more time-efficient.',
    moderate_general: 'Moderate impact. Consider a modest frequency reduction or substitution.',
    low: 'Low impact habit. No urgent action needed, but remain mindful of creep.',
  },
  ar: {
    critical_low: 'ألغِ أو قلّل هذه العادة بشكل كبير — أهمية شخصية منخفضة وتأثير مالي مرتفع.',
    critical_high: 'هذه العادة مهمة لك، لكن الاستنزاف المالي شديد. فكر في تقليل التكرار بنسبة 50%.',
    high_low: 'مرشح قوي للإلغاء — أهمية منخفضة مع تكلفة كبيرة.',
    high_high: 'قلل التكرار أو ابحث عن بديل أقل تكلفة يحافظ على القيمة الأساسية.',
    moderate_time: 'تكلفة الوقت تتجاوز التكلفة المالية. ابحث عن طرق لجعل هذه العادة أكثر كفاءة في الوقت.',
    moderate_general: 'تأثير متوسط. فكر في تقليل التكرار بشكل بسيط أو الاستبدال.',
    low: 'عادة منخفضة التأثير. لا حاجة لاتخاذ إجراء عاجل، لكن كن يقظًا تجاه الزيادة التدريجية.',
  },
};

// --- Swap engine: template labels & descriptions ---
export interface BilingualSwapTemplate {
  label: string;
  description: string;
}

export const swapTemplates: Record<ProLang, Record<HabitCategory, BilingualSwapTemplate>> = {
  en: {
    beverage: { label: 'Brew at home', description: 'Replace daily café purchases with home-brewed equivalents — same caffeine, a fraction of the cost.' },
    food: { label: 'Cook at home / meal prep', description: 'Replace restaurant meals with home-cooked alternatives using batch preparation.' },
    shopping: { label: '24-hour purchase delay', description: 'Implement a mandatory 24-hour cooling-off period before any non-essential purchase.' },
    entertainment: { label: 'Free / low-cost alternatives', description: 'Substitute paid entertainment with free community events, libraries, or outdoor activities.' },
    subscription: { label: 'Audit & consolidate', description: 'Cancel unused subscriptions and consolidate overlapping services into a single plan.' },
    transport: { label: 'Public transit / carpool', description: 'Replace solo driving with public transit, carpooling, or trip batching.' },
    other: { label: 'Frequency reduction', description: 'Reduce the frequency of this habit by 50% while maintaining the core benefit.' },
  },
  ar: {
    beverage: { label: 'احضره في المنزل', description: 'استبدل مشتريات القهوة اليومية بمبدلات محضّرة في المنزل — نفس الكافيين، بأجزاء من التكلفة.' },
    food: { label: 'اطبخ في المنزل / حضّر الوجبات', description: 'استبدل وجبات المطعم ببدائل مطبوخة منزليًا باستخدام التحضير المسبق للوجبات.' },
    shopping: { label: 'تأجيل الشراء 24 ساعة', description: 'طبّق فترة تبريد إلزامية مدتها 24 ساعة قبل أي شراء غير ضروري.' },
    entertainment: { label: 'بدائل مجانية / منخفضة التكلفة', description: 'استبدل الترفيه المدفوع بفعاليات مجتمعية مجانية أو مكتبات أو أنشطة خارجية.' },
    subscription: { label: 'مراجعة ودمج', description: 'ألغِ الاشتراكات غير المستخدمة وادمج الخدمات المتداخلة في خطة واحدة.' },
    transport: { label: 'نقل عام / مشاركة السيارة', description: 'استبدل القيادة الفردية بالنقل العام أو مشاركة السيارة أو تجميع الرحلات.' },
    other: { label: 'تقليل التكرار', description: 'قلل تكرار هذه العادة بنسبة 50% مع الحفاظ على الفائدة الأساسية.' },
  },
};

// --- Roadmap engine: phase titles, descriptions, timeframes ---
export const roadmapPhases: Record<ProLang, {
  quickWins: { title: string; description: string };
  sustained: { title: string; description: string };
  deep: { title: string; description: string };
  fallback: { title: string; description: string };
  timeframes: { easy: string; moderate: string; hard: string; ongoing: string; immediate: string };
}> = {
  en: {
    quickWins: { title: 'Quick Wins', description: 'Immediate changes you can make today with minimal effort. These are the highest-realism swaps that build momentum.' },
    sustained: { title: 'Sustained Changes', description: 'Changes that require a bit more planning but yield significant long-term savings. Tackle these after your quick wins are habit.' },
    deep: { title: 'Deep Restructuring', description: 'The most impactful but demanding changes. Reserve these for when you have built confidence with the earlier phases.' },
    fallback: { title: 'Recovery Plan', description: 'Implement these changes to begin your financial recovery.' },
    timeframes: { easy: 'Immediate (this month)', moderate: '1-3 months', hard: '3-6 months', ongoing: 'Ongoing', immediate: 'Immediate' },
  },
  ar: {
    quickWins: { title: 'مكاسب سريعة', description: 'تغييرات فورية يمكنك إجراؤها اليوم بأقل جهد. هذه هي البدائل الأكثر واقعية التي تبني الزخم.' },
    sustained: { title: 'تغييرات مستدامة', description: 'تغييرات تتطلب تخطيطًا أكبر لكنها تحقق مدخرات طويلة الأجل كبيرة. تعامل معها بعد أن تصبح مكاسبك السريعة عادة.' },
    deep: { title: 'إعادة هيكلة عميقة', description: 'التغييرات الأكثر تأثيرًا ولكن الأكثر صعوبة. احتفظ بها لما تبني ثقتك في المراحل السابقة.' },
    fallback: { title: 'خطة التعافي', description: 'طبّق هذه التغييرات لبدء تعافيك المالي.' },
    timeframes: { easy: 'فوري (هذا الشهر)', moderate: '1-3 أشهر', hard: '3-6 أشهر', ongoing: 'مستمر', immediate: 'فوري' },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function categoryLabel(lang: ProLang, cat: HabitCategory): string {
  return proCopy[lang][`cat_${cat}` as keyof typeof proCopy[ProLang]];
}

export function frequencyLabel(lang: ProLang, freq: ProFrequency): string {
  return proCopy[lang][`freq_${freq}` as keyof typeof proCopy[ProLang]];
}

export function difficultyLabel(lang: ProLang, diff: 'easy' | 'moderate' | 'hard'): string {
  return proCopy[lang][`diff_${diff}` as keyof typeof proCopy[ProLang]];
}

export function tierLabel(lang: ProLang, tier: PriorityTier): string {
  return proCopy[lang][`tier_${tier}` as keyof typeof proCopy[ProLang]];
}
