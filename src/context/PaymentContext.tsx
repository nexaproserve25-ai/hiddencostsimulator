import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { confirmStoredEntitlement, clearPaymentSession } from '@/services/paymentService';

// ============================================================================
// FEATURE ACCESS SYSTEM — centralized permission object
//
// The UI checks feature permissions rather than payment flags.
// This supports future subscription tiers without code duplication.
// ============================================================================

export interface FeatureAccess {
  pdfReport: boolean;
  wealthSimulation: boolean;
  priorityEngine: boolean;
  smartSwap: boolean;
  fireAnalysis: boolean;
  roadmap180: boolean;
  unlimitedHabits: boolean;
}

// Free tier: all premium features locked
const FREE_ACCESS: FeatureAccess = {
  pdfReport: false,
  wealthSimulation: false,
  priorityEngine: false,
  smartSwap: false,
  fireAnalysis: false,
  roadmap180: false,
  unlimitedHabits: false,
};

// Pro tier: all features unlocked
const PRO_ACCESS: FeatureAccess = {
  pdfReport: true,
  wealthSimulation: true,
  priorityEngine: true,
  smartSwap: true,
  fireAnalysis: true,
  roadmap180: true,
  unlimitedHabits: true,
};

// ============================================================================
// PAYMENT STATE
// ============================================================================

export type PaymentStatus = 'LOCKED' | 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface PaymentState {
  paymentStatus: PaymentStatus;
  featureAccess: FeatureAccess;
}

interface PaymentContextValue extends PaymentState {
  /** Unlocks all Pro features. Only the verified payment return flow may call this. */
  unlockPro: () => void;
  /** Locks all features back to free tier */
  lockPro: () => void;
  /** Sets a specific payment status without changing feature access */
  setPaymentStatus: (status: PaymentStatus) => void;
  /** Checks a single feature permission */
  canAccess: (feature: keyof FeatureAccess) => boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const PaymentContext = createContext<PaymentContextValue | null>(null);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [paymentStatus, setPaymentStatusState] = useState<PaymentStatus>('LOCKED');

  // On mount, restore access only if an authority OUTSIDE the browser confirms
  // the stored session was really paid. Storage is used to decide which session
  // to ask about, never as the answer, because the browser writes it itself.
  useEffect(() => {
    let cancelled = false;
    confirmStoredEntitlement()
      .then((paid) => { if (!cancelled && paid) setPaymentStatusState('PAID'); })
      .catch(() => { /* unconfirmed: stay locked */ });
    return () => { cancelled = true; };
  }, []);

  const featureAccess: FeatureAccess = paymentStatus === 'PAID' ? PRO_ACCESS : FREE_ACCESS;

  const unlockPro = () => {
    // Called only after the payment service has verified the session.
    setPaymentStatusState('PAID');
  };

  const lockPro = () => {
    setPaymentStatusState('LOCKED');
    clearPaymentSession();
  };

  const setPaymentStatus = (status: PaymentStatus) => {
    setPaymentStatusState(status);
  };

  const canAccess = (feature: keyof FeatureAccess): boolean => {
    return featureAccess[feature];
  };

  const value: PaymentContextValue = {
    paymentStatus,
    featureAccess,
    unlockPro,
    lockPro,
    setPaymentStatus,
    canAccess,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

// ============================================================================
// HOOK — components use this to check feature permissions
// ============================================================================

export function usePayment(): PaymentContextValue {
  const ctx = useContext(PaymentContext);
  if (!ctx) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return ctx;
}

// ============================================================================
// HELPER — free habit limit for non-Pro users
// ============================================================================

export const FREE_HABIT_LIMIT = 3;
