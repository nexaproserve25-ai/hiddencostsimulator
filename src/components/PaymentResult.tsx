import { useEffect, useState, useRef } from 'react';
import { Check, X, Loader2, Zap } from 'lucide-react';
import { handlePaymentSuccess, handlePaymentCancel } from '@/services/paymentService';
import { usePayment } from '@/context/PaymentContext';

type Lang = 'en' | 'ar';

const copy = {
  en: {
    successTitle: 'Payment Successful!',
    successSub: 'Your Pro features are now unlocked. Redirecting you to your report...',
    successBtn: 'Go to Report',
    cancelTitle: 'Purchase Cancelled',
    cancelSub: 'You can continue using the free version or upgrade later.',
    cancelBtn: 'Back to Home',
    errorTitle: 'Payment Error',
    errorSub: 'Something went wrong. Please try again.',
    retryBtn: 'Try Again',
    homeBtn: 'Back to Home',
  },
  ar: {
    successTitle: 'تم الدفع بنجاح!',
    successSub: 'تم فتح ميزات برو. جارٍ تحويلك إلى تقريرك...',
    successBtn: 'اذهب للتقرير',
    cancelTitle: 'تم إلغاء الشراء',
    cancelSub: 'يمكنك الاستمرار باستخدام النسخة المجانية أو الترقية لاحقاً.',
    cancelBtn: 'العودة للرئيسية',
    errorTitle: 'خطأ في الدفع',
    errorSub: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    retryBtn: 'إعادة المحاولة',
    homeBtn: 'العودة للرئيسية',
  },
};

// ============================================================================
// PAYMENT SUCCESS PAGE
// ============================================================================

export function PaymentSuccess({ lang, onContinue, onFailed }: { lang: Lang; onContinue: () => void; onFailed: () => void }) {
  const t = copy[lang];
  const isAr = lang === 'ar';
  const { unlockPro } = usePayment();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id') ?? '';

    // Verification happens outside the browser; access is granted only if it confirms.
    handlePaymentSuccess(sessionId).then((result) => {
      if (cancelled) return;
      if ('verified' in result && result.verified) {
        unlockPro();
        setVerified(true);
        if (!redirected.current) {
          redirected.current = true;
          setTimeout(() => onContinue(), 2000);
        }
      } else {
        setError(true);
      }
    }).catch(() => {
      if (!cancelled) setError(true);
    });

    return () => { cancelled = true; };
  }, [unlockPro, onContinue]);

  return (
    <div className="app-shell grid-texture flex flex-1 flex-col items-center justify-center px-5" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <div className="max-w-md text-center">
        {!verified && !error && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/10">
              <Loader2 size={32} className="animate-spin text-[#b4ff3a]" />
            </div>
            <p className="text-base font-bold text-slate-200">{isAr ? 'جارٍ التحقق...' : 'Verifying payment...'}</p>
          </>
        )}

        {verified && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b4ff3a]/30 bg-[#b4ff3a]/10">
              <Check size={32} className="text-[#b4ff3a]" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-white">{t.successTitle}</h1>
            <p className="mt-2 text-sm text-slate-400">{t.successSub}</p>
            <button onClick={onContinue} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#b4ff3a] px-5 py-3 text-sm font-bold text-[#07121b] shadow-[0_10px_30px_rgba(180,255,58,.16)] transition hover:-translate-y-0.5 hover:bg-[#c4ff63]">
              {t.successBtn}
            </button>
          </>
        )}

        {error && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-400/10">
              <X size={32} className="text-orange-400" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-white">{t.errorTitle}</h1>
            <p className="mt-2 text-sm text-slate-400">{t.errorSub}</p>
            <button onClick={onFailed} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.04] px-5 py-3 text-sm font-bold text-white transition hover:border-[#b4ff3a]/60">
              {t.homeBtn}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PAYMENT CANCEL PAGE
// ============================================================================

export function PaymentCancel({ lang, onHome }: { lang: Lang; onHome: () => void }) {
  const t = copy[lang];
  const isAr = lang === 'ar';

  useEffect(() => {
    handlePaymentCancel();
  }, []);

  return (
    <div className="app-shell grid-texture flex flex-1 flex-col items-center justify-center px-5" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-400/30 bg-slate-400/10">
          <X size={32} className="text-slate-400" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white">{t.cancelTitle}</h1>
        <p className="mt-2 text-sm text-slate-400">{t.cancelSub}</p>
        <button onClick={onHome} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.04] px-5 py-3 text-sm font-bold text-white transition hover:border-[#b4ff3a]/60">
          {t.cancelBtn}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// HEADER for payment pages (minimal, no navigation)
// ============================================================================

export function PaymentHeader({ lang }: { lang: Lang }) {
  const isAr = lang === 'ar';
  return (
    <header className="relative z-10 shrink-0 border-b border-white/[.07]">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-2 lg:px-10">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4ff3a] text-[#061019] shadow-[0_0_20px_rgba(180,255,58,.25)]">
          <Zap size={20} strokeWidth={3} fill="currentColor" />
        </span>
        <span className="font-display leading-none">
          <strong className="block text-[15px] font-extrabold tracking-tight">Hidden Cost</strong>
          <small className="block pt-0.5 text-[10px] font-medium text-slate-300">{isAr ? 'الدفع' : 'Checkout'}</small>
        </span>
      </div>
    </header>
  );
}
