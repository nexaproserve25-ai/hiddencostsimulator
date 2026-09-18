import { useRef } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, Calendar, Clock, Coins, Download,
  Lightbulb, PiggyBank, Sparkles, Target, TrendingUp, Zap,
} from 'lucide-react';
import Decimal from 'decimal.js';
import type { ProResultData } from './HiddenCostPro';
import type { ProLang } from '@/lib/proI18n';
import { proCopy, categoryLabel, frequencyLabel, difficultyLabel, tierLabel } from '@/lib/proI18n';
import { v3Copy, scenarioName, strategyLabel } from '@/lib/proV3I18n';
import type { ProAnalysisResult } from '@/services/proAnalysisEngine';
import { currencies } from '@/lib/calculations';

// ============================================================================
// FORMATTING
// ============================================================================

function fmtMoney(d: Decimal, currencyCode: string, lang: ProLang): string {
  const currency = currencies.find((c) => c.code === currencyCode) ?? currencies[0];
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.code, maximumFractionDigits: 0 }).format(d.toNumber());
}

function fmtNum(d: Decimal, lang: ProLang, decimals = 1): string {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(d.toNumber());
}

function fmtPct(d: Decimal, lang: ProLang, decimals = 1): string {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(d.toNumber()) + '%';
}

const TIER_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#fb923c', moderate: '#fbbf24', low: '#b4ff3a',
};

// ============================================================================
// PDF REPORT HEADER / FOOTER (deterministic, on every page)
// ============================================================================

function ReportHeader({ lang, data }: { lang: ProLang; data: ProResultData }) {
  const t = v3Copy[lang];
  const isAr = lang === 'ar';
  const genDate = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#b4ff3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={14} strokeWidth={3} fill="currentColor" color="#061019" />
        </span>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#f6f7f2' }}>Hidden Cost Pro</span>
      </div>
      <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: '9px', color: '#64748b' }}>
        <div>{t.reportWebsite}</div>
        <div>{t.reportVersion} · {t.reportGenerated}: {genDate}</div>
      </div>
    </div>
  );
}

function ReportFooter({ lang, page, total }: { lang: ProLang; page: number; total: number }) {
  const t = v3Copy[lang];
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#475569' }}>
      <span>{t.reportDisclaimer}</span>
      <span>{t.page} {page} {t.of} {total}</span>
    </div>
  );
}

// ============================================================================
// PRO RESULTS V3 — FULL DASHBOARD
// ============================================================================

export function ProResultsV3({
  data, analysis, currencyCode, lang, onBack, onDownload, downloading,
}: {
  data: ProResultData;
  analysis: ProAnalysisResult;
  currencyCode: string;
  lang: ProLang;
  onBack: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const t = proCopy[lang];
  const v3 = v3Copy[lang];
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const { calculation } = data;
  const { investmentProjections, priorityRanking, smartSwaps, fireImpact, roadmap, errors } = analysis;

  const totalDirect = calculation.totals.projectionDirectCost;
  const totalOpportunity = calculation.totals.projectionTimeOpportunityCost;
  const totalCombined = calculation.totals.projectionCombinedCost;
  const projectionYears = calculation.projectionYears;

  // Determine if FIRE should be shown (conditional page rule)
  const showFire = fireImpact && fireImpact.status === 'CALCULATED';
  const fireOmitted = fireImpact && fireImpact.status === 'INSUFFICIENT_DATA';

  // Determine page count for PDF
  let pageCount = 4; // summary, compound wealth, priority+swaps, roadmap
  if (fireOmitted || !showFire) pageCount--; // no FIRE page
  if (!investmentProjections) pageCount--; // no compound wealth page

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4 lg:px-8" style={{ direction: dir }}>
      <div className="mx-auto max-w-5xl">
        {/* Header bar */}
        <div className="mb-5 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
            {isAr ? <ArrowRight size={15} /> : <ArrowLeft size={15} />} {t.backToWizard}
          </button>
          <button onClick={onDownload} disabled={downloading} className="flex items-center gap-2 rounded-xl border border-[#b4ff3a]/40 bg-[#b4ff3a]/10 px-4 py-2 text-sm font-bold text-[#b4ff3a] transition hover:bg-[#b4ff3a]/20 disabled:opacity-50">
            <Download size={16} /> {downloading ? t.generating : t.downloadReport}
          </button>
        </div>

        {/* === DETERMINISTIC PDF REPORT === */}
        <div ref={reportRef} data-pro-report className="space-y-5">

          {/* ---------- PAGE 1: Summary ---------- */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1a28] p-5" data-pdf-page="1">
            <ReportHeader lang={lang} data={data} />
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#b4ff3a]">
              <Zap size={12} fill="currentColor" /> {t.reportTitle}
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-white">{v3.personalizedRecoveryBlueprint}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {t.projectionHorizon}: {fmtNum(projectionYears, lang, 0)} {t.years} · {t.hourlyValue}: {fmtMoney(calculation.hourlyValue, currencyCode, lang)}/{t.hr}
            </p>

            {/* Summary cards */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Coins size={15} className="text-[#b4ff3a]" /> {t.directSpending}</div>
                <div className="mt-2 font-display text-2xl font-extrabold text-[#b4ff3a]">{fmtMoney(totalDirect, currencyCode, lang)}</div>
                <p className="mt-1 text-xs text-slate-500">{t.overYears} {fmtNum(projectionYears, lang, 0)} {t.years}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Clock size={15} className="text-cyan-300" /> {t.timeOpportunityCost}</div>
                <div className="mt-2 font-display text-2xl font-extrabold text-cyan-300">{fmtMoney(totalOpportunity, currencyCode, lang)}</div>
                <p className="mt-1 text-xs text-slate-500">{fmtNum(calculation.totals.projectionHours, lang, 0)} {t.hoursLost}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><BarChart3 size={15} className="text-orange-300" /> {t.totalCombinedCost}</div>
                <div className="mt-2 font-display text-2xl font-extrabold text-orange-300">{fmtMoney(totalCombined, currencyCode, lang)}</div>
                <p className="mt-1 text-xs text-slate-500">{t.directPlusOpportunity}</p>
              </div>
            </div>

            {/* Per-habit breakdown */}
            <h2 className="mt-5 flex items-center gap-2 font-display text-lg font-bold text-white"><BarChart3 size={18} className="text-[#b4ff3a]" /> {t.perHabitBreakdown}</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-2 pr-3 font-semibold">{t.colHabit}</th>
                    <th className="pb-2 pr-3 font-semibold">{t.colDirect}</th>
                    <th className="pb-2 pr-3 font-semibold">{t.colOpportunity}</th>
                    <th className="pb-2 pr-3 font-semibold">{t.colCombined}</th>
                    <th className="pb-2 font-semibold">{t.colHours}</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.habits.map((h) => (
                    <tr key={h.id} className="border-b border-white/5">
                      <td className="py-2 pr-3 font-semibold text-white">{h.name}</td>
                      <td className="py-2 pr-3 text-slate-300">{fmtMoney(h.directFinancialCost, currencyCode, lang)}</td>
                      <td className="py-2 pr-3 text-slate-300">{fmtMoney(h.timeOpportunityCost, currencyCode, lang)}</td>
                      <td className="py-2 pr-3 font-bold text-[#b4ff3a]">{fmtMoney(h.combinedCost, currencyCode, lang)}</td>
                      <td className="py-2 text-slate-400">{fmtNum(h.projectionHours, lang, 0)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ReportFooter lang={lang} page={1} total={pageCount} />
          </div>

          {/* ---------- PAGE 2: Compound Wealth ---------- */}
          {investmentProjections && (
            <div className="rounded-2xl border border-[#b4ff3a]/20 bg-[#b4ff3a]/[.04] p-5" data-pdf-page="2">
              <ReportHeader lang={lang} data={data} />
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#b4ff3a]"><TrendingUp size={18} /> {v3.compoundWealthTitle}</h2>
              <p className="mt-1 text-xs text-slate-400">{v3.compoundWealthSub}</p>

              <div className="mt-3 space-y-4">
                {investmentProjections.scenarios.map((scenario) => {
                  const scenarioProjections = investmentProjections.projections.filter((p) => p.scenario === scenario.id);
                  return (
                    <div key={scenario.id} className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                      <div className="text-sm font-bold text-[#b4ff3a]">{scenarioName(lang, scenario.id)}</div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        {scenarioProjections.map((proj) => (
                          <div key={proj.years} className="rounded-lg bg-white/[.03] p-2.5">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400">{v3.horizon}: {proj.years}</div>
                            <div className="mt-1 space-y-0.5 text-xs">
                              <div className="flex justify-between"><span className="text-slate-400">{v3.totalContributions}</span><span className="text-slate-200">{fmtMoney(proj.totalContributions, currencyCode, lang)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">{v3.futureValue}</span><span className="font-bold text-[#b4ff3a]">{fmtMoney(proj.futureValue, currencyCode, lang)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">{v3.growthAmount}</span><span className="text-cyan-300">{fmtMoney(proj.growthAmount, currencyCode, lang)}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-[10px] text-slate-500">{v3.compoundDisclaimer}</p>
              <ReportFooter lang={lang} page={2} total={pageCount} />
            </div>
          )}

          {/* ---------- PAGE 3: Priority + Smart Swaps ---------- */}
          {priorityRanking && smartSwaps && (
            <div className="rounded-2xl border border-white/10 bg-[#0b1a28] p-5" data-pdf-page={investmentProjections ? '3' : '2'}>
              <ReportHeader lang={lang} data={data} />

              {/* Priority Rankings */}
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white"><Target size={18} className="text-[#b4ff3a]" /> {v3.priorityV3Title}</h2>
              <p className="mt-1 text-xs text-slate-400">{v3.priorityV3Sub}</p>
              <div className="mt-3 space-y-2">
                {priorityRanking.rankings.map((r) => (
                  <div key={r.habitId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#b4ff3a] text-xs font-extrabold text-[#07121b]">{r.rank}</span>
                    <div className="min-w-0 flex-1">
                      <b className="block text-sm text-white">{r.habitName}</b>
                      <span className="text-xs text-slate-400">{r.reason}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-[#b4ff3a]">{fmtPct(r.priorityScore.times(100), lang, 1)}</div>
                      <span className="text-[10px] text-slate-500">{v3.priorityScore}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Smart Swaps */}
              <h2 className="mt-5 flex items-center gap-2 font-display text-lg font-bold text-white"><Lightbulb size={18} className="text-[#b4ff3a]" /> {v3.smartSwapTitle}</h2>
              <p className="mt-1 text-xs text-slate-400">{v3.smartSwapSub}</p>
              <div className="mt-3 space-y-2">
                {smartSwaps.recommendations.map((s) => (
                  <div key={s.habitId} className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <b className="block text-sm text-white">{s.habitName}</b>
                        <span className="text-xs font-semibold text-[#b4ff3a]">{strategyLabel(lang, s.strategy)}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold text-[#b4ff3a]">{v3.monthlySaving}: {fmtMoney(s.monthlySaving, currencyCode, lang)}</div>
                        <span className="text-[10px] text-slate-500">{v3.annualRecovery}: {fmtMoney(s.annualRecovery, currencyCode, lang)}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{v3.suggestedReduction}: {fmtPct(s.reductionRate.times(100), lang, 0)}</p>
                    {s.suggestions.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {s.suggestions.map((sug, i) => <li key={i} className="text-[11px] leading-4 text-slate-400">• {sug}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-[#b4ff3a]/10 p-3 text-center">
                  <span className="text-xs text-slate-300">{v3.totalMonthlyRecovery}: </span>
                  <strong className="font-display text-base text-[#b4ff3a]">{fmtMoney(smartSwaps.totalMonthlyRecovery, currencyCode, lang)}</strong>
                </div>
                <div className="rounded-xl bg-[#b4ff3a]/10 p-3 text-center">
                  <span className="text-xs text-slate-300">{v3.totalAnnualRecovery}: </span>
                  <strong className="font-display text-base text-[#b4ff3a]">{fmtMoney(smartSwaps.totalAnnualRecovery, currencyCode, lang)}</strong>
                </div>
              </div>

              <ReportFooter lang={lang} page={investmentProjections ? 3 : 2} total={pageCount} />
            </div>
          )}

          {/* ---------- PAGE 4: FIRE (conditional) ---------- */}
          {showFire && fireImpact && (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[.05] p-5" data-pdf-page={investmentProjections ? '4' : '3'}>
              <ReportHeader lang={lang} data={data} />
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white"><Sparkles size={18} className="text-cyan-300" /> {v3.fireTitle}</h2>
              <p className="mt-1 text-xs text-slate-400">{v3.fireSub}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
                  <div className="text-xs font-semibold text-slate-400">{v3.annualRecovered}</div>
                  <div className="mt-2 font-display text-2xl font-extrabold text-cyan-300">{fmtMoney(fireImpact.annualRecovered, currencyCode, lang)}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
                  <div className="text-xs font-semibold text-slate-400">{v3.portfolioImpact}</div>
                  <div className="mt-2 font-display text-2xl font-extrabold text-[#b4ff3a]">{fmtMoney(fireImpact.potentialPortfolioImpact, currencyCode, lang)}</div>
                  <p className="mt-1 text-xs text-slate-500">Rule of 25</p>
                </div>
              </div>
              <ReportFooter lang={lang} page={investmentProjections ? 4 : 3} total={pageCount} />
            </div>
          )}

          {/* ---------- FIRE Omitted notice (inline, not a separate page) ---------- */}
          {fireOmitted && (
            <p className="text-center text-[11px] text-slate-500">{v3.fireOmitted}</p>
          )}

          {/* ---------- PAGE 5: 180-Day Roadmap ---------- */}
          {roadmap && (
            <div className="rounded-2xl border border-white/10 bg-[#0b1a28] p-5" data-pdf-page={showFire ? (investmentProjections ? '5' : '4') : (investmentProjections ? '4' : '3')}>
              <ReportHeader lang={lang} data={data} />
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white"><PiggyBank size={18} className="text-[#b4ff3a]" /> {v3.roadmapTitle}</h2>
              <p className="mt-1 text-xs text-slate-400">{v3.roadmapSub}</p>

              <div className="mt-3 space-y-3">
                {/* Day 30 */}
                <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#b4ff3a] text-xs font-extrabold text-[#07121b]">30</span>
                      <b className="text-sm text-white">{v3.day30}</b>
                    </div>
                    <span className="text-[10px] text-slate-400">{v3.day30Objective}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400"><b className="text-slate-300">{v3.focusHabits}:</b> {roadmap.day30.focusHabits.length > 0 ? roadmap.day30.focusHabits.join(', ') : v3.none}</p>
                  <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-xs text-slate-400">{v3.monthlyRecovery}</span>
                    <strong className="text-sm text-[#b4ff3a]">{fmtMoney(roadmap.day30.monthlyRecovery, currencyCode, lang)}</strong>
                  </div>
                </div>

                {/* Day 90 */}
                <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#b4ff3a] text-xs font-extrabold text-[#07121b]">90</span>
                      <b className="text-sm text-white">{v3.day90}</b>
                    </div>
                    <span className="text-[10px] text-slate-400">{v3.day90Objective}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400"><b className="text-slate-300">{v3.focusHabits}:</b> {roadmap.day90.focusHabits.length > 0 ? roadmap.day90.focusHabits.join(', ') : v3.none}</p>
                  <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-xs text-slate-400">{v3.monthlyRecovery}</span>
                    <strong className="text-sm text-[#b4ff3a]">{fmtMoney(roadmap.day90.monthlyRecovery, currencyCode, lang)}</strong>
                  </div>
                </div>

                {/* Day 180 */}
                <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#b4ff3a] text-xs font-extrabold text-[#07121b]">180</span>
                      <b className="text-sm text-white">{v3.day180}</b>
                    </div>
                    <span className="text-[10px] text-slate-400">{v3.day180Objective}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400"><b className="text-slate-300">{v3.focusHabits}:</b> {roadmap.day180.focusHabits.length > 0 ? roadmap.day180.focusHabits.join(', ') : v3.none}</p>
                  <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-xs text-slate-400">{v3.totalMonthlyRecoveryAll}</span>
                    <strong className="text-sm text-[#b4ff3a]">{fmtMoney(roadmap.day180.totalMonthlyRecovery, currencyCode, lang)}</strong>
                  </div>
                </div>
              </div>

              <ReportFooter lang={lang} page={pageCount} total={pageCount} />
            </div>
          )}

          {/* Transparency notice — generic wording only, no internal detail */}
          {errors.length > 0 && (
            <div className="rounded-xl border border-orange-400/30 bg-orange-400/10 p-3">
              <p className="text-xs text-orange-200">
                {isAr
                  ? 'لم يتم إدراج بعض أقسام التقرير لعدم توفر معلومات كافية.'
                  : 'Some sections of this report were left out because the information provided was not enough to calculate them.'}
              </p>
            </div>
          )}

          <p className="pb-2 text-center text-[11px] text-slate-600">{t.disclaimer}</p>
        </div>

        <div className="mt-5 flex justify-center">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
            {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />} {t.startOver}
          </button>
        </div>
      </div>
    </div>
  );
}
