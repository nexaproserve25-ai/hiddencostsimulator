// ============================================================================
// PAYMENT SERVICE — Provider-agnostic payment layer (V2.0)
//
// The single entry point for every payment operation. UI components must
// never construct checkout URLs directly — they call this service instead.
//
// Backend-ready: replacing createCheckoutSession / verifyLicense with real
// API calls requires NO UI changes.
// ============================================================================

export type PaymentProvider = 'lemonsqueezy' | 'stripe' | 'paddle' | 'gumroad' | 'simulation';
export type Plan = 'pro';

export type PaymentSessionStatus = 'created' | 'redirected' | 'completed' | 'cancelled' | 'failed';

// ============================================================================
// PAYMENT SESSION MODEL — provider-independent
// ============================================================================

export interface PaymentSession {
  id: string;
  provider: string;
  plan: Plan;
  status: PaymentSessionStatus;
  createdAt: Date;
}

// ============================================================================
// PAYMENT ERROR TYPES — never expose raw exceptions to UI
// ============================================================================

export type PaymentErrorType =
  | 'MISSING_CHECKOUT_URL'
  | 'CANCELLED'
  | 'FAILED'
  | 'UNKNOWN';

export interface PaymentError {
  type: PaymentErrorType;
  message: string;
}

// ============================================================================
// CONFIGURATION — read from environment variables
// ============================================================================

function getProvider(): PaymentProvider {
  const raw = import.meta.env.VITE_PAYMENT_PROVIDER as string | undefined;
  if (raw && ['lemonsqueezy', 'stripe', 'paddle', 'gumroad', 'simulation'].includes(raw)) {
    return raw as PaymentProvider;
  }
  // Default to simulation in development mode
  return 'simulation';
}

function getCheckoutUrl(): string | null {
  const raw = import.meta.env.VITE_PAYMENT_CHECKOUT_URL as string | undefined;
  if (raw && raw.trim().length > 0) return raw.trim();
  return null;
}

/**
 * Endpoint that confirms, server-side, that a session was actually paid.
 * This is the ONLY authority that may unlock Pro in a production build.
 * It must answer with JSON `{ "paid": true }` for a genuinely paid session.
 */
function getVerifyUrl(): string | null {
  const raw = import.meta.env.VITE_PAYMENT_VERIFY_URL as string | undefined;
  if (raw && raw.trim().length > 0) return raw.trim();
  return null;
}

/**
 * True only for a local development build. The simulated payment flow is
 * restricted to this, so a deployed bundle can never hand out Pro for free.
 */
function isDevBuild(): boolean {
  try {
    return import.meta.env.DEV === true;
  } catch {
    return false;
  }
}

function simulationAllowed(): boolean {
  return isDevBuild() && getProvider() === 'simulation';
}

/** Session ids are minted by generateSessionId; anything else is not ours. */
function isWellFormedSessionId(value: string): boolean {
  return /^ps_[a-z0-9]{6,40}$/i.test(value);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Creates a checkout session and redirects the user to the payment provider.
 * In development/simulation mode, redirects to /payment/success instead.
 *
 * This method is the ONLY function UI components should call to initiate payment.
 * It never exposes the checkout URL or provider implementation to the caller.
 *
 * Returns a PaymentSession if successful, or a PaymentError if configuration
 * is missing or the redirect fails.
 */
export function createCheckoutSession(plan: Plan): { session: PaymentSession } | { error: PaymentError } {
  const provider = getProvider();
  const checkoutUrl = getCheckoutUrl();

  // Validate configuration. A deployed build with no real provider configured
  // must fail closed rather than fall back to the development simulation.
  const useSimulation = provider === 'simulation' && simulationAllowed();
  if (!useSimulation && !checkoutUrl) {
    return {
      error: {
        type: 'MISSING_CHECKOUT_URL',
        message: 'Payment is temporarily unavailable.',
      },
    };
  }

  const sessionId = generateSessionId();
  const session: PaymentSession = {
    id: sessionId,
    provider,
    plan,
    status: 'created',
    createdAt: new Date(),
  };

  // Persist session for the return flow (NOT as proof of purchase — see security rules)
  persistSession(session);

  try {
    if (useSimulation) {
      // Development simulation only (never reachable in a production build)
      session.status = 'redirected';
      persistSession(session);
      window.location.href = '/payment/success?session_id=' + sessionId;
    } else {
      // Production — redirect to external checkout URL
      session.status = 'redirected';
      persistSession(session);
      window.location.href = checkoutUrl!;
    }

    return { session };
  } catch {
    return {
      error: {
        type: 'UNKNOWN',
        message: 'Unexpected payment error.',
      },
    };
  }
}

/**
 * Handles the payment success return flow.
 *
 * Entitlement is granted ONLY when an authority outside the browser confirms
 * the payment: the configured verification endpoint (VITE_PAYMENT_VERIFY_URL),
 * which reads the provider webhook result server-side. A matching session id in
 * browser storage is not proof of purchase — the browser wrote it itself — so it
 * is used purely to correlate the return, never to authorize.
 *
 * The simulated unlock is confined to a local development build.
 */
export async function handlePaymentSuccess(
  sessionId?: string | null,
): Promise<{ verified: boolean } | { error: PaymentError }> {
  const session = readSession();
  const verifyUrl = getVerifyUrl();
  const provider = getProvider();

  // If a verification endpoint is configured, it is the sole authority.
  if (verifyUrl && sessionId && isWellFormedSessionId(sessionId) && session && session.id === sessionId) {
    const paid = await verifyLicense(verifyUrl, sessionId);
    if (!paid) {
      if (session) { session.status = 'failed'; persistSession(session); }
      return {
        error: {
          type: 'FAILED',
          message: 'We couldn\'t complete your payment. Please try again.',
        },
      };
    }
    session.status = 'completed';
    persistSession(session);
    return { verified: true };
  }

  // Development simulation only — never reachable in a production build.
  if (simulationAllowed() && sessionId && session && session.id === sessionId) {
    session.status = 'completed';
    persistSession(session);
    return { verified: true };
  }

  // A return to the success page is NOT proof of payment. The browser reaches
  // this page by navigating to it, and `status === 'redirected'` was written by
  // this same browser before it left for the provider, so neither fact can
  // authorize anything. Without a verification authority outside the browser
  // there is nothing left to check, so fail closed.
  void provider;

  // No session to correlate and no verification authority: fail closed.
  if (session) { session.status = 'failed'; persistSession(session); }
  return {
    error: {
      type: 'UNKNOWN',
      message: 'Unexpected payment error.',
    },
  };
}

/**
 * Asks the server whether this session was really paid.
 * Any non-affirmative answer, network failure, or malformed response is
 * treated as "not paid".
 */
async function verifyLicense(verifyUrl: string, sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, plan: 'pro' }),
    });
    if (!response.ok) return false;
    const data: unknown = await response.json();
    return !!data && typeof data === 'object' && (data as { paid?: unknown }).paid === true;
  } catch {
    return false;
  }
}

/**
 * Records a checkout session for the return flow, then navigates straight to the
 * provider's checkout page. The session is what lets the success page correlate
 * the return with a verification request; without it a genuine buyer cannot be
 * confirmed. Navigation is a direct assignment so no router state is involved.
 */
export function beginCheckoutAndRedirect(plan: Plan, checkoutUrl: string): void {
  try {
    const session: PaymentSession = {
      id: generateSessionId(),
      provider: getProvider(),
      plan,
      status: 'redirected',
      createdAt: new Date(),
    };
    persistSession(session);
  } catch { /* storage unavailable: continue to checkout regardless */ }
  window.location.href = checkoutUrl;
}

/**
 * Handles the payment cancel return flow.
 */
export function handlePaymentCancel(): void {
  const session = readSession();
  if (session) {
    session.status = 'cancelled';
    persistSession(session);
  }
}

/**
 * Re-confirms a stored entitlement at startup.
 *
 * A session object in browser storage is written by the browser itself, so
 * `status === 'completed'` inside it is a claim, not proof. It is therefore used
 * only to find WHICH session to ask about; the answer comes from the
 * verification endpoint. With no endpoint configured there is no authority to
 * ask, so nothing is granted (outside a local development build).
 */
export async function confirmStoredEntitlement(): Promise<boolean> {
  const session = readSession();
  if (!session || session.status !== 'completed') return false;
  if (!isWellFormedSessionId(session.id)) return false;

  const verifyUrl = getVerifyUrl();
  if (verifyUrl) return verifyLicense(verifyUrl, session.id);

  // Development simulation only — never reachable in a production build.
  return simulationAllowed();
}

/**
 * Clears the payment session from local storage.
 */
export function clearPaymentSession(): void {
  try {
    sessionStorage.removeItem('hcs-payment-session');
    localStorage.removeItem('hcs-payment-session');
    // Legacy unlock flag from an earlier build; no longer honoured anywhere.
    sessionStorage.removeItem('hcs-pro-unlocked');
    localStorage.removeItem('hcs-pro-unlocked');
  } catch { /* storage unavailable */ }
}

// ============================================================================
// SESSION STORAGE — ephemeral, NOT proof of purchase
// ============================================================================

const SESSION_KEY = 'hcs-payment-session';

function generateSessionId(): string {
  // Cryptographically strong: this id is the value a verification endpoint is
  // asked about, so a guessable id would let one visitor claim another's
  // purchase. Falls back to a weaker scheme only where Web Crypto is missing.
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    let out = '';
    for (const b of bytes) out += b.toString(16).padStart(2, '0');
    return 'ps_' + out;
  } catch {
    return 'ps_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

function persistSession(session: PaymentSession): void {
  try {
    const json = JSON.stringify(session);
    sessionStorage.setItem(SESSION_KEY, json);
    localStorage.setItem(SESSION_KEY, json);
  } catch { /* storage unavailable */ }
}

function readSession(): PaymentSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PaymentSession;
    parsed.createdAt = new Date(parsed.createdAt);
    return parsed;
  } catch {
    return null;
  }
}

// ============================================================================
// USER-FACING ERROR MESSAGES — bilingual
// ============================================================================

export function paymentErrorMessage(type: PaymentErrorType, lang: 'en' | 'ar'): string {
  const messages: Record<PaymentErrorType, { en: string; ar: string }> = {
    MISSING_CHECKOUT_URL: {
      en: 'Payment is temporarily unavailable.',
      ar: 'الدفع غير متاح مؤقتاً.',
    },
    CANCELLED: {
      en: 'Your purchase was cancelled. You can continue using the free version or upgrade later.',
      ar: 'تم إلغاء عملية الشراء. يمكنك الاستمرار باستخدام النسخة المجانية أو الترقية لاحقاً.',
    },
    FAILED: {
      en: 'We couldn\'t complete your payment. Please try again.',
      ar: 'تعذر إتمام عملية الدفع. يرجى المحاولة مرة أخرى.',
    },
    UNKNOWN: {
      en: 'Unexpected payment error.',
      ar: 'خطأ غير متوقع في الدفع.',
    },
  };
  return messages[type][lang];
}
