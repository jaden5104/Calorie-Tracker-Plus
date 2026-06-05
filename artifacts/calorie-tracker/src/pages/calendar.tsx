import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalorieData } from "../hooks/use-calorie-data";
import { getColorForCalories, getContrastColor } from "../lib/color-utils";
import { Button } from "@/components/ui/button";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { entries, ranges } = useCalorieData();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // padding for first week row
  const startDayOfWeek = monthStart.getDay(); // 0 = Sunday
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

  const getDayTotal = (dateStr: string) => {
    const dayEntries = entries.filter(e => e.date === dateStr);
    if (dayEntries.length === 0) return null;
    const total = dayEntries.reduce((acc, entry) => {
      return acc + (entry.type === 'subtract' ? -entry.calories : entry.calories);
    }, 0);
    return Math.max(0, total);
  };

  return (
    <div className="flex-1 p-6 flex flex-col h-full animate-in fade-in duration-300 bg-white">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Calendar</h1>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
          Today
        </Button>
      </header>

      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-xs font-medium text-gray-400 py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {paddingDays.map(i => (
          <div key={`padding-${i}`} className="aspect-square rounded-xl" />
        ))}
        
        {daysInMonth.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const total = getDayTotal(dateStr);
          const hasData = total !== null;
          
          let bgColor = "#f3f4f6"; // gray-100
          let textColor = "#9ca3af"; // gray-400
          
          if (hasData) {
            const range = getColorForCalories(total, ranges);
            bgColor = range.color;
            textColor = getContrastColor(range.color);
          }

          const isCurrentDay = isToday(day);

          return (
            <Link key={dateStr} href={`/day/${dateStr}`}>
              <div 
                className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-95 active:scale-90 ${isCurrentDay ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                style={hasData ? { backgroundColor: bgColor, color: textColor } : { backgroundColor: bgColor, color: textColor }}
              >
                <span className="text-sm font-semibold">{format(day, "d")}</span>
                {hasData && (
                  <span className="text-[10px] font-medium opacity-90 mt-0.5">{total}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
