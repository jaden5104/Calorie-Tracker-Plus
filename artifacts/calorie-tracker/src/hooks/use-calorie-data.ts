import { useState, useEffect, useCallback } from 'react';

export interface CalorieEntry {
  id: string;
  date: string;
  time: string;
  timestamp: string;
  type: "add" | "subtract" | "grams";
  name: string;
  calories: number;
  gramsEaten?: number;
  servingGrams?: number;
  caloriesPerServing?: number;
}

export interface ColorRange {
  id: string;
  label: string;
  min: number;
  max: number | null;
  color: string;
}

const DEFAULT_COLOR_RANGES: ColorRange[] = [
  { id: "1", min: 0, max: 1199, color: "#22c55e", label: "Under 1200" },
  { id: "2", min: 1200, max: 1300, color: "#86efac", label: "1200–1300" },
  { id: "3", min: 1301, max: 1600, color: "#facc15", label: "1301–1600" },
  { id: "4", min: 1601, max: 2000, color: "#ef4444", label: "1601–2000" },
  { id: "5", min: 2001, max: 2300, color: "#6d28d9", label: "2001–2300" },
  { id: "6", min: 2301, max: 3000, color: "#c084fc", label: "2301–3000" },
  { id: "7", min: 3001, max: null, color: "#f3e8ff", label: "3001+" }
];

export function useCalorieData() {
  const [entries, setEntries] = useState<CalorieEntry[]>(() => {
    try {
      const stored = localStorage.getItem('calorie_entries');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [ranges, setRanges] = useState<ColorRange[]>(() => {
    try {
      const stored = localStorage.getItem('color_ranges');
      return stored ? JSON.parse(stored) : DEFAULT_COLOR_RANGES;
    } catch {
      return DEFAULT_COLOR_RANGES;
    }
  });

  useEffect(() => {
    localStorage.setItem('calorie_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('color_ranges', JSON.stringify(ranges));
  }, [ranges]);

  const addEntry = useCallback((entry: Omit<CalorieEntry, 'id' | 'timestamp'>) => {
    const newEntry: CalorieEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const resetRanges = useCallback(() => {
    setRanges(DEFAULT_COLOR_RANGES);
  }, []);

  return {
    entries,
    ranges,
    setRanges,
    addEntry,
    deleteEntry,
    resetRanges
  };
}
