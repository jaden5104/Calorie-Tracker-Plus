import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { CalorieEntry } from "./use-calorie-data";
import {
  GradeThreshold,
  DEFAULT_GRADE_SCALE,
  calculateScore,
  getGradeFromScore,
  getGradeStatus,
  getGradeSummary,
  getStrictnessMultiplier,
  getWeekKey,
  getWeekBoundsForDate,
  isReportAvailable,
} from "../lib/grading-utils";

export interface GradingSettings {
  enabled: boolean;
  goalMin: number;
  goalMax: number;
  strictness: "lenient" | "normal" | "strict";
  notificationsEnabled: boolean;
  noDataHandling: "exclude" | "zero";
  gradeScale: GradeThreshold[];
}

export interface DailyGradeReport {
  id: string;
  date: string;
  totalConsumed: number;
  goalMin: number;
  goalMax: number;
  score: number;
  grade: string;
  gradeColor: string;
  status: "under" | "inside" | "over";
  summary: string;
  createdAt: string;
  updatedAt: string;
  wasRecalculated: boolean;
}

export interface WeeklyGradeReport {
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  dailyScores: { date: string; grade: string; score: number }[];
  averageScore: number;
  grade: string;
  gradeColor: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_GRADING_SETTINGS: GradingSettings = {
  enabled: false,
  goalMin: 1600,
  goalMax: 2000,
  strictness: "normal",
  notificationsEnabled: false,
  noDataHandling: "exclude",
  gradeScale: DEFAULT_GRADE_SCALE,
};

function computeConsumed(entries: CalorieEntry[], dateStr: string): number {
  return entries
    .filter(e => e.date === dateStr && e.type !== "burned")
    .reduce((acc, e) => acc + (e.type === "subtract" ? -e.calories : e.calories), 0);
}

function readDailyReports(): Record<string, DailyGradeReport> {
  try {
    const s = localStorage.getItem("daily_grade_reports");
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

function readWeeklyReports(): Record<string, WeeklyGradeReport> {
  try {
    const s = localStorage.getItem("weekly_grade_reports");
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

function buildWeeklyReport(
  weekKey: string,
  allDailyReports: Record<string, DailyGradeReport>,
  noDataHandling: "exclude" | "zero",
  gradeScale: GradeThreshold[],
  existing?: WeeklyGradeReport
): WeeklyGradeReport | null {
  const weekDates = Object.keys(allDailyReports).filter(
    d => getWeekKey(d) === weekKey
  );
  if (weekDates.length === 0) return null;

  const bounds = getWeekBoundsForDate(weekDates[0]);
  const scores = weekDates.map(d => ({
    date: d,
    grade: allDailyReports[d].grade,
    score: allDailyReports[d].score,
  }));

  const usableScores =
    noDataHandling === "exclude"
      ? scores
      : scores;

  if (usableScores.length === 0) return null;

  const avgScore =
    usableScores.reduce((acc, s) => acc + s.score, 0) / usableScores.length;
  const roundedAvg = Math.round(avgScore * 10) / 10;
  const gradeInfo = getGradeFromScore(roundedAvg, gradeScale);
  const now = new Date().toISOString();

  return {
    weekKey,
    weekStart: bounds.weekStart,
    weekEnd: bounds.weekEnd,
    dailyScores: scores,
    averageScore: roundedAvg,
    grade: gradeInfo.letter,
    gradeColor: gradeInfo.color,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

export function useGrading(entries: CalorieEntry[]) {
  const [settings, setSettings] = useState<GradingSettings>(() => {
    try {
      const s = localStorage.getItem("grading_settings");
      if (s) {
        const p = JSON.parse(s);
        return { ...DEFAULT_GRADING_SETTINGS, ...p, gradeScale: p.gradeScale?.length ? p.gradeScale : DEFAULT_GRADE_SCALE };
      }
    } catch { /* fall through */ }
    return DEFAULT_GRADING_SETTINGS;
  });

  const [dailyReports, setDailyReports] = useState<Record<string, DailyGradeReport>>(readDailyReports);
  const [weeklyReports, setWeeklyReports] = useState<Record<string, WeeklyGradeReport>>(readWeeklyReports);
  const [newReportDates, setNewReportDates] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("grading_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("daily_grade_reports", JSON.stringify(dailyReports));
  }, [dailyReports]);

  useEffect(() => {
    localStorage.setItem("weekly_grade_reports", JSON.stringify(weeklyReports));
  }, [weeklyReports]);

  const buildReport = useCallback(
    (dateStr: string, recalculate: boolean, currentReports: Record<string, DailyGradeReport>): DailyGradeReport | null => {
      if (!isReportAvailable(dateStr)) return null;
      const consumed = computeConsumed(entries, dateStr);
      const multiplier = getStrictnessMultiplier(settings.strictness);
      const score = Math.round(calculateScore(consumed, settings.goalMin, settings.goalMax, multiplier) * 10) / 10;
      const gradeInfo = getGradeFromScore(score, settings.gradeScale);
      const status = getGradeStatus(consumed, settings.goalMin, settings.goalMax);
      const summary = getGradeSummary(status, gradeInfo.letter);
      const now = new Date().toISOString();
      return {
        id: currentReports[dateStr]?.id || crypto.randomUUID(),
        date: dateStr,
        totalConsumed: consumed,
        goalMin: settings.goalMin,
        goalMax: settings.goalMax,
        score,
        grade: gradeInfo.letter,
        gradeColor: gradeInfo.color,
        status,
        summary,
        createdAt: recalculate ? (currentReports[dateStr]?.createdAt || now) : now,
        updatedAt: now,
        wasRecalculated: recalculate,
      };
    },
    [entries, settings]
  );

  const generateDueReports = useCallback(() => {
    if (!settings.enabled) return;

    const currentReports = readDailyReports();
    const trackedDates = [...new Set(entries.map(e => e.date))];
    const fresh: string[] = [];
    const updatedReports = { ...currentReports };

    for (const dateStr of trackedDates) {
      if (!isReportAvailable(dateStr)) continue;
      if (updatedReports[dateStr]) continue;
      const report = buildReport(dateStr, false, currentReports);
      if (report) {
        updatedReports[dateStr] = report;
        fresh.push(dateStr);
      }
    }

    if (fresh.length > 0) {
      setDailyReports(updatedReports);

      const affectedWeeks = new Set(fresh.map(getWeekKey));
      const currentWeekly = readWeeklyReports();
      const updatedWeekly = { ...currentWeekly };
      for (const wk of affectedWeeks) {
        const wr = buildWeeklyReport(wk, updatedReports, settings.noDataHandling, settings.gradeScale, currentWeekly[wk]);
        if (wr) updatedWeekly[wk] = wr;
      }
      setWeeklyReports(updatedWeekly);
      setNewReportDates(fresh);

      if (settings.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
        for (const dateStr of fresh) {
          new Notification("New Calorie Grade Report Available", {
            body: `Your daily grade report for ${format(new Date(dateStr + "T00:00:00"), "MMMM d")} is ready.`,
          });
        }
      }
    } else {
      if (JSON.stringify(updatedReports) !== JSON.stringify(dailyReports)) {
        setDailyReports(updatedReports);
      }
    }
  }, [settings, entries, buildReport, dailyReports]);

  const recalculateReport = useCallback(
    (dateStr: string) => {
      if (!settings.enabled) return;
      const currentReports = readDailyReports();
      const report = buildReport(dateStr, true, currentReports);
      if (!report) return;
      const updatedReports = { ...currentReports, [dateStr]: report };
      setDailyReports(updatedReports);

      const wk = getWeekKey(dateStr);
      const currentWeekly = readWeeklyReports();
      const wr = buildWeeklyReport(wk, updatedReports, settings.noDataHandling, settings.gradeScale, currentWeekly[wk]);
      if (wr) {
        setWeeklyReports(prev => ({ ...prev, [wk]: wr }));
      }
    },
    [buildReport, settings]
  );

  const updateSettings = useCallback((updates: Partial<GradingSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) return "denied";
    return Notification.requestPermission();
  }, []);

  const dismissNewReports = useCallback(() => setNewReportDates([]), []);

  return {
    settings,
    dailyReports,
    weeklyReports,
    newReportDates,
    generateDueReports,
    recalculateReport,
    updateSettings,
    requestNotificationPermission,
    dismissNewReports,
  };
}
