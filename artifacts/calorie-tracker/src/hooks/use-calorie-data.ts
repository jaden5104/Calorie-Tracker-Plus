import { useState, useEffect, useCallback } from 'react';

export interface Ingredient {
  id: string;
  name: string;
  inputMethod: "manual" | "grams";
  calories: number;
  quantity?: number;
  gramsEaten?: number;
  servingGrams?: number;
  caloriesPerServing?: number;
}

export interface CalorieEntry {
  id: string;
  date: string;
  time: string;
  timestamp: string;
  type: "add" | "subtract" | "grams" | "container" | "burned" | "meal";
  name: string;
  calories: number;
  quantity?: number;
  gramsEaten?: number;
  servingGrams?: number;
  caloriesPerServing?: number;
  note?: string;
  startingWeight?: number;
  endingWeight?: number;
  ingredients?: Ingredient[];
}

export interface ColorRange {
  id: string;
  label: string;
  min: number;
  max: number | null;
  color: string;
}

export interface SavedRegularItem {
  id: string;
  name: string;
  calories: number;
  type: "add" | "grams";
  createdAt: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  calories: number;
  ingredients: Ingredient[];
  createdAt: string;
}

export interface AppSettings {
  photoExpirationHours: 24 | 48;
  requireNameForQuickAdjust: boolean;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  photoExpirationHours: 24,
  requireNameForQuickAdjust: true,
};

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

  const [savedRegular, setSavedRegular] = useState<SavedRegularItem[]>(() => {
    try {
      const stored = localStorage.getItem('saved_regular');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>(() => {
    try {
      const stored = localStorage.getItem('saved_meals');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('app_settings');
      if (stored) {
        return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_APP_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('calorie_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('color_ranges', JSON.stringify(ranges));
  }, [ranges]);

  useEffect(() => {
    localStorage.setItem('saved_regular', JSON.stringify(savedRegular));
  }, [savedRegular]);

  useEffect(() => {
    localStorage.setItem('saved_meals', JSON.stringify(savedMeals));
  }, [savedMeals]);

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  const addEntry = useCallback((entry: Omit<CalorieEntry, 'id' | 'timestamp'>) => {
    const newEntry: CalorieEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
  }, []);

  const addEntryToDate = useCallback((entry: Omit<CalorieEntry, 'id'>, date: string) => {
    const newEntry: CalorieEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date,
    };
    setEntries(prev => [newEntry, ...prev]);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const resetRanges = useCallback(() => {
    setRanges(DEFAULT_COLOR_RANGES);
  }, []);

  const addSavedRegular = useCallback((item: Omit<SavedRegularItem, 'id' | 'createdAt'>) => {
    setSavedRegular(prev => [{ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const deleteSavedRegular = useCallback((id: string) => {
    setSavedRegular(prev => prev.filter(i => i.id !== id));
  }, []);

  const addSavedMeal = useCallback((meal: Omit<SavedMeal, 'id' | 'createdAt'>) => {
    setSavedMeals(prev => [{ ...meal, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const deleteSavedMeal = useCallback((id: string) => {
    setSavedMeals(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateSavedMeal = useCallback((id: string, updates: Partial<SavedMeal>) => {
    setSavedMeals(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const updateAppSettings = useCallback((settings: Partial<AppSettings>) => {
    setAppSettings(prev => ({ ...prev, ...settings }));
  }, []);

  return {
    entries,
    ranges,
    savedRegular,
    savedMeals,
    appSettings,
    setRanges,
    addEntry,
    addEntryToDate,
    deleteEntry,
    resetRanges,
    addSavedRegular,
    deleteSavedRegular,
    addSavedMeal,
    deleteSavedMeal,
    updateSavedMeal,
    updateAppSettings,
  };
}
