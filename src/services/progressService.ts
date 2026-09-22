import { supabase } from '@/lib/supabase';

export interface ProgressData {
  day: number;
  baselineMonthlySpend: number;
  currentMonthlySpend: number;
  moneyRecovered: number;
  timeRecoveredHours: number;
  timeRecoveredMinutes: number;
  lifeScore: number;
  hourlyRate: number;
  checkIns: { day: number; recoveredMoney: number; recoveredHours: number; recoveredMinutes: number }[];
}

const DEFAULT_PROGRESS: ProgressData = {
  day: 1,
  baselineMonthlySpend: 500,
  currentMonthlySpend: 500,
  moneyRecovered: 0,
  timeRecoveredHours: 0,
  timeRecoveredMinutes: 0,
  lifeScore: 50,
  hourlyRate: 25,
  checkIns: [],
};

export async function loadProgress(userId: string): Promise<ProgressData | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    day: data.day,
    baselineMonthlySpend: Number(data.baseline_monthly_spend),
    currentMonthlySpend: Number(data.current_monthly_spend),
    moneyRecovered: Number(data.money_recovered),
    timeRecoveredHours: data.time_recovered_hours,
    timeRecoveredMinutes: data.time_recovered_minutes,
    lifeScore: data.life_score,
    hourlyRate: Number(data.hourly_rate),
    checkIns: data.check_ins ?? [],
  };
}

export async function saveProgress(userId: string, progress: ProgressData): Promise<boolean> {
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      day: progress.day,
      baseline_monthly_spend: progress.baselineMonthlySpend,
      current_monthly_spend: progress.currentMonthlySpend,
      money_recovered: progress.moneyRecovered,
      time_recovered_hours: progress.timeRecoveredHours,
      time_recovered_minutes: progress.timeRecoveredMinutes,
      life_score: progress.lifeScore,
      hourly_rate: progress.hourlyRate,
      check_ins: progress.checkIns,
      updated_at: new Date().toISOString(),
    });

  return !error;
}

export { DEFAULT_PROGRESS };
