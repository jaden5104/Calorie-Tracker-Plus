import { useState } from "react";
import { useRoute, Link } from "wouter";
import { format, parseISO, isToday } from "date-fns";
import { ArrowLeft, Trash2, Plus, Scale, Flame, ChefHat, MoreHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";
import { useCalorieData, CalorieEntry, Ingredient } from "../hooks/use-calorie-data";
import { getColorForCalories, getContrastColor } from "../lib/color-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

function AddIngredientForm({ onAdd }: { onAdd: (ing: Ingredient) => void }) {
  const [method, setMethod] = useState<"manual" | "grams">("manual");
  const [name, setName] = useState("");
  const [cals, setCals] = useState("");
  const [grams, setGrams] = useState("");
  const [serving, setServing] = useState("");
  const [calsPs, setCalsPs] = useState("");

  const calcCals = method === "grams" && parseFloat(grams) > 0 && parseFloat(serving) > 0 && parseFloat(calsPs) > 0
    ? Math.round((parseFloat(grams) / parseFloat(serving)) * parseFloat(calsPs)) : 0;
  const canAdd = name.trim() && (method === "manual" ? parseInt(cals) > 0 : calcCals > 0);

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({ id: crypto.randomUUID(), name: name.trim(), inputMethod: method, calories: method === "manual" ? parseInt(cals) : calcCals, ...(method === "grams" ? { gramsEaten: parseFloat(grams), servingGrams: parseFloat(serving), caloriesPerServing: parseFloat(calsPs) } : {}) });
    setName(""); setCals(""); setGrams(""); setServing(""); setCalsPs("");
  };

  return (
    <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMethod("manual")} className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${method === "manual" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>Manual</button>
        <button type="button" onClick={() => setMethod("grams")} className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${method === "grams" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>By Grams</button>
      </div>
      <Input placeholder="Ingredient name" value={name} onChange={e => setName(e.target.value)} />
      {method === "manual" ? (
        <Input type="number" placeholder="Calories" value={cals} onChange={e => setCals(e.target.value)} />
      ) : (
        <div className="grid grid-cols-3 gap-1">
          <Input type="number" placeholder="g eaten" value={grams} onChange={e => setGrams(e.target.value)} />
          <Input type="number" placeholder="serving g" value={serving} onChange={e => setServing(e.target.value)} />
          <Input type="number" placeholder="cal/srv" value={calsPs} onChange={e => setCalsPs(e.target.value)} />
        </div>
      )}
      <Button size="sm" className="w-full" onClick={handleAdd} disabled={!canAdd}>Add Ingredient</Button>
    </div>
  );
}

interface PastDayAction {
  label: string;
  onConfirm: () => void;
}

function PastDayConfirm({ action, dateLabel, onClose }: { action: PastDayAction | null; dateLabel: string; onClose: () => void }) {
  return (
    <AlertDialog open={!!action} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Past Day?</AlertDialogTitle>
          <AlertDialogDescription>
            Warning: You are editing {dateLabel}, not today. Are you sure you want to {action?.label.toLowerCase()}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { action?.onConfirm(); onClose(); }}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EntryCard({ entry, isPastDay, dateLabel, onDelete, onDuplicateToday, onDuplicateHere, onSave }: {
  entry: CalorieEntry;
  isPastDay: boolean;
  dateLabel: string;
  onDelete: () => void;
  onDuplicateToday: () => void;
  onDuplicateHere: () => void;
  onSave: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isBurned = entry.type === "burned";
  const isSubtract = entry.type === "subtract";
  const isMeal = entry.type === "meal";

  const accentColor = isBurned ? "bg-orange-400" : isSubtract ? "bg-destructive" : "bg-primary";
  const calColor = isBurned ? "text-orange-500" : isSubtract ? "text-destructive" : "text-gray-900";
  const prefix = isBurned ? "−" : isSubtract ? "−" : "+";

  return (
    <Card className="animate-in fade-in shadow-sm border-none overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-1.5 h-12 rounded-full shrink-0 ${accentColor}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-gray-900 truncate">{entry.name}</p>
                {isBurned && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">Burned</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{entry.time}</p>
              {entry.type === "container" && entry.startingWeight !== undefined && entry.endingWeight !== undefined && (
                <p className="text-[10px] text-gray-300 font-mono mt-0.5">{entry.startingWeight}g → {entry.endingWeight}g</p>
              )}
              {entry.type === "grams" && (
                <p className="text-[10px] text-gray-300 font-mono mt-0.5">{entry.gramsEaten}g ({entry.caloriesPerServing}cal/{entry.servingGrams}g)</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`font-semibold text-sm ${calColor}`}>{prefix}{entry.calories}</span>
            {isMeal && (
              <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600 p-1">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-300 hover:text-gray-600 p-1" data-testid={`button-entry-menu-${entry.id}`}>
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicateToday}>Duplicate to Today</DropdownMenuItem>
                {isPastDay && <DropdownMenuItem onClick={onDuplicateHere}>Duplicate to This Day</DropdownMenuItem>}
                <DropdownMenuItem onClick={onSave}>Save to Saved</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {isMeal && expanded && entry.ingredients && (
          <div className="px-4 pb-4 space-y-1.5 border-t border-gray-50 pt-3">
            {entry.ingredients.map(ing => (
              <div key={ing.id} className="flex justify-between text-sm text-gray-600">
                <span>{ing.name}</span>
                <span className="font-medium">{ing.calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DayDetail() {
  const [, params] = useRoute("/day/:date");
  const dateStr = params?.date ?? "";
  const { entries, ranges, addEntry, deleteEntry, addSavedRegular, addSavedMeal } = useCalorieData();
  const { toast } = useToast();

  if (!dateStr) return null;

  const dayDate = parseISO(dateStr);
  const isPastDay = !isToday(dayDate);
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const dateLabel = format(dayDate, "MMMM d, yyyy");

  const dayEntries = entries.filter(e => e.date === dateStr);
  const consumed = dayEntries.reduce((acc, e) => {
    if (e.type === "burned") return acc;
    return acc + (e.type === "subtract" ? -e.calories : e.calories);
  }, 0);
  const burned = dayEntries.filter(e => e.type === "burned").reduce((acc, e) => acc + e.calories, 0);
  const displayConsumed = Math.max(0, consumed);
  const net = Math.max(0, displayConsumed - burned);

  const range = getColorForCalories(displayConsumed, ranges);
  const badgeTextColor = getContrastColor(range.color);

  const [pendingAction, setPendingAction] = useState<PastDayAction | null>(null);

  const withPastWarning = (label: string, action: () => void) => {
    if (!isPastDay) { action(); return; }
    setPendingAction({ label, onConfirm: action });
  };

  // Quick Add modal
  const [isBasicOpen, setIsBasicOpen] = useState(false);
  const [basicType, setBasicType] = useState<"add" | "subtract">("add");
  const [basicCalories, setBasicCalories] = useState("");
  const [basicName, setBasicName] = useState("");

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cals = parseInt(basicCalories);
    if (isNaN(cals) || cals <= 0) return;
    withPastWarning("add a calorie entry", () => {
      addEntry({ date: dateStr, time: format(new Date(), "h:mm a"), type: basicType, name: basicName || (basicType === "add" ? "Quick Add" : "Correction"), calories: cals });
      setBasicCalories(""); setBasicName(""); setIsBasicOpen(false);
    });
  };

  // Burned modal
  const [isBurnedOpen, setIsBurnedOpen] = useState(false);
  const [burnedCals, setBurnedCals] = useState("");
  const [burnedNote, setBurnedNote] = useState("");

  const handleBurnedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cals = parseInt(burnedCals);
    if (isNaN(cals) || cals <= 0) return;
    withPastWarning("log burned calories", () => {
      addEntry({ date: dateStr, time: format(new Date(), "h:mm a"), type: "burned", name: burnedNote || "Workout", calories: cals });
      setBurnedCals(""); setBurnedNote(""); setIsBurnedOpen(false);
    });
  };

  // Grams modal
  const [isGramsOpen, setIsGramsOpen] = useState(false);
  const [gramsTab, setGramsTab] = useState("eaten");
  const [gramsEaten, setGramsEaten] = useState(""); const [servingGrams, setServingGrams] = useState(""); const [calsPerServing, setCalsPerServing] = useState(""); const [gramsName, setGramsName] = useState("");
  const calcGrams = parseFloat(servingGrams) > 0 ? Math.round((parseFloat(gramsEaten) / parseFloat(servingGrams)) * parseFloat(calsPerServing)) : 0;
  const [startWeight, setStartWeight] = useState(""); const [endWeight, setEndWeight] = useState(""); const [contServing, setContServing] = useState(""); const [contCals, setContCals] = useState(""); const [contName, setContName] = useState("");
  const gramsAte = parseFloat(startWeight) - parseFloat(endWeight);
  const calcContainer = parseFloat(contServing) > 0 && gramsAte > 0 ? Math.round((gramsAte / parseFloat(contServing)) * parseFloat(contCals)) : 0;
  const containerError = startWeight && endWeight && parseFloat(startWeight) <= parseFloat(endWeight) ? "Starting weight must be greater than ending weight." : "";

  const handleGramsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gramsTab === "eaten") {
      if (calcGrams <= 0) return;
      withPastWarning("add a food entry by grams", () => {
        addEntry({ date: dateStr, time: format(new Date(), "h:mm a"), type: "grams", name: gramsName || "Weighed Food", calories: calcGrams, gramsEaten: parseFloat(gramsEaten), servingGrams: parseFloat(servingGrams), caloriesPerServing: parseFloat(calsPerServing) });
        setGramsEaten(""); setServingGrams(""); setCalsPerServing(""); setGramsName(""); setIsGramsOpen(false);
      });
    } else {
      if (containerError || calcContainer <= 0) return;
      withPastWarning("add a weigh by container entry", () => {
        addEntry({ date: dateStr, time: format(new Date(), "h:mm a"), type: "container", name: contName || "Weighed Food", calories: calcContainer, startingWeight: parseFloat(startWeight), endingWeight: parseFloat(endWeight), servingGrams: parseFloat(contServing), caloriesPerServing: parseFloat(contCals) });
        setStartWeight(""); setEndWeight(""); setContServing(""); setContCals(""); setContName(""); setIsGramsOpen(false);
      });
    }
  };

  // Meal modal
  const [isMealOpen, setIsMealOpen] = useState(false);
  const [mealStep, setMealStep] = useState<1 | 2>(1);
  const [mealName, setMealName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const mealTotal = ingredients.reduce((acc, i) => acc + i.calories, 0);

  const handleMealSubmit = () => {
    if (!mealName.trim() || ingredients.length === 0) return;
    withPastWarning("add a meal entry", () => {
      addEntry({ date: dateStr, time: format(new Date(), "h:mm a"), type: "meal", name: mealName.trim(), calories: mealTotal, ingredients });
      setMealName(""); setIngredients([]); setMealStep(1); setIsMealOpen(false);
    });
  };

  const handleDelete = (entry: CalorieEntry) => {
    withPastWarning("delete this entry", () => deleteEntry(entry.id));
  };

  const handleDuplicateToday = (entry: CalorieEntry) => {
    addEntry({ ...entry, date: todayDate, time: format(new Date(), "h:mm a") });
    toast({ title: "Duplicated", description: `${entry.name} added to today.` });
  };

  const handleDuplicateHere = (entry: CalorieEntry) => {
    withPastWarning("duplicate this entry to this day", () => {
      addEntry({ ...entry, date: dateStr, time: format(new Date(), "h:mm a") });
      toast({ title: "Duplicated", description: `${entry.name} added to ${dateLabel}.` });
    });
  };

  const handleSave = (entry: CalorieEntry) => {
    if (entry.type === "meal" && entry.ingredients) {
      addSavedMeal({ name: entry.name, calories: entry.calories, ingredients: entry.ingredients });
    } else {
      addSavedRegular({ name: entry.name, calories: entry.calories, type: "add" });
    }
    toast({ title: "Saved", description: `${entry.name} saved to your list.` });
  };

  return (
    <div className="flex-1 p-6 flex flex-col h-full animate-in slide-in-from-right-4 duration-300 bg-gray-50 overflow-y-auto">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/calendar">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-gray-100" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{dateLabel}</h1>
          {isPastDay && <p className="text-xs text-amber-600 font-medium mt-0.5">Past day — changes require confirmation</p>}
        </div>
      </header>

      {/* Stats card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col items-center mb-4">
          <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
            style={{ backgroundColor: range.color, color: badgeTextColor }}>
            {dayEntries.length > 0 ? range.label : "No Data"}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold tracking-tighter text-gray-900" data-testid="text-consumed">{displayConsumed}</span>
            <span className="text-gray-400 font-medium text-sm">kcal consumed</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-gray-50 pt-4">
          <div className="text-center">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Burned</p>
            <p className="text-xl font-bold text-orange-500">{burned}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Net</p>
            <p className="text-xl font-bold text-primary">{net}</p>
          </div>
        </div>
      </div>

      {/* Add actions for this day */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <Button variant="outline" className="flex flex-col h-auto py-2.5 gap-1.5" onClick={() => { setBasicType("add"); setIsBasicOpen(true); }} data-testid="button-day-add">
          <Plus className="w-4 h-4 text-primary" />
          <span className="text-[10px]">Add</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-auto py-2.5 gap-1.5" onClick={() => setIsGramsOpen(true)} data-testid="button-day-grams">
          <Scale className="w-4 h-4 text-primary" />
          <span className="text-[10px]">Grams</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-auto py-2.5 gap-1.5" onClick={() => setIsBurnedOpen(true)} data-testid="button-day-burned">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-[10px]">Burned</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-auto py-2.5 gap-1.5" onClick={() => setIsMealOpen(true)} data-testid="button-day-meal">
          <ChefHat className="w-4 h-4 text-green-600" />
          <span className="text-[10px]">Meal</span>
        </Button>
      </div>

      {/* Entries */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Entries</h2>
        {dayEntries.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">No entries for this day.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                isPastDay={isPastDay}
                dateLabel={dateLabel}
                onDelete={() => handleDelete(entry)}
                onDuplicateToday={() => handleDuplicateToday(entry)}
                onDuplicateHere={() => handleDuplicateHere(entry)}
                onSave={() => handleSave(entry)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past day confirmation */}
      <PastDayConfirm action={pendingAction} dateLabel={dateLabel} onClose={() => setPendingAction(null)} />

      {/* Quick Add Modal */}
      <Dialog open={isBasicOpen} onOpenChange={setIsBasicOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle>Log Calories — {format(dayDate, "MMM d")}</DialogTitle></DialogHeader>
          <form onSubmit={handleBasicSubmit} className="space-y-4 pt-4">
            <ToggleGroup type="single" value={basicType} onValueChange={(v) => v && setBasicType(v as "add" | "subtract")} className="justify-start">
              <ToggleGroupItem value="add" className="w-full">Add</ToggleGroupItem>
              <ToggleGroupItem value="subtract" className="w-full">Subtract</ToggleGroupItem>
            </ToggleGroup>
            <div className="space-y-2">
              <Label>Calories</Label>
              <Input type="number" inputMode="numeric" value={basicCalories} onChange={e => setBasicCalories(e.target.value)} placeholder="e.g. 250" required min="1" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Input value={basicName} onChange={e => setBasicName(e.target.value)} placeholder="e.g. Apple" />
            </div>
            <Button type="submit" className="w-full" disabled={!basicCalories || parseInt(basicCalories) <= 0}>
              {basicType === "add" ? "Add" : "Subtract"} {basicCalories} kcal
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Burned Modal */}
      <Dialog open={isBurnedOpen} onOpenChange={setIsBurnedOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle>Log Burned — {format(dayDate, "MMM d")}</DialogTitle></DialogHeader>
          <form onSubmit={handleBurnedSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Calories Burned</Label>
              <Input type="number" inputMode="numeric" value={burnedCals} onChange={e => setBurnedCals(e.target.value)} placeholder="e.g. 300" required min="1" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Activity (Optional)</Label>
              <Input value={burnedNote} onChange={e => setBurnedNote(e.target.value)} placeholder="e.g. Running" />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={!burnedCals || parseInt(burnedCals) <= 0}>
              <Flame className="w-4 h-4 mr-2" /> Log Burned
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grams Modal */}
      <Dialog open={isGramsOpen} onOpenChange={setIsGramsOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Weigh Food — {format(dayDate, "MMM d")}</DialogTitle></DialogHeader>
          <Tabs value={gramsTab} onValueChange={setGramsTab} className="pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="eaten" className="flex-1">Grams Eaten</TabsTrigger>
              <TabsTrigger value="container" className="flex-1">By Container</TabsTrigger>
            </TabsList>
            <TabsContent value="eaten">
              <form onSubmit={handleGramsSubmit} className="space-y-4 pt-4">
                <Input value={gramsName} onChange={e => setGramsName(e.target.value)} placeholder="Food name (optional)" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Serving (g)</Label><Input type="number" inputMode="decimal" value={servingGrams} onChange={e => setServingGrams(e.target.value)} required min="1" /></div>
                  <div className="space-y-1"><Label className="text-xs">Cal / Serving</Label><Input type="number" inputMode="decimal" value={calsPerServing} onChange={e => setCalsPerServing(e.target.value)} required min="1" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Amount Eaten (g)</Label><Input type="number" inputMode="decimal" value={gramsEaten} onChange={e => setGramsEaten(e.target.value)} required min="1" autoFocus /></div>
                {calcGrams > 0 && <div className="bg-gray-50 p-3 rounded-lg text-sm text-center text-gray-600 font-mono">{gramsEaten}g ÷ {servingGrams}g × {calsPerServing} = <strong>{calcGrams} kcal</strong></div>}
                <Button type="submit" className="w-full" disabled={calcGrams <= 0}>Log {calcGrams > 0 ? calcGrams : ""} kcal</Button>
              </form>
            </TabsContent>
            <TabsContent value="container">
              <form onSubmit={handleGramsSubmit} className="space-y-4 pt-4">
                <Input value={contName} onChange={e => setContName(e.target.value)} placeholder="Food name (optional)" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Start (g)</Label><Input type="number" inputMode="decimal" value={startWeight} onChange={e => setStartWeight(e.target.value)} required min="1" /></div>
                  <div className="space-y-1"><Label className="text-xs">End (g)</Label><Input type="number" inputMode="decimal" value={endWeight} onChange={e => setEndWeight(e.target.value)} required min="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Serving (g)</Label><Input type="number" inputMode="decimal" value={contServing} onChange={e => setContServing(e.target.value)} required min="1" /></div>
                  <div className="space-y-1"><Label className="text-xs">Cal / Serving</Label><Input type="number" inputMode="decimal" value={contCals} onChange={e => setContCals(e.target.value)} required min="1" /></div>
                </div>
                {containerError && <p className="text-sm text-destructive">{containerError}</p>}
                {calcContainer > 0 && !containerError && <div className="bg-gray-50 p-3 rounded-lg text-sm text-center text-gray-600 font-mono">{startWeight}g − {endWeight}g = {gramsAte.toFixed(1)}g ÷ {contServing}g × {contCals} = <strong>{calcContainer} kcal</strong></div>}
                <Button type="submit" className="w-full" disabled={calcContainer <= 0 || !!containerError}>Log {calcContainer > 0 ? calcContainer : ""} kcal</Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Meal Modal */}
      <Dialog open={isMealOpen} onOpenChange={(o) => { setIsMealOpen(o); if (!o) { setMealStep(1); setMealName(""); setIngredients([]); } }}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{mealStep === 1 ? `New Meal — ${format(dayDate, "MMM d")}` : mealName}</DialogTitle></DialogHeader>
          {mealStep === 1 ? (
            <div className="space-y-4 pt-4">
              <Input value={mealName} onChange={e => setMealName(e.target.value)} placeholder="e.g. Bacon Egg & Cheese" autoFocus />
              <Button className="w-full" onClick={() => setMealStep(2)} disabled={!mealName.trim()}>Continue</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                {ingredients.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-gray-800">{ing.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{ing.calories} kcal</span>
                      <button onClick={() => setIngredients(p => p.filter(i => i.id !== ing.id))} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <AddIngredientForm onAdd={(ing) => setIngredients(p => [...p, ing])} />
              {ingredients.length > 0 && (
                <div className="flex justify-between py-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Total</span>
                  <span className="text-lg font-bold text-gray-900">{mealTotal} kcal</span>
                </div>
              )}
              <Button className="w-full" onClick={handleMealSubmit} disabled={ingredients.length === 0}>Save Meal ({mealTotal} kcal)</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
