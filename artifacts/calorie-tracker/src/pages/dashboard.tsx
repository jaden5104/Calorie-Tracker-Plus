import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useCalorieData, CalorieEntry } from "../hooks/use-calorie-data";
import { getColorForCalories, getContrastColor } from "../lib/color-utils";
import { Plus, Minus, Scale, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Link } from "wouter";

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return <div className="text-sm font-medium text-gray-500">{format(time, "h:mm:ss a")}</div>;
}

export default function Dashboard() {
  const { entries, ranges, addEntry, deleteEntry } = useCalorieData();
  const todayDate = format(new Date(), "yyyy-MM-dd");
  
  const todayEntries = entries.filter(e => e.date === todayDate);
  const totalCalories = todayEntries.reduce((acc, entry) => {
    return acc + (entry.type === 'subtract' ? -entry.calories : entry.calories);
  }, 0);
  const displayCalories = Math.max(0, totalCalories);
  
  const range = getColorForCalories(displayCalories, ranges);
  const badgeTextColor = getContrastColor(range.color);

  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [basicType, setBasicType] = useState<"add" | "subtract">("add");
  const [basicCalories, setBasicCalories] = useState("");
  const [basicName, setBasicName] = useState("");

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cals = parseInt(basicCalories);
    if (isNaN(cals) || cals <= 0) return;

    addEntry({
      date: todayDate,
      time: format(new Date(), "h:mm a"),
      type: basicType,
      name: basicName || (basicType === "add" ? "Quick Add" : "Correction"),
      calories: cals
    });

    setBasicCalories("");
    setBasicName("");
    setIsBasicModalOpen(false);
  };

  const [isGramsModalOpen, setIsGramsModalOpen] = useState(false);
  const [gramsEaten, setGramsEaten] = useState("");
  const [servingGrams, setServingGrams] = useState("");
  const [caloriesPerServing, setCaloriesPerServing] = useState("");
  const [gramsName, setGramsName] = useState("");

  const parsedGramsEaten = parseFloat(gramsEaten) || 0;
  const parsedServingGrams = parseFloat(servingGrams) || 0;
  const parsedCalsPerServing = parseFloat(caloriesPerServing) || 0;
  
  const calcResult = parsedServingGrams > 0 
    ? Math.round((parsedGramsEaten / parsedServingGrams) * parsedCalsPerServing)
    : 0;

  const handleGramsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedGramsEaten <= 0 || parsedServingGrams <= 0 || parsedCalsPerServing <= 0) return;

    addEntry({
      date: todayDate,
      time: format(new Date(), "h:mm a"),
      type: "grams",
      name: gramsName || "Weighed Food",
      calories: calcResult,
      gramsEaten: parsedGramsEaten,
      servingGrams: parsedServingGrams,
      caloriesPerServing: parsedCalsPerServing
    });

    setGramsEaten("");
    setServingGrams("");
    setCaloriesPerServing("");
    setGramsName("");
    setIsGramsModalOpen(false);
  };

  return (
    <div className="flex-1 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Caly</h1>
          <p className="text-sm text-gray-500 font-medium">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <Clock />
      </header>

      <div className="flex flex-col items-center justify-center mb-10 mt-6 relative">
        <div 
          className="w-48 h-48 rounded-full flex flex-col items-center justify-center transition-colors duration-500 shadow-xl"
          style={{ backgroundColor: range.color, color: badgeTextColor }}
        >
          <span className="text-sm font-semibold opacity-90 uppercase tracking-wider">{range.label}</span>
          <span className="text-6xl font-bold tracking-tighter my-1">{displayCalories}</span>
          <span className="text-sm font-medium opacity-80">kcal</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <Dialog open={isBasicModalOpen} onOpenChange={setIsBasicModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2" onClick={() => setBasicType("add")}>
              <div className="bg-primary/10 p-2 rounded-full"><Plus className="w-5 h-5 text-primary" /></div>
              <span className="text-xs">Quick Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Log Calories</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBasicSubmit} className="space-y-4 pt-4">
              <ToggleGroup type="single" value={basicType} onValueChange={(v) => v && setBasicType(v as "add" | "subtract")} className="justify-start">
                <ToggleGroupItem value="add" className="w-full">Add</ToggleGroupItem>
                <ToggleGroupItem value="subtract" className="w-full">Subtract</ToggleGroupItem>
              </ToggleGroup>
              
              <div className="space-y-2">
                <Label htmlFor="cals">Calories</Label>
                <Input 
                  id="cals" 
                  type="number" 
                  inputMode="numeric"
                  value={basicCalories} 
                  onChange={e => setBasicCalories(e.target.value)} 
                  placeholder="e.g. 250"
                  required 
                  min="1"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Note (Optional)</Label>
                <Input 
                  id="name" 
                  value={basicName} 
                  onChange={e => setBasicName(e.target.value)} 
                  placeholder={basicType === "add" ? "e.g. Apple" : "e.g. Correction"} 
                />
              </div>
              <Button type="submit" className="w-full" disabled={!basicCalories || parseInt(basicCalories) <= 0}>
                {basicType === "add" ? "Add" : "Subtract"} {basicCalories} kcal
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isGramsModalOpen} onOpenChange={setIsGramsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
              <div className="bg-primary/10 p-2 rounded-full"><Scale className="w-5 h-5 text-primary" /></div>
              <span className="text-xs">By Grams</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Weigh Food</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGramsSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="servingGrams">Serving Size (g)</Label>
                  <Input id="servingGrams" type="number" inputMode="numeric" value={servingGrams} onChange={e => setServingGrams(e.target.value)} required min="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calsPerServing">Calories per Serving</Label>
                  <Input id="calsPerServing" type="number" inputMode="numeric" value={caloriesPerServing} onChange={e => setCaloriesPerServing(e.target.value)} required min="1" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gramsEaten">Amount Eaten (g)</Label>
                <Input id="gramsEaten" type="number" inputMode="numeric" value={gramsEaten} onChange={e => setGramsEaten(e.target.value)} required min="1" autoFocus />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gramsName">Food Name (Optional)</Label>
                <Input id="gramsName" value={gramsName} onChange={e => setGramsName(e.target.value)} placeholder="e.g. Chicken Breast" />
              </div>
              
              {calcResult > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-center text-gray-600 font-mono">
                  {parsedGramsEaten}g ÷ {parsedServingGrams}g × {parsedCalsPerServing} = <span className="font-bold text-gray-900">{calcResult} kcal</span>
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={calcResult <= 0}>
                Log {calcResult > 0 ? calcResult : ""} kcal
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Link href="/calendar" className="flex flex-col h-auto py-3 gap-2 border rounded-md shadow-sm items-center justify-center text-sm font-medium hover:bg-accent transition-colors">
          <div className="bg-primary/10 p-2 rounded-full"><Plus className="w-5 h-5 text-primary opacity-0" /></div>
          <span className="text-xs">Calendar</span>
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Today's Log</h2>
        {todayEntries.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">No entries yet. Add something!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEntries.map((entry, i) => (
              <Card key={entry.id} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${entry.type === 'subtract' ? 'bg-destructive' : 'bg-primary'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{entry.name}</p>
                      <p className="text-xs text-gray-500">{entry.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold ${entry.type === 'subtract' ? 'text-destructive' : 'text-gray-900'}`}>
                      {entry.type === 'subtract' ? '-' : '+'}{entry.calories}
                    </span>
                    <button 
                      onClick={() => deleteEntry(entry.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
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
