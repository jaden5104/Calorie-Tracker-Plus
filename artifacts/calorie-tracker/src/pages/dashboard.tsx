import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useCalorieData, CalorieEntry, Ingredient } from "../hooks/use-calorie-data";
import { usePhotoStore } from "../hooks/use-photo-store";
import { useGrading } from "../hooks/use-grading";
import { isReportAvailable, reportAvailableAt } from "../lib/grading-utils";
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
  const qty = ing.quantity && ing.quantity !== 1 ? ing.quantity : null;
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
      <div>
        <span className="text-sm font-medium text-gray-800">{ing.name}</span>
        {qty && <span className="text-xs text-gray-400 ml-1">×{qty}</span>}
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
  const [qty, setQty] = useState("1");
  const [grams, setGrams] = useState("");
  const [serving, setServing] = useState("");
  const [calsPerServing, setCalsPerServing] = useState("");

  const baseCals = method === "manual"
    ? (parseInt(cals) || 0)
    : (parseFloat(grams) > 0 && parseFloat(serving) > 0 && parseFloat(calsPerServing) > 0
        ? Math.round((parseFloat(grams) / parseFloat(serving)) * parseFloat(calsPerServing)) : 0);
  const qtyVal = parseFloat(qty) > 0 ? parseFloat(qty) : 1;
  const totalCals = Math.round(baseCals * qtyVal);
  const canAdd = !!name.trim() && baseCals > 0 && parseFloat(qty) > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const ing: Ingredient = {
      id: crypto.randomUUID(),
      name: name.trim(),
      inputMethod: method,
      calories: totalCals,
      ...(parseFloat(qty) !== 1 ? { quantity: parseFloat(qty) } : {}),
      ...(method === "grams" ? { gramsEaten: parseFloat(grams), servingGrams: parseFloat(serving), caloriesPerServing: parseFloat(calsPerServing) } : {})
    };
    onAdd(ing);
    setName(""); setCals(""); setQty("1"); setGrams(""); setServing(""); setCalsPerServing("");
  };

  return (
    <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMethod("manual")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${method === "manual" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>Manual</button>
        <button type="button" onClick={() => setMethod("grams")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${method === "grams" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>By Grams</button>
      </div>
      <Input placeholder="Ingredient name" value={name} onChange={e => setName(e.target.value)} />
      {method === "manual" ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-500 uppercase">Calories each</Label>
            <Input type="number" inputMode="numeric" placeholder="e.g. 70" value={cals} onChange={e => setCals(e.target.value)} min="1" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-500 uppercase">Quantity</Label>
            <Input type="number" inputMode="decimal" placeholder="1" value={qty} onChange={e => setQty(e.target.value)} min="0.1" step="0.1" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" inputMode="decimal" placeholder="Grams eaten" value={grams} onChange={e => setGrams(e.target.value)} />
            <Input type="number" inputMode="decimal" placeholder="Serving (g)" value={serving} onChange={e => setServing(e.target.value)} />
            <Input type="number" inputMode="decimal" placeholder="Cal/serving" value={calsPerServing} onChange={e => setCalsPerServing(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-500 uppercase">Quantity</Label>
            <Input type="number" inputMode="decimal" placeholder="1" value={qty} onChange={e => setQty(e.target.value)} min="0.1" step="0.1" />
          </div>
        </>
      )}
      {baseCals > 0 && (
        <div className="text-xs text-center text-gray-500 font-mono bg-gray-50 rounded-lg py-2">
          {method === "grams" && `${grams}g ÷ ${serving}g × ${calsPerServing} = `}
          <span>{baseCals} kcal each × {qty || 1} = </span>
          <strong className="text-gray-800">{totalCals} kcal</strong>
        </div>
      )}
      <Button type="button" size="sm" className="w-full" onClick={handleAdd} disabled={!canAdd}>
        Add Ingredient{totalCals > 0 ? ` (${totalCals} kcal)` : ""}
      </Button>
    </div>
  );
}

function QuickAdjustDial({ onSubmit }: { onSubmit: (amount: number) => void }) {
  const [value, setValue] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const touchStartValue = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clamp = (v: number) => Math.max(-1000, Math.min(1000, Math.round(v / 5) * 5));
  const adjust = (delta: number) => setValue(v => clamp(v + delta));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    adjust(e.deltaY < 0 ? 5 : -5);
  };

  const startRepeat = (delta: number) => {
    adjust(delta);
    intervalRef.current = setInterval(() => adjust(delta), 120);
  };
  const stopRepeat = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  const isPos = value > 0;
  const isNeg = value < 0;
  const valColor = isPos ? "text-green-600" : isNeg ? "text-red-500" : "text-gray-300";
  const btnLabel = value === 0 ? "Select an amount above" : isPos ? `Add +${value} kcal` : `Apply ${value} kcal`;

  return (
    <div className="bg-gray-50 rounded-2xl p-3 mb-4">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-2">Quick Adjust</p>
      <div className="flex items-center gap-2">
        <button
          onMouseDown={() => startRepeat(-5)} onMouseUp={stopRepeat} onMouseLeave={stopRepeat}
          onTouchStart={(e) => { e.preventDefault(); startRepeat(-5); }} onTouchEnd={stopRepeat}
          className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 active:scale-95 transition-colors select-none"
          data-testid="button-dial-dec"
        >−</button>
        <div
          className="flex-1 flex items-center justify-center h-12 cursor-ns-resize select-none touch-none"
          onWheel={handleWheel}
          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; touchStartValue.current = value; }}
          onTouchMove={(e) => {
            if (touchStartY.current === null) return;
            const delta = touchStartY.current - e.touches[0].clientY;
            setValue(clamp(touchStartValue.current + Math.round(delta / 3) * 5));
          }}
          onTouchEnd={() => { touchStartY.current = null; }}
        >
          <span className={`text-3xl font-extrabold tabular-nums transition-colors ${valColor}`}>
            {value > 0 ? "+" : ""}{value}
          </span>
        </div>
        <button
          onMouseDown={() => startRepeat(5)} onMouseUp={stopRepeat} onMouseLeave={stopRepeat}
          onTouchStart={(e) => { e.preventDefault(); startRepeat(5); }} onTouchEnd={stopRepeat}
          className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:bg-green-50 hover:border-green-200 hover:text-green-600 active:scale-95 transition-colors select-none"
          data-testid="button-dial-inc"
        >+</button>
      </div>
      <Button
        className={`w-full mt-3 transition-colors ${!value ? "" : isPos ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
        variant={value === 0 ? "outline" : "default"}
        disabled={value === 0}
        onClick={() => onSubmit(value)}
        size="sm"
        data-testid="button-quick-adjust-submit"
      >
        {btnLabel}
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
            <div className="text-right">
              <span className={`font-semibold text-sm ${calColor}`}>
                {prefix}{entry.calories}
              </span>
              {entry.quantity && entry.quantity !== 1 && (
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">{Math.round(entry.calories / entry.quantity)} × {entry.quantity}</p>
              )}
            </div>
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

  const { settings: gradingSettings, dailyReports, newReportDates, generateDueReports, dismissNewReports } = useGrading(entries);

  useEffect(() => {
    generateDueReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayEntries = entries.filter(e => e.date === todayDate);
  const consumed = todayEntries.reduce((acc, e) => {
    if (e.type === "burned") return acc;
    return acc + (e.type === "subtract" ? -e.calories : e.calories);
  }, 0);
  const burned = todayEntries.filter(e => e.type === "burned").reduce((acc, e) => acc + e.calories, 0);
  const displayConsumed = Math.max(0, consumed);
  const net = displayConsumed - burned;

  const range = getColorForCalories(displayConsumed, ranges);
  const badgeTextColor = getContrastColor(range.color);

  // Quick Add/Subtract modal
  const [isBasicOpen, setIsBasicOpen] = useState(false);
  const [basicType, setBasicType] = useState<"add" | "subtract">("add");
  const [basicCalsEach, setBasicCalsEach] = useState("");
  const [basicQuantity, setBasicQuantity] = useState("1");
  const [basicName, setBasicName] = useState("");
  const basicTotal = Math.round((parseInt(basicCalsEach) || 0) * (parseFloat(basicQuantity) || 1));

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const each = parseInt(basicCalsEach);
    const qty = parseFloat(basicQuantity);
    if (isNaN(each) || each <= 0 || isNaN(qty) || qty <= 0) return;
    const total = Math.round(each * qty);
    addEntry({ date: todayDate, time: format(new Date(), "h:mm a"), type: basicType, name: basicName || (basicType === "add" ? "Quick Add" : "Correction"), calories: total, ...(qty !== 1 ? { quantity: qty } : {}) });
    setBasicCalsEach(""); setBasicQuantity("1"); setBasicName(""); setIsBasicOpen(false);
  };

  // Quick Adjust Dial
  const [quickAdjustPending, setQuickAdjustPending] = useState<number | null>(null);
  const [isQuickAdjustNameOpen, setIsQuickAdjustNameOpen] = useState(false);
  const [quickAdjustName, setQuickAdjustName] = useState("");

  const handleQuickAdjustRequest = (amount: number) => {
    setQuickAdjustPending(amount);
    if (appSettings.requireNameForQuickAdjust) {
      setQuickAdjustName("");
      setIsQuickAdjustNameOpen(true);
    } else {
      const autoName = amount > 0 ? `Quick Add +${amount}` : `Quick Subtract ${amount}`;
      logQuickAdjust(amount, autoName);
    }
  };

  const logQuickAdjust = (amount: number, name: string) => {
    const type = amount > 0 ? "add" : "subtract";
    const cals = Math.abs(amount);
    addEntry({ date: todayDate, time: format(new Date(), "h:mm a"), type, name, calories: cals });
    toast({ title: "Logged", description: `${name} — ${amount > 0 ? "+" : ""}${amount} kcal` });
  };

  const handleQuickAdjustConfirm = () => {
    if (quickAdjustPending === null) return;
    const name = quickAdjustName.trim() || (quickAdjustPending > 0 ? `Quick Add +${quickAdjustPending}` : `Quick Subtract ${quickAdjustPending}`);
    logQuickAdjust(quickAdjustPending, name);
    setIsQuickAdjustNameOpen(false);
    setQuickAdjustPending(null);
    setQuickAdjustName("");
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

      {/* Quick Adjust Dial */}
      <QuickAdjustDial onSubmit={handleQuickAdjustRequest} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Consumed", value: displayConsumed, color: "text-gray-900" },
          { label: "Burned", value: burned, color: "text-orange-500" },
          { label: "Net", value: net, color: net < 0 ? "text-blue-500" : "text-primary" },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-50 rounded-2xl p-3 text-center" data-testid={`stat-${stat.label.toLowerCase()}`}>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* New report banner */}
      {newReportDates.length > 0 && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 animate-in fade-in duration-300">
          <p className="text-sm font-medium text-green-800">
            {newReportDates.length === 1 ? "New grade report available." : `${newReportDates.length} new grade reports available.`}
          </p>
          <button onClick={dismissNewReports} className="text-green-600 hover:text-green-800 text-xs font-semibold ml-2 shrink-0">Dismiss</button>
        </div>
      )}

      {/* Grade card */}
      {gradingSettings.enabled && (() => {
        const sortedDates = Object.keys(dailyReports).sort().reverse();
        const latestReport = sortedDates[0] ? dailyReports[sortedDates[0]] : null;
        const todayReport = dailyReports[todayDate];
        const reportToShow = todayReport ?? latestReport;
        const todayAvailableAt = reportAvailableAt(todayDate);
        const todayReady = isReportAvailable(todayDate);

        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade Report</p>
              {reportToShow && reportToShow.date !== todayDate && (
                <span className="text-[10px] text-gray-400">{format(new Date(reportToShow.date + "T00:00:00"), "MMM d")}</span>
              )}
            </div>
            {reportToShow ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold shrink-0"
                  style={{ backgroundColor: reportToShow.gradeColor + "22", color: reportToShow.gradeColor }}>
                  {reportToShow.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{reportToShow.score}%</span>
                    <span className="text-xs font-medium" style={{ color: reportToShow.gradeColor }}>{reportToShow.grade}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{reportToShow.summary}</p>
                  {!todayReady && (
                    <p className="text-[10px] text-gray-400 mt-1">Today's report available at 12:30 AM</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                {todayReady ? "No graded days yet." : `Today's report available at ${format(todayAvailableAt, "h:mm a")}.`}
              </p>
            )}
          </div>
        );
      })()}

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
      <Dialog open={isBasicOpen} onOpenChange={(o) => { setIsBasicOpen(o); if (!o) { setBasicCalsEach(""); setBasicQuantity("1"); setBasicName(""); } }}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle>Log Calories</DialogTitle></DialogHeader>
          <form onSubmit={handleBasicSubmit} className="space-y-4 pt-4">
            <ToggleGroup type="single" value={basicType} onValueChange={(v) => v && setBasicType(v as "add" | "subtract")} className="justify-start">
              <ToggleGroupItem value="add" className="w-full">Add</ToggleGroupItem>
              <ToggleGroupItem value="subtract" className="w-full">Subtract</ToggleGroupItem>
            </ToggleGroup>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="basic-cals">Calories each</Label>
                <Input id="basic-cals" type="number" inputMode="numeric" value={basicCalsEach} onChange={e => setBasicCalsEach(e.target.value)} placeholder="e.g. 180" required min="1" autoFocus data-testid="input-calories" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic-qty">Quantity</Label>
                <Input id="basic-qty" type="number" inputMode="decimal" value={basicQuantity} onChange={e => setBasicQuantity(e.target.value)} placeholder="1" min="0.1" step="0.1" data-testid="input-quantity" />
              </div>
            </div>
            {parseInt(basicCalsEach) > 0 && (
              <div className="text-xs text-center text-gray-500 font-mono bg-gray-50 rounded-lg py-2">
                {basicCalsEach} kcal each × {basicQuantity || 1} = <strong className="text-gray-800">{basicTotal} kcal total</strong>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="basic-name">Note (Optional)</Label>
              <Input id="basic-name" value={basicName} onChange={e => setBasicName(e.target.value)} placeholder={basicType === "add" ? "e.g. Quest Bar" : "e.g. Correction"} data-testid="input-name" />
            </div>
            <Button type="submit" className="w-full" disabled={!basicCalsEach || parseInt(basicCalsEach) <= 0 || parseFloat(basicQuantity) <= 0} data-testid="button-submit-basic">
              {basicType === "add" ? "Add" : "Subtract"} {basicTotal > 0 ? basicTotal : ""} kcal
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Adjust Name Dialog */}
      <Dialog open={isQuickAdjustNameOpen} onOpenChange={(o) => { if (!o) { setIsQuickAdjustNameOpen(false); setQuickAdjustPending(null); } }}>
        <DialogContent className="sm:max-w-sm w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Name this entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {quickAdjustPending !== null && (
              <div className={`text-center py-2 rounded-xl font-bold text-lg ${quickAdjustPending > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {quickAdjustPending > 0 ? "+" : ""}{quickAdjustPending} kcal
              </div>
            )}
            <Input
              placeholder="e.g. Coffee, Snack, Correction…"
              value={quickAdjustName}
              onChange={e => setQuickAdjustName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleQuickAdjustConfirm()}
              autoFocus
              data-testid="input-quick-adjust-name"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => { setIsQuickAdjustNameOpen(false); setQuickAdjustPending(null); }}>Cancel</Button>
              <Button onClick={handleQuickAdjustConfirm} data-testid="button-quick-adjust-confirm">Log Entry</Button>
            </div>
          </div>
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
