import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useCalorieData, CalorieEntry, Ingredient } from "../hooks/use-calorie-data";
import { usePhotoStore } from "../hooks/use-photo-store";
import { getColorForCalories, getContrastColor } from "../lib/color-utils";
import { Plus, Minus, Scale, CalendarDays, Flame, ChefHat, Trash2, ChevronDown, ChevronUp, MoreHorizontal, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <div className="text-sm font-medium text-gray-500">{format(time, "h:mm:ss a")}</div>;
}

function MealIngredientRow({ ing, onRemove }: { ing: Ingredient; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
      <div>
        <span className="text-sm font-medium text-gray-800">{ing.name}</span>
        {ing.inputMethod === "grams" && (
          <span className="text-xs text-gray-400 ml-2">
            {ing.gramsEaten}g ÷ {ing.servingGrams}g × {ing.caloriesPerServing}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">{ing.calories} kcal</span>
        <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AddIngredientForm({ onAdd }: { onAdd: (ing: Ingredient) => void }) {
  const [method, setMethod] = useState<"manual" | "grams">("manual");
  const [name, setName] = useState("");
  const [cals, setCals] = useState("");
  const [grams, setGrams] = useState("");
  const [serving, setServing] = useState("");
  const [calsPerServing, setCalsPerServing] = useState("");

  const calcCals = method === "grams" && parseFloat(grams) > 0 && parseFloat(serving) > 0 && parseFloat(calsPerServing) > 0
    ? Math.round((parseFloat(grams) / parseFloat(serving)) * parseFloat(calsPerServing))
    : 0;

  const canAdd = name.trim() && (method === "manual" ? parseInt(cals) > 0 : calcCals > 0);

  const handleAdd = () => {
    if (!canAdd) return;
    const ing: Ingredient = {
      id: crypto.randomUUID(),
      name: name.trim(),
      inputMethod: method,
      calories: method === "manual" ? parseInt(cals) : calcCals,
      ...(method === "grams" ? {
        gramsEaten: parseFloat(grams),
        servingGrams: parseFloat(serving),
        caloriesPerServing: parseFloat(calsPerServing),
      } : {})
    };
    onAdd(ing);
    setName(""); setCals(""); setGrams(""); setServing(""); setCalsPerServing("");
  };

  return (
    <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMethod("manual")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${method === "manual" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
        >Manual</button>
        <button
          type="button"
          onClick={() => setMethod("grams")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${method === "grams" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
        >By Grams</button>
      </div>
      <Input placeholder="Ingredient name" value={name} onChange={e => setName(e.target.value)} />
      {method === "manual" ? (
        <Input type="number" inputMode="numeric" placeholder="Calories" value={cals} onChange={e => setCals(e.target.value)} min="1" />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" inputMode="decimal" placeholder="Grams eaten" value={grams} onChange={e => setGrams(e.target.value)} />
          <Input type="number" inputMode="decimal" placeholder="Serving (g)" value={serving} onChange={e => setServing(e.target.value)} />
          <Input type="number" inputMode="decimal" placeholder="Cal/serving" value={calsPerServing} onChange={e => setCalsPerServing(e.target.value)} />
        </div>
      )}
      {method === "grams" && calcCals > 0 && (
        <div className="text-xs text-center text-gray-500 font-mono bg-gray-50 rounded-lg py-2">
          {grams}g ÷ {serving}g × {calsPerServing} = <strong className="text-gray-800">{calcCals} kcal</strong>
        </div>
      )}
      <Button type="button" size="sm" className="w-full" onClick={handleAdd} disabled={!canAdd}>
        Add Ingredient
      </Button>
    </div>
  );
}

function PhotoSection({ expirationHours }: { expirationHours: number }) {
  const { photos, addPhoto, deletePhoto } = usePhotoStore();
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setIsOpen(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!pendingFile) return;
    await addPhoto(pendingFile, note, expirationHours);
    setIsOpen(false);
    setNote("");
    setPendingFile(null);
    setPreview("");
  };

  const getTimeLeft = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return "Expired";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `Expires in ${h}h ${m}m` : `Expires in ${m}m`;
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Temporary Photos</h2>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} data-testid="button-add-photo">
          <Camera className="w-4 h-4 mr-1" /> Add
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">No temporary photos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {photos.map(photo => (
            <Card key={photo.id} className="overflow-hidden">
              <CardContent className="p-3 flex gap-3 items-start">
                <img src={photo.imageData} alt="temp" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  {photo.note && <p className="text-sm font-medium text-gray-800 truncate">{photo.note}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{getTimeLeft(photo.expiresAt)}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{format(new Date(photo.createdAt), "h:mm a")}</p>
                </div>
                <button onClick={() => deletePhoto(photo.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" data-testid={`button-delete-photo-${photo.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle>Add Temporary Photo</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {preview && <img src={preview} alt="preview" className="w-full max-h-48 object-cover rounded-xl" />}
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Input placeholder="e.g. Nutrition label for snack" value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <p className="text-xs text-gray-400">Expires in {expirationHours} hours</p>
            <Button className="w-full" onClick={handleSave} disabled={!pendingFile}>Save Photo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EntryCard({ entry, onDelete, onDuplicate, onSave }: {
  entry: CalorieEntry;
  onDelete: () => void;
  onDuplicate: () => void;
  onSave: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isBurned = entry.type === "burned";
  const isSubtract = entry.type === "subtract";
  const isMeal = entry.type === "meal";

  const accentColor = isBurned ? "bg-orange-400" : isSubtract ? "bg-destructive" : "bg-primary";
  const calColor = isBurned ? "text-orange-500" : isSubtract ? "text-destructive" : "text-gray-900";
  const prefix = isBurned ? "−🔥" : isSubtract ? "−" : "+";

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-2 h-10 rounded-full shrink-0 ${accentColor}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-medium text-gray-900 truncate">{entry.name}</p>
                {isBurned && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">Burned</span>}
              </div>
              <p className="text-xs text-gray-400">{entry.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`font-semibold text-sm ${calColor}`}>
              {prefix}{entry.calories}
            </span>
            {isMeal && (
              <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-300 hover:text-gray-600 transition-colors p-1" data-testid={`button-entry-menu-${entry.id}`}>
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicate}>Duplicate to Today</DropdownMenuItem>
                <DropdownMenuItem onClick={onSave}>Save to Saved</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {isMeal && expanded && entry.ingredients && (
          <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-3">
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

export default function Dashboard() {
  const { entries, ranges, appSettings, addEntry, deleteEntry, addSavedRegular, addSavedMeal } = useCalorieData();
  const { toast } = useToast();
  const todayDate = format(new Date(), "yyyy-MM-dd");

  const todayEntries = entries.filter(e => e.date === todayDate);
  const consumed = todayEntries.reduce((acc, e) => {
    if (e.type === "burned") return acc;
    return acc + (e.type === "subtract" ? -e.calories : e.calories);
  }, 0);
  const burned = todayEntries.filter(e => e.type === "burned").reduce((acc, e) => acc + e.calories, 0);
  const displayConsumed = Math.max(0, consumed);
  const net = Math.max(0, displayConsumed - burned);

  const range = getColorForCalories(displayConsumed, ranges);
  const badgeTextColor = getContrastColor(range.color);

  // Quick Add/Subtract modal
  const [isBasicOpen, setIsBasicOpen] = useState(false);
  const [basicType, setBasicType] = useState<"add" | "subtract">("add");
  const [basicCalories, setBasicCalories] = useState("");
  const [basicName, setBasicName] = useState("");

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cals = parseInt(basicCalories);
    if (isNaN(cals) || cals <= 0) return;
    addEntry({ date: todayDate, time: format(new Date(), "h:mm a"), type: basicType, name: basicName || (basicType === "add" ? "Quick Add" : "Correction"), calories: cals });
    setBasicCalories(""); setBasicName(""); setIsBasicOpen(false);
  };

  // By Grams modal
  const [isGramsOpen, setIsGramsOpen] = useState(false);
  const [gramsTab, setGramsTab] = useState("eaten");
  // Grams eaten
  const [gramsEaten, setGramsEaten] = useState(""); const [servingGrams, setServingGrams] = useState(""); const [calsPerServing, setCalsPerServing] = useState(""); const [gramsName, setGramsName] = useState("");
  const calcGrams = parseFloat(servingGrams) > 0 ? Math.round((parseFloat(gramsEaten) / parseFloat(servingGrams)) * parseFloat(calsPerServing)) : 0;
  // Container
  const [startWeight, setStartWeight] = useState(""); const [endWeight, setEndWeight] = useState(""); const [contServing, setContServing] = useState(""); const [contCals, setContCals] = useState(""); const [contName, setContName] = useState("");
  const gramsAte = parseFloat(startWeight) - parseFloat(endWeight);
  const calcContainer = parseFloat(contServing) > 0 && gramsAte > 0 ? Math.round((gramsAte / parseFloat(contServing)) * parseFloat(contCals)) : 0;
  const containerError = startWeight && endWeight && parseFloat(startWeight) <= parseFloat(endWeight) ? "Starting weight must be greater than ending weight." : "";

  const handleGramsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gramsTab === "eaten") {
      if (parseFloat(gramsEaten) <= 0 || parseFloat(servingGrams) <= 0 || parseFloat(calsPerServing) <= 0 || calcGrams <= 0) return;
      addEntry({ date: todayDate, time: format(new Date(), "h:mm a"), type: "grams", name: gramsName || "Weighed Food", calories: calcGrams, gramsEaten: parseFloat(gramsEaten), servingGrams: parseFloat(servingGrams), caloriesPerServing: parseFloat(calsPerServing) });
      setGramsEaten(""); setServingGrams(""); setCalsPerServing(""); setGramsName("");
    } else {
      if (containerError || calcContainer <= 0) return;
      addEntry({ date: todayDate, time: format(new Date(), "h:mm a"), type: "container", name: contName || "Weighed Food", calories: calcContainer, startingWeight: parseFloat(startWeight), endingWeight: parseFloat(endWeight), servingGrams: parseFloat(contServing), caloriesPerServing: parseFloat(contCals) });
      setStartWeight(""); setEndWeight(""); setContServing(""); setContCals(""); setContName("");
    }
    setIsGramsOpen(false);
  };

  // Burned modal
  const [isBurnedOpen, setIsBurnedOpen] = useState(false);
  const [burnedCals, setBurnedCals] = useState("");
  const [burnedNote, setBurnedNote] = useState("");

  const handleBurnedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cals = parseInt(burnedCals);
    if (isNaN(cals) || cals <= 0) return;
    addEntry({ date: todayDate, time: format(new Date(), "h:mm a"), type: "burned", name: burnedNote || "Workout", calories: cals });
    setBurnedCals(""); setBurnedNote(""); setIsBurnedOpen(false);
  };

  // Meal modal
  const [isMealOpen, setIsMealOpen] = useState(false);
  const [mealStep, setMealStep] = useState<1 | 2>(1);
  const [mealName, setMealName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const mealTotal = ingredients.reduce((acc, i) => acc + i.calories, 0);

  const handleMealSubmit = () => {
    if (!mealName.trim() || ingredients.length === 0) return;
    addEntry({ date: todayDate, time: format(new Date(), "h:mm a"), type: "meal", name: mealName.trim(), calories: mealTotal, ingredients });
    setMealName(""); setIngredients([]); setMealStep(1); setIsMealOpen(false);
  };

  const handleEntryDuplicate = (entry: CalorieEntry) => {
    addEntry({ ...entry, date: todayDate, time: format(new Date(), "h:mm a") });
    toast({ title: "Duplicated", description: `${entry.name} added to today.` });
  };

  const handleEntrySave = (entry: CalorieEntry) => {
    if (entry.type === "meal" && entry.ingredients) {
      addSavedMeal({ name: entry.name, calories: entry.calories, ingredients: entry.ingredients });
    } else {
      addSavedRegular({ name: entry.name, calories: entry.calories, type: entry.type === "subtract" ? "add" : "add" });
    }
    toast({ title: "Saved", description: `${entry.name} saved to your list.` });
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

      {/* Main calorie circle */}
      <div className="flex flex-col items-center justify-center mb-6 mt-2">
        <div
          className="w-48 h-48 rounded-full flex flex-col items-center justify-center transition-colors duration-500 shadow-xl"
          style={{ backgroundColor: range.color, color: badgeTextColor }}
          data-testid="circle-consumed"
        >
          <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">{range.label}</span>
          <span className="text-6xl font-bold tracking-tighter my-1">{displayConsumed}</span>
          <span className="text-sm font-medium opacity-80">kcal consumed</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Consumed", value: displayConsumed, color: "text-gray-900" },
          { label: "Burned", value: burned, color: "text-orange-500" },
          { label: "Net", value: net, color: "text-primary" },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-50 rounded-2xl p-3 text-center" data-testid={`stat-${stat.label.toLowerCase()}`}>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {/* Quick Add */}
        <Button variant="outline" className="flex flex-col h-auto py-3 gap-2" onClick={() => { setBasicType("add"); setIsBasicOpen(true); }} data-testid="button-quick-add">
          <div className="bg-primary/10 p-2 rounded-full"><Plus className="w-5 h-5 text-primary" /></div>
          <span className="text-xs">Quick Add</span>
        </Button>

        {/* By Grams */}
        <Button variant="outline" className="flex flex-col h-auto py-3 gap-2" onClick={() => setIsGramsOpen(true)} data-testid="button-by-grams">
          <div className="bg-primary/10 p-2 rounded-full"><Scale className="w-5 h-5 text-primary" /></div>
          <span className="text-xs">By Grams</span>
        </Button>

        {/* Calendar */}
        <Link href="/calendar" className="flex flex-col h-auto py-3 gap-2 border rounded-md shadow-sm items-center justify-center text-sm font-medium hover:bg-accent transition-colors" data-testid="button-calendar">
          <div className="bg-primary/10 p-2 rounded-full"><CalendarDays className="w-5 h-5 text-primary" /></div>
          <span className="text-xs">Calendar</span>
        </Link>

        {/* Burned */}
        <Button variant="outline" className="flex flex-col h-auto py-3 gap-2" onClick={() => setIsBurnedOpen(true)} data-testid="button-burned">
          <div className="bg-orange-100 p-2 rounded-full"><Flame className="w-5 h-5 text-orange-500" /></div>
          <span className="text-xs">Burned</span>
        </Button>

        {/* Subtract */}
        <Button variant="outline" className="flex flex-col h-auto py-3 gap-2" onClick={() => { setBasicType("subtract"); setIsBasicOpen(true); }} data-testid="button-subtract">
          <div className="bg-red-100 p-2 rounded-full"><Minus className="w-5 h-5 text-red-500" /></div>
          <span className="text-xs">Subtract</span>
        </Button>

        {/* Meal */}
        <Button variant="outline" className="flex flex-col h-auto py-3 gap-2" onClick={() => setIsMealOpen(true)} data-testid="button-meal">
          <div className="bg-green-100 p-2 rounded-full"><ChefHat className="w-5 h-5 text-green-600" /></div>
          <span className="text-xs">Meal Entry</span>
        </Button>
      </div>

      {/* Today's log */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Today's Log</h2>
        {todayEntries.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">No entries yet. Add something!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEntries.map((entry, i) => (
              <div key={entry.id} style={{ animationDelay: `${i * 40}ms` }}>
                <EntryCard
                  entry={entry}
                  onDelete={() => deleteEntry(entry.id)}
                  onDuplicate={() => handleEntryDuplicate(entry)}
                  onSave={() => handleEntrySave(entry)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Temporary Photos */}
      <PhotoSection expirationHours={appSettings.photoExpirationHours} />

      {/* Quick Add/Subtract Modal */}
      <Dialog open={isBasicOpen} onOpenChange={setIsBasicOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle>Log Calories</DialogTitle></DialogHeader>
          <form onSubmit={handleBasicSubmit} className="space-y-4 pt-4">
            <ToggleGroup type="single" value={basicType} onValueChange={(v) => v && setBasicType(v as "add" | "subtract")} className="justify-start">
              <ToggleGroupItem value="add" className="w-full">Add</ToggleGroupItem>
              <ToggleGroupItem value="subtract" className="w-full">Subtract</ToggleGroupItem>
            </ToggleGroup>
            <div className="space-y-2">
              <Label htmlFor="basic-cals">Calories</Label>
              <Input id="basic-cals" type="number" inputMode="numeric" value={basicCalories} onChange={e => setBasicCalories(e.target.value)} placeholder="e.g. 250" required min="1" autoFocus data-testid="input-calories" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic-name">Note (Optional)</Label>
              <Input id="basic-name" value={basicName} onChange={e => setBasicName(e.target.value)} placeholder={basicType === "add" ? "e.g. Apple" : "e.g. Correction"} data-testid="input-name" />
            </div>
            <Button type="submit" className="w-full" disabled={!basicCalories || parseInt(basicCalories) <= 0} data-testid="button-submit-basic">
              {basicType === "add" ? "Add" : "Subtract"} {basicCalories} kcal
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* By Grams Modal */}
      <Dialog open={isGramsOpen} onOpenChange={setIsGramsOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Weigh Food</DialogTitle></DialogHeader>
          <Tabs value={gramsTab} onValueChange={setGramsTab} className="pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="eaten" className="flex-1">Grams Eaten</TabsTrigger>
              <TabsTrigger value="container" className="flex-1">By Container</TabsTrigger>
            </TabsList>
            <TabsContent value="eaten">
              <form onSubmit={handleGramsSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Food Name (Optional)</Label>
                  <Input value={gramsName} onChange={e => setGramsName(e.target.value)} placeholder="e.g. Chicken Breast" data-testid="input-grams-name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Serving Size (g)</Label>
                    <Input type="number" inputMode="decimal" value={servingGrams} onChange={e => setServingGrams(e.target.value)} required min="1" data-testid="input-serving" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cal / Serving</Label>
                    <Input type="number" inputMode="decimal" value={calsPerServing} onChange={e => setCalsPerServing(e.target.value)} required min="1" data-testid="input-cals-per-serving" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Amount Eaten (g)</Label>
                  <Input type="number" inputMode="decimal" value={gramsEaten} onChange={e => setGramsEaten(e.target.value)} required min="1" autoFocus data-testid="input-grams-eaten" />
                </div>
                {calcGrams > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-center text-gray-600 font-mono">
                    {gramsEaten}g ÷ {servingGrams}g × {calsPerServing} = <strong className="text-gray-900">{calcGrams} kcal</strong>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={calcGrams <= 0} data-testid="button-submit-grams">Log {calcGrams > 0 ? calcGrams : ""} kcal</Button>
              </form>
            </TabsContent>
            <TabsContent value="container">
              <form onSubmit={handleGramsSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Food Name (Optional)</Label>
                  <Input value={contName} onChange={e => setContName(e.target.value)} placeholder="e.g. Peanut Butter" data-testid="input-container-name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Starting Weight (g)</Label>
                    <Input type="number" inputMode="decimal" value={startWeight} onChange={e => setStartWeight(e.target.value)} required min="1" data-testid="input-start-weight" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ending Weight (g)</Label>
                    <Input type="number" inputMode="decimal" value={endWeight} onChange={e => setEndWeight(e.target.value)} required min="0" data-testid="input-end-weight" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Serving Size (g)</Label>
                    <Input type="number" inputMode="decimal" value={contServing} onChange={e => setContServing(e.target.value)} required min="1" data-testid="input-cont-serving" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cal / Serving</Label>
                    <Input type="number" inputMode="decimal" value={contCals} onChange={e => setContCals(e.target.value)} required min="1" data-testid="input-cont-cals" />
                  </div>
                </div>
                {containerError && <p className="text-sm text-destructive">{containerError}</p>}
                {calcContainer > 0 && !containerError && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-center text-gray-600 font-mono">
                    {startWeight}g − {endWeight}g = {gramsAte.toFixed(1)}g ÷ {contServing}g × {contCals} = <strong className="text-gray-900">{calcContainer} kcal</strong>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={calcContainer <= 0 || !!containerError} data-testid="button-submit-container">Log {calcContainer > 0 ? calcContainer : ""} kcal</Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Burned Calories Modal */}
      <Dialog open={isBurnedOpen} onOpenChange={setIsBurnedOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle>Log Burned Calories</DialogTitle></DialogHeader>
          <form onSubmit={handleBurnedSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="burned-cals">Calories Burned</Label>
              <Input id="burned-cals" type="number" inputMode="numeric" value={burnedCals} onChange={e => setBurnedCals(e.target.value)} placeholder="e.g. 300" required min="1" autoFocus data-testid="input-burned-calories" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="burned-note">Activity (Optional)</Label>
              <Input id="burned-note" value={burnedNote} onChange={e => setBurnedNote(e.target.value)} placeholder="e.g. Running, Gym" data-testid="input-burned-note" />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={!burnedCals || parseInt(burnedCals) <= 0} data-testid="button-submit-burned">
              <Flame className="w-4 h-4 mr-2" /> Log {burnedCals} kcal Burned
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Meal Entry Modal */}
      <Dialog open={isMealOpen} onOpenChange={(o) => { setIsMealOpen(o); if (!o) { setMealStep(1); setMealName(""); setIngredients([]); } }}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mealStep === 1 ? "New Meal Entry" : mealName || "Meal Entry"}</DialogTitle>
          </DialogHeader>
          {mealStep === 1 ? (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Meal Name</Label>
                <Input value={mealName} onChange={e => setMealName(e.target.value)} placeholder="e.g. Bacon Egg & Cheese" autoFocus data-testid="input-meal-name" />
              </div>
              <Button className="w-full" onClick={() => setMealStep(2)} disabled={!mealName.trim()} data-testid="button-meal-continue">Continue</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                {ingredients.map((ing) => (
                  <MealIngredientRow key={ing.id} ing={ing} onRemove={() => setIngredients(prev => prev.filter(i => i.id !== ing.id))} />
                ))}
              </div>
              <AddIngredientForm onAdd={(ing) => setIngredients(prev => [...prev, ing])} />
              {ingredients.length > 0 && (
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Meal Total</span>
                  <span className="text-lg font-bold text-gray-900">{mealTotal} kcal</span>
                </div>
              )}
              <Button className="w-full" onClick={handleMealSubmit} disabled={ingredients.length === 0} data-testid="button-submit-meal">
                Save Meal Entry ({mealTotal} kcal)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
