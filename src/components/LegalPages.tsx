import { ArrowLeft, Mail, Shield, FileText, RefreshCw, Zap, Calendar, CreditCard, Lock, AlertTriangle, BookOpen, Ban, ShieldCheck, UserCog, Scale, Receipt } from 'lucide-react';

type Lang = 'en' | 'ar';

interface LegalPageProps {
  lang: Lang;
  onHome: () => void;
}

const LAST_UPDATED = 'September 20, 2026';
const CONTACT_EMAIL = 'support@hiddencostsimulator.com';

function LegalShell({ lang, onHome, title, icon: Icon, children }: { lang: Lang; onHome: () => void; title: string; icon: typeof Shield; children: React.ReactNode }) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  return (
    <div className="app-shell grid-texture" style={{ direction: dir }}>
      <header className="relative z-10 shrink-0 border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-2 lg:px-8 lg:py-2.5">
          <button onClick={onHome} aria-label="Hidden Cost home" className="flex items-center gap-2 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a] text-[#061019] shadow-[0_0_20px_rgba(180,255,58,.25)]"><Zap size={20} strokeWidth={3} fill="currentColor" /></span>
            <span className="font-display leading-none"><strong className="block text-[15px] font-extrabold tracking-tight text-slate-950">Hidden Cost</strong><small className="block pt-0.5 text-[10px] font-semibold text-slate-600">Decision Simulator</small></span>
          </button>
          <button onClick={onHome} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#b4ff3a]/50 hover:text-slate-950">
            <ArrowLeft size={16} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
          <div className="mb-8 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/15 text-[#5a9a32]"><Icon size={28} /></span>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-slate-500" />{isAr ? 'آخر تحديث' : 'Last Updated'}: {LAST_UPDATED}</span>
                <span className="inline-flex items-center gap-1.5"><Mail size={13} className="text-slate-500" />{CONTACT_EMAIL}</span>
              </div>
            </div>
          </div>
          {children}
        </div>
      </main>
      <footer className="shrink-0 border-t border-slate-200/70">
        <div className="mx-auto max-w-7xl px-5 py-4 lg:px-10">
          <p className="text-center text-xs text-slate-500">© 2026 Hidden Cost Simulator. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ num, title, children, isAr }: { num: number; title: string; children: React.ReactNode; isAr: boolean }) {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#b4ff3a]/15 text-sm font-extrabold text-[#5a9a32]">{num}</span>
        <h2 className="font-display text-lg font-bold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{title}</h2>
      </div>
      <div className="mt-3 space-y-3 pl-10 text-sm leading-7 text-slate-800" style={{ paddingLeft: isAr ? 0 : 2.5 * 10, paddingRight: isAr ? 2.5 * 10 : 0 }}>{children}</div>
    </section>
  );
}

function Callout({ icon: Icon, children, tone = 'info' }: { icon: typeof AlertTriangle; children: React.ReactNode; tone?: 'info' | 'warning' }) {
  const styles = tone === 'warning'
    ? 'border-orange-200 bg-orange-50 text-orange-700'
    : 'border-cyan-200 bg-cyan-50 text-cyan-600';
  return (
    <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${styles}`}>
      <Icon size={20} className="mt-0.5 shrink-0" />
      <p className="text-sm leading-6">{children}</p>
    </div>
  );
}

export function PrivacyPolicy({ lang, onHome }: LegalPageProps) {
  const isAr = lang === 'ar';
  const t = isAr ? {
    title: 'سياسة الخصوصية',
    s1: 'مقدمة',
    s1p: 'يلتزم Hidden Cost Simulator بحماية خصوصية مستخدميه. نلتزم بأقل قدر ممكن من جمع البيانات ونكون شفافين بشأن كيفية استخدامها وحمايتها. لا تطلب الأداة إنشاء حساب لاستخدام المحاكي الأساسي، وجميع حسابات المحاكاة تُجرى مباشرة في متصفحك.',
    s2: 'المعلومات التي نجمعها',
    s2p: 'نجمع الحد الأدنى من البيانات اللازمة لتشغيل الخدمة: بيانات اعتماد الحساب (البريد الإلكتروني وكلمة المرور) للمستخدمين المسجلين، والمدخلات التي تقدمها لإجراء المحاكاة المالية، وإحصاءات استخدام مجهولة الهوية تساعدنا في تحسين التجربة.',
    s3: 'معلومات الدفع والفوترة',
    s3p: 'تعمل شركة Lemon Squeezy, LLC كتاجر تسجيل (Merchant of Record) لمعالجة مدفوعاتنا. نحن لا نخزّن أو نعالج تفاصيل بطاقات الدفع أو بيانات البنك على خوادمنا. جميع تفاصيل المعاملة تُعالج بشكل آمن من قبل Lemon Squeezy بما يتوافق مع معايير PCI-DSS.',
    s4: 'كيف نستخدم بياناتك',
    s4p: 'نستخدم بياناتك للحفاظ على حسابك، وتقديم نتائج المحاكاة المالية، وتحسين تجربة المستخدم، وإرسال التحديثات المتعلقة بالمعاملات الأساسية فقط. لا نرسل رسائل تسويقية دون موافقتك الصريحة.',
    s5: 'حماية البيانات والأطراف الثالثة',
    s5p: 'نحن لا نبيع أو نُ monetize بياناتك الشخصية. تتم مشاركة البيانات فقط مع مزودي البنية التحتية الضروريين لتشغيل الخدمة (استضافة الموقع، معالج الدفع، مزود البريد الإلكتروني)، وكلهم ملزمون باتفاقيات سرية.',
    s6: 'حقوق المستخدم',
    s6p: 'يمكنك طلب حذف أو تصدير بياناتك في أي وقت عن طريق المراسلة على',
    s6p2: '. سنستجيب لطلبك خلال 30 يوماً.',
  } : {
    title: 'Privacy Policy',
    s1: 'Introduction',
    s1p: 'Hidden Cost Simulator is committed to protecting user privacy. We collect the minimum data necessary and are transparent about how it is used and safeguarded. The core simulator requires no account, and all simulation calculations run directly in your browser.',
    s2: 'Information We Collect',
    s2p: 'We collect the minimal data needed to operate the service: account credentials (email and password) for registered users, the inputs you provide to run financial simulations, and anonymous usage analytics that help us improve the experience.',
    s3: 'Payment & Billing Information',
    s3p: 'Lemon Squeezy, LLC acts as our Merchant of Record for processing payments. We do NOT store or process payment card details or banking credentials on our servers. All transaction details are processed securely by Lemon Squeezy in compliance with PCI-DSS standards.',
    s4: 'How We Use Your Data',
    s4p: 'We use your data to maintain user accounts, deliver financial simulation results, improve the user experience, and send essential transactional updates only. We do not send marketing communications without your explicit consent.',
    s5: 'Data Protection & Third Parties',
    s5p: 'We do not sell or monetize personal data. Data is shared strictly with infrastructure providers necessary to operate the service (hosting, payment processor, email provider), all bound by confidentiality agreements.',
    s6: 'User Rights',
    s6p: 'You can request data deletion or export at any time by contacting',
    s6p2: '. We will respond to your request within 30 days.',
  };

  return (
    <LegalShell lang={lang} onHome={onHome} title={t.title} icon={Shield}>
      <Section num={1} title={t.s1} isAr={isAr}><p>{t.s1p}</p></Section>
      <Section num={2} title={t.s2} isAr={isAr}><p>{t.s2p}</p></Section>
      <Section num={3} title={t.s3} isAr={isAr}>
        <p>{t.s3p}</p>
        <Callout icon={Lock}><strong>Lemon Squeezy, LLC</strong> — Merchant of Record. PCI-DSS compliant processing.</Callout>
      </Section>
      <Section num={4} title={t.s4} isAr={isAr}><p>{t.s4p}</p></Section>
      <Section num={5} title={t.s5} isAr={isAr}><p>{t.s5p}</p></Section>
      <Section num={6} title={t.s6} isAr={isAr}>
        <p>{t.s6p} <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#5a9a32] underline decoration-[#5a9a32]/40 underline-offset-2 hover:decoration-[#5a9a32]">{CONTACT_EMAIL}</a>{t.s6p2}</p>
      </Section>
    </LegalShell>
  );
}

export function TermsOfService({ lang, onHome }: LegalPageProps) {
  const isAr = lang === 'ar';
  const t = isAr ? {
    title: 'شروط الخدمة',
    s1: 'قبول الشروط',
    s1p: 'بإنشاء حساب أو استخدام Hidden Cost Simulator (hiddencostsimulator.com)، فإنك توافق على هذه الشروط الملزمة. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام الخدمة.',
    s2: 'إخلاء المسؤولية المالية والتعليمية',
    s2p: 'Hidden Cost Simulator هو برنامج تعليمي وتحليلي لدعم القرارات. وهو لا يقدم نصائح مالية أو قانونية أو ضريبية أو استثمارية معتمدة. المحاكاة هي إسقاطات نظرية مبنية على مدخلات المستخدم وافتراضات.',
    s3: 'الاشتراكات والفوترة',
    s3p: 'تُدار وتُفوتر اشتراكات الخطة الاحترافية (Pro) عبر Lemon Squeezy. يمكن للمستخدمين إدارة أو إلغاء اشتراكاتهم المتكررة في أي وقت عبر بوابة العملاء أو إعدادات الحساب.',
    s4: 'الملكية الفكرية',
    s4p: 'جميع البرمجيات والخوارزميات وتصاميم الواجهة والكود والمحتوى هي الملكية الحصرية لـ Hidden Cost Simulator.',
    s5: 'مسؤولية الحساب',
    s5p: 'المستخدمون مسؤولون عن الحفاظ على أمان بيانات اعتماد حسابهم. يجب إبلاغنا فوراً عن أي استخدام غير مصرح به لحسابك.',
    s6: 'حد المسؤولية',
    s6p: 'لا تتحمل Hidden Cost Simulator أي مسؤولية عن القرارات المالية المتخذة بناءً على مخرجات المحاكاة. الأداة لأغراض تعليمية وتأملية فقط.',
  } : {
    title: 'Terms of Service',
    s1: 'Acceptance of Terms',
    s1p: 'By creating an account or using Hidden Cost Simulator (hiddencostsimulator.com), you agree to these binding terms. If you do not agree to any part of them, please do not use the service.',
    s2: 'Financial & Educational Disclaimer',
    s2p: 'Hidden Cost Simulator is educational and analytical decision-support software. It does NOT provide certified financial, legal, tax, or investment advice. Simulations are theoretical projections based on user inputs and assumptions.',
    s3: 'Subscriptions & Billing',
    s3p: 'Pro Plan subscriptions are managed and billed via Lemon Squeezy. Users can manage or cancel their recurring subscriptions at any time via the Customer Portal or account settings.',
    s4: 'Intellectual Property',
    s4p: 'All software, algorithms, UI designs, code, and content are the sole property of Hidden Cost Simulator.',
    s5: 'Account Responsibility',
    s5p: 'Users are responsible for maintaining account credential security. You must notify us immediately of any unauthorized use of your account.',
    s6: 'Limitation of Liability',
    s6p: 'Hidden Cost Simulator bears no liability for financial decisions made based on simulation outputs. The tool is for educational and reflection purposes only.',
  };

  return (
    <LegalShell lang={lang} onHome={onHome} title={t.title} icon={FileText}>
      <Section num={1} title={t.s1} isAr={isAr}><p>{t.s1p}</p></Section>
      <Section num={2} title={t.s2} isAr={isAr}>
        <p>{t.s2p}</p>
        <Callout icon={AlertTriangle} tone="warning"><strong>{isAr ? 'تحذير مهم' : 'CRITICAL'}:</strong> {isAr ? 'هذه الأداة ليست بديلاً عن الاستشارة المالية المهنية.' : 'This tool is not a substitute for professional financial advice.'}</Callout>
      </Section>
      <Section num={3} title={t.s3} isAr={isAr}>
        <p>{t.s3p}</p>
        <Callout icon={CreditCard}><strong>Lemon Squeezy</strong> — {isAr ? 'إدارة الاشتراكات والفوترة' : 'Subscription management & billing'}</Callout>
      </Section>
      <Section num={4} title={t.s4} isAr={isAr}><p>{t.s4p}</p></Section>
      <Section num={5} title={t.s5} isAr={isAr}><p>{t.s5p}</p></Section>
      <Section num={6} title={t.s6} isAr={isAr}><p>{t.s6p}</p></Section>
    </LegalShell>
  );
}

export function RefundPolicy({ lang, onHome }: LegalPageProps) {
  const isAr = lang === 'ar';
  const t = isAr ? {
    title: 'سياسة الاسترداد والإلغاء',
    s1: 'ضمان استرداد المال خلال 14 يوماً',
    s1p: 'نقدم ضمان استرداد كامل بدون أسئلة لمدة 14 يوماً لمشتركي الخطة الاحترافية (Pro) لأول مرة. إذا لم تكن راضياً، نعيد لك المبلغ كاملاً.',
    s2: 'كيفية طلب الاسترداد',
    s2p: 'يمكنك طلب استرداد خلال 14 يوماً من الشراء عن طريق المراسلة على',
    s2p2: ' أو بدء الطلب مباشرة عبر بوابة إيصال Lemon Squeezy.',
    s3: 'مواعيد المعالجة',
    s3p: 'تُعالج عمليات الاسترداد المعتمدة من قبل Lemon Squeezy وتُعاد إلى طريقة الدفع الأصلية خلال 5-10 أيام عمل.',
    s4: 'إلغاء الاشتراك',
    s4p: 'إلغاء الاشتراك يوقف دورات الفوترة المستقبلية مع الحفاظ على الوصول حتى نهاية فترة الفوترة المدفوعة الحالية.',
  } : {
    title: 'Refund & Cancellation Policy',
    s1: '14-Day Money-Back Guarantee',
    s1p: 'We offer a full, no-questions-asked 14-day money-back guarantee for first-time Pro plan subscribers. If you are not satisfied, we will refund your payment in full.',
    s2: 'How to Request a Refund',
    s2p: 'You can request a refund within 14 days of purchase by emailing',
    s2p2: ' or initiating the request directly through your Lemon Squeezy receipt portal.',
    s3: 'Processing Timelines',
    s3p: 'Approved refunds are processed by Lemon Squeezy and credited back to the original payment method within 5–10 business days.',
    s4: 'Subscription Cancellations',
    s4p: 'Canceling a subscription stops future billing cycles while maintaining access until the end of the current paid billing period.',
  };

  return (
    <LegalShell lang={lang} onHome={onHome} title={t.title} icon={RefreshCw}>
      <Section num={1} title={t.s1} isAr={isAr}>
        <p>{t.s1p}</p>
        <Callout icon={ShieldCheck}><strong>14 {isAr ? 'يوماً' : 'days'}</strong> — {isAr ? 'استرداد كامل بدون أسئلة' : 'full refund, no questions asked'}</Callout>
      </Section>
      <Section num={2} title={t.s2} isAr={isAr}>
        <p>{t.s2p} <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#5a9a32] underline decoration-[#5a9a32]/40 underline-offset-2 hover:decoration-[#5a9a32]">{CONTACT_EMAIL}</a>{t.s2p2}</p>
      </Section>
      <Section num={3} title={t.s3} isAr={isAr}>
        <p>{t.s3p}</p>
        <Callout icon={Receipt}><strong>5–10 {isAr ? 'أيام عمل' : 'business days'}</strong> — {isAr ? 'معالجة الاسترداد' : 'refund processing'}</Callout>
      </Section>
      <Section num={4} title={t.s4} isAr={isAr}><p>{t.s4p}</p></Section>
    </LegalShell>
  );
}
