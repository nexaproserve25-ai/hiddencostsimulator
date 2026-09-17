import type { SimulationResult } from './calculations';

export interface ChallengePayload { v: 1; title: string; score: number; level: string; lang: 'en' | 'ar'; }
const validTitles = new Set(['fomo_taxpayer', 'emotional_checkout', 'boredom_buyer', 'intentional_buyer', 'weekend_follower', 'mood_spender', 'anti_boredom_department', 'intentional_explorer', 'hustle_follower', 'escape_hustler', 'busy_bee', 'strategic_hustler']);

function encode(value: string): string { return btoa(unescape(encodeURIComponent(value))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function decode(value: string): string { return decodeURIComponent(escape(atob(value.replace(/-/g, '+').replace(/_/g, '/')))); }
export function createChallenge(result: SimulationResult, language: 'en' | 'ar'): string {
  const payload: ChallengePayload = { v: 1, title: result.titleKey, score: result.score, level: result.level, lang: language };
  return `${window.location.origin}/challenge?d=${encode(JSON.stringify(payload))}`;
}
export function readChallenge(value: string | null): ChallengePayload | null {
  if (!value) return null;
  try {
    const data: unknown = JSON.parse(decode(value));
    if (!data || typeof data !== 'object') return null;
    const item = data as Partial<ChallengePayload>;
    if (item.v !== 1 || typeof item.title !== 'string' || !validTitles.has(item.title) || typeof item.score !== 'number' || item.score < 1 || item.score > 100 || !['en', 'ar'].includes(item.lang ?? '')) return null;
    return { v: 1, title: item.title, score: Math.round(item.score), level: typeof item.level === 'string' ? item.level : 'moderate', lang: item.lang as 'en' | 'ar' };
  } catch { return null; }
}
