export interface GradeThreshold {
  letter: string;
  minScore: number;
  color: string;
}

export const DEFAULT_GRADE_SCALE: GradeThreshold[] = [
  { letter: "A+", minScore: 97, color: "#16a34a" },
  { letter: "A",  minScore: 93, color: "#16a34a" },
  { letter: "A-", minScore: 90, color: "#16a34a" },
  { letter: "B+", minScore: 87, color: "#86efac" },
  { letter: "B",  minScore: 83, color: "#86efac" },
  { letter: "B-", minScore: 80, color: "#86efac" },
  { letter: "C+", minScore: 77, color: "#facc15" },
  { letter: "C",  minScore: 73, color: "#facc15" },
  { letter: "C-", minScore: 70, color: "#facc15" },
  { letter: "D+", minScore: 67, color: "#f97316" },
  { letter: "D",  minScore: 63, color: "#f97316" },
  { letter: "D-", minScore: 60, color: "#f97316" },
  { letter: "F",  minScore: 0,  color: "#ef4444" },
];

export function calculateScore(
  totalConsumed: number,
  goalMin: number,
  goalMax: number,
  strictnessMultiplier: number
): number {
  if (totalConsumed >= goalMin && totalConsumed <= goalMax) return 100;
  let deviationPercent: number;
  if (totalConsumed < goalMin) {
    deviationPercent = goalMin > 0 ? ((goalMin - totalConsumed) / goalMin) * 100 : 100;
  } else {
    deviationPercent = goalMax > 0 ? ((totalConsumed - goalMax) / goalMax) * 100 : 100;
  }
  return Math.max(0, Math.min(100, 100 - deviationPercent * strictnessMultiplier));
}

export function getGradeFromScore(score: number, scale: GradeThreshold[]): GradeThreshold {
  for (const t of scale) {
    if (score >= t.minScore) return t;
  }
  return scale[scale.length - 1];
}

export function getGradeStatus(totalConsumed: number, goalMin: number, goalMax: number): "under" | "inside" | "over" {
  if (totalConsumed < goalMin) return "under";
  if (totalConsumed > goalMax) return "over";
  return "inside";
}

export function getGradeSummary(status: "under" | "inside" | "over", grade: string): string {
  if (status === "inside") return "You landed inside your goal range.";
  if (status === "under") {
    if (grade.startsWith("A")) return "Slightly under your goal range — close!";
    if (grade.startsWith("B")) return "Under your goal range. Try to eat a bit more.";
    return "Well under your goal range.";
  }
  if (grade.startsWith("A")) return "Slightly over your goal range — close!";
  if (grade.startsWith("B")) return "A bit over your goal range.";
  return "Over your goal range.";
}

export function getStrictnessMultiplier(strictness: "lenient" | "normal" | "strict"): number {
  if (strictness === "lenient") return 1.5;
  if (strictness === "strict") return 2.5;
  return 2;
}

export function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  const year = sunday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const weekNum = Math.ceil(
    ((sunday.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
  );
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

export function getWeekBoundsForDate(dateStr: string): { weekStart: string; weekEnd: string } {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return {
    weekStart: sunday.toISOString().slice(0, 10),
    weekEnd: saturday.toISOString().slice(0, 10),
  };
}

export function isReportAvailable(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  d.setHours(0, 30, 0, 0);
  return Date.now() >= d.getTime();
}

export function reportAvailableAt(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  d.setHours(0, 30, 0, 0);
  return d;
}

export function getContrastForGrade(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "#000000" : "#ffffff";
}
