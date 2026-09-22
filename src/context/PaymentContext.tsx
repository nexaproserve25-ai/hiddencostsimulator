import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface FeatureAccess {
  pdfReport: boolean;
  wealthSimulation: boolean;
  priorityEngine: boolean;
  smartSwap: boolean;
  fireAnalysis: boolean;
  roadmap180: boolean;
  unlimitedHabits: boolean;
}

const FREE_ACCESS: FeatureAccess = {
  pdfReport: false,
  wealthSimulation: false,
  priorityEngine: false,
  smartSwap: false,
  fireAnalysis: false,
  roadmap180: false,
  unlimitedHabits: false,
};

const PRO_ACCESS: FeatureAccess = {
  pdfReport: true,
  wealthSimulation: true,
  priorityEngine: true,
  smartSwap: true,
  fireAnalysis: true,
  roadmap180: true,
  unlimitedHabits: true,
};

export type PaymentStatus = 'LOCKED' | 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface PaymentState {
  paymentStatus: PaymentStatus;
  featureAccess: FeatureAccess;
}

interface PaymentContextValue extends PaymentState {
  unlockPro: () => void;
  lockPro: () => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  canAccess: (feature: keyof FeatureAccess) => boolean;
}

const PaymentContext = createContext<PaymentContextValue | null>(null);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatusState] = useState<PaymentStatus>('LOCKED');

  useEffect(() => {
    let cancelled = false;

    async function checkEntitlement() {
      if (!user) {
        setPaymentStatusState('LOCKED');
        return;
      }

      const { data, error } = await supabase.rpc('has_active_entitlement');
      if (cancelled) return;
      if (!error && data === true) {
        setPaymentStatusState('PAID');
      } else {
        setPaymentStatusState('LOCKED');
      }
    }

    checkEntitlement();
    return () => { cancelled = true; };
  }, [user]);

  const featureAccess: FeatureAccess = paymentStatus === 'PAID' ? PRO_ACCESS : FREE_ACCESS;

  const unlockPro = () => setPaymentStatusState('PAID');
  const lockPro = () => setPaymentStatusState('LOCKED');
  const setPaymentStatus = (status: PaymentStatus) => setPaymentStatusState(status);

  const canAccess = (feature: keyof FeatureAccess): boolean => featureAccess[feature];

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

export function usePayment(): PaymentContextValue {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayment must be used within a PaymentProvider');
  return ctx;
}

export const FREE_HABIT_LIMIT = 3;
