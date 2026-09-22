import { useState } from 'react';
import { ArrowRight, BarChart3, Check, FileText, Lightbulb, Lock, PiggyBank, Sparkles, Target, TrendingUp, X } from 'lucide-react';
import { createCheckoutSession, paymentErrorMessage, type PaymentErrorType } from '@/services/paymentService';
import { usePayment } from '@/context/PaymentContext';
import { useAuth } from '@/context/AuthContext';

type Lang = 'en' | 'ar';

const copy = {
  en: {
    title: 'Unlock Your Personalized Recovery Blueprint',
    sub: 'Get the full financial analysis — compound wealth simulation, priority rankings, smart swaps, FIRE impact, 180-day roadmap, and a professional PDF report.',
    features: [
      'Compound Wealth Simulation (4%, 7%, 8% over 10, 20, 30 years)',
      'Priority Engine — what to optimize first for maximum impact',
      'Smart Swap Recommendations — intelligent reductions',
      'FIRE Independence Impact (Rule of 25)',
      '180-Day Recovery Roadmap',
      'Professional PDF Report — direct download',
      'Unlimited habit entries',
    ],
    unlock: 'Unlock Pro PDF Report',
    processing: 'Redirecting to checkout...',
    secure: 'Secure checkout · One-time payment',
    unlocked: 'Pro features unlocked',
    continueToReport: 'Continue to Report',
  },
  ar: {
    title: 'افتح خطتك الشخصية للتعافي',
    sub: 'احصل على التحليل المالي الكامل — محاكاة الثروة المركّبة، ترتيب الأولويات، البدائل الذكية، تأثير الاستقلال المالي، خارطة طريق 180 يوماً، وتقرير PDF احترافي.',
    features: [
      'محاكاة الثروة المركّبة (4٪، 7٪، 8٪ على 10، 20، 30 سنة)',
      'محرّك الأولويات — ما الذي تحسّنه أولاً لأقصى تأثير',
      'توصيات البدائل الذكية — تخفيضات ذكية',
      'تأثير الاستقلال المالي (قاعدة 25)',
      'خارطة طريق التعافي — 180 يوماً',
      'تقرير PDF احترافي — تحميل مباشر',
      'عدد عادات غير محدود',
    ],
    unlock: 'افتح تقرير برو PDF',
    processing: 'جارٍ التحويل للدفع...',
    secure: 'دفع آمن · دفعة واحدة',
    unlocked: 'تم فتح ميزات برو',
    continueToReport: 'متابعة للتقرير',
  },
};

const FEATURE_ICONS = [TrendingUp, Target, Lightbulb, Sparkles, PiggyBank, FileText, BarChart3];

export function UpgradePanel({ lang, onUnlocked }: { lang: Lang; onUnlocked: () => void }) {
  const t = copy[lang];
  const isAr = lang === 'ar';
  const { paymentStatus, unlockPro, canAccess } = usePayment();
  const { userEmail, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // If already unlocked, show the continue button
  if (canAccess('pdfReport')) {
    return (
      <div className="mx-auto mt-5 w-full max-w-md rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/[.08] p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#5a9a32]">
          <Check size={18} /> {t.unlocked}
        </div>
        <button onClick={onUnlocked} className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#b4ff3a] px-5 py-3 text-sm font-bold text-[#07121b] shadow-[0_10px_30px_rgba(180,255,58,.16)] transition hover:-translate-y-0.5 hover:bg-[#c4ff63]">
          {t.continueToReport} <ArrowRight size={18} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />
        </button>
      </div>
    );
  }

  const handleUnlock = async () => {
    setError(null);
    if (!userEmail) {
      await signInWithGoogle();
      return;
    }
    setProcessing(true);
    const result = createCheckoutSession('pro', userEmail);
    if ('error' in result) {
      setError(result.error.message);
      setProcessing(false);
    }
    // If successful, the browser redirects away — no further action needed
  };

  return (
    <div className="mx-auto mt-5 w-full max-w-md rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/[.06] p-4" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b4ff3a]/15 text-[#5a9a32]">
          <Sparkles size={22} />
        </span>
        <div className="flex-1">
          <b className="block text-sm font-bold text-slate-950" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.title}</b>
          <p className="mt-1 text-xs leading-5 text-slate-800" style={{ textAlign: isAr ? 'right' : 'left' }}>{t.sub}</p>
        </div>
      </div>

      {/* Feature list */}
      <ul className="mt-3 space-y-1.5">
        {t.features.map((feat, i) => {
          const Icon = FEATURE_ICONS[i] ?? Check;
          return (
            <li key={i} className="flex items-center gap-2 text-xs text-slate-800">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#b4ff3a]/15 text-[#5a9a32]">
                <Icon size={12} />
              </span>
              <span style={{ textAlign: isAr ? 'right' : 'left' }}>{feat}</span>
            </li>
          );
        })}
      </ul>

      {/* Unlock button */}
      <button
        onClick={handleUnlock}
        disabled={processing}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b4ff3a] px-5 py-3 text-sm font-bold text-[#07121b] shadow-[0_10px_30px_rgba(180,255,58,.16)] transition hover:-translate-y-0.5 hover:bg-[#c4ff63] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? (
          <>{t.processing}</>
        ) : (
          <><Lock size={16} /> {t.unlock} <ArrowRight size={18} style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} /></>
        )}
      </button>

      <p className="mt-2 text-center text-[11px] text-slate-500">{t.secure}</p>

      {/* Error display */}
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-2.5">
          <X size={15} className="mt-0.5 shrink-0 text-orange-600" />
          <p className="text-xs text-orange-700" style={{ textAlign: isAr ? 'right' : 'left' }}>{error}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAYMENT ERROR DISPLAY — reusable component for error states
// ============================================================================

export function PaymentErrorDisplay({ errorType, lang, onRetry, onDismiss }: { errorType: PaymentErrorType; lang: Lang; onRetry?: () => void; onDismiss?: () => void }) {
  const isAr = lang === 'ar';
  const message = paymentErrorMessage(errorType, lang);
  return (
    <div className="mx-auto mt-4 w-full max-w-md rounded-2xl border border-orange-200 bg-orange-50 p-4" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <div className="flex items-start gap-3">
        <X size={20} className="mt-0.5 shrink-0 text-orange-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-700" style={{ textAlign: isAr ? 'right' : 'left' }}>{message}</p>
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <button onClick={onRetry} className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-400/20">
                {isAr ? 'إعادة المحاولة' : 'Try Again'}
              </button>
            )}
            {onDismiss && (
              <button onClick={onDismiss} className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition hover:border-slate-400">
                {isAr ? 'إغلاق' : 'Dismiss'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
