import { useRoute, Link } from "wouter";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useCalorieData } from "../hooks/use-calorie-data";
import { getColorForCalories, getContrastColor } from "../lib/color-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DayDetail() {
  const [, params] = useRoute("/day/:date");
  const dateStr = params?.date;
  const { entries, ranges, deleteEntry } = useCalorieData();

  if (!dateStr) return null;

  const dayDate = parseISO(dateStr);
  const dayEntries = entries.filter(e => e.date === dateStr);
  const totalCalories = dayEntries.reduce((acc, entry) => {
    return acc + (entry.type === 'subtract' ? -entry.calories : entry.calories);
  }, 0);
  const displayCalories = Math.max(0, totalCalories);
  
  const range = getColorForCalories(displayCalories, ranges);
  const badgeTextColor = getContrastColor(range.color);

  return (
    <div className="flex-1 p-6 flex flex-col h-full animate-in slide-in-from-right-4 duration-300 bg-gray-50 overflow-y-auto">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/calendar">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{format(dayDate, "MMMM d, yyyy")}</h1>
        </div>
      </header>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center mb-8">
        <div 
          className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          style={{ backgroundColor: range.color, color: badgeTextColor }}
        >
          {dayEntries.length > 0 ? range.label : "No Data"}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-extrabold tracking-tighter text-gray-900">{displayCalories}</span>
          <span className="text-gray-500 font-medium">kcal</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Entries</h2>
        {dayEntries.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">No entries for this day.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEntries.map((entry, i) => (
              <Card key={entry.id} className="animate-in fade-in slide-in-from-bottom-2 shadow-sm border-none" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-12 rounded-full ${entry.type === 'subtract' ? 'bg-destructive' : 'bg-primary'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{entry.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{entry.time}</p>
                      {entry.type === 'grams' && (
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">
                          {entry.gramsEaten}g ({entry.caloriesPerServing}cal/{entry.servingGrams}g)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold ${entry.type === 'subtract' ? 'text-destructive' : 'text-gray-900'}`}>
                      {entry.type === 'subtract' ? '-' : '+'}{entry.calories}
                    </span>
                    <button 
                      onClick={() => deleteEntry(entry.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
