import { useState } from "react";
import { format } from "date-fns";
import { useCalorieData, SavedMeal, Ingredient } from "../hooks/use-calorie-data";
import { Bookmark, Trash2, Plus, MoreHorizontal, ChefHat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

function AddIngredientInline({ onAdd }: { onAdd: (ing: Ingredient) => void }) {
  const [method, setMethod] = useState<"manual" | "grams">("manual");
  const [name, setName] = useState("");
  const [cals, setCals] = useState("");
  const [qty, setQty] = useState("1");
  const [grams, setGrams] = useState("");
  const [serving, setServing] = useState("");
  const [calsPs, setCalsPs] = useState("");

  const baseCals = method === "manual"
    ? (parseInt(cals) || 0)
    : (parseFloat(grams) > 0 && parseFloat(serving) > 0 && parseFloat(calsPs) > 0
        ? Math.round((parseFloat(grams) / parseFloat(serving)) * parseFloat(calsPs)) : 0);
  const qtyVal = parseFloat(qty) > 0 ? parseFloat(qty) : 1;
  const totalCals = Math.round(baseCals * qtyVal);
  const canAdd = !!name.trim() && baseCals > 0 && parseFloat(qty) > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({ id: crypto.randomUUID(), name: name.trim(), inputMethod: method, calories: totalCals, ...(parseFloat(qty) !== 1 ? { quantity: parseFloat(qty) } : {}), ...(method === "grams" ? { gramsEaten: parseFloat(grams), servingGrams: parseFloat(serving), caloriesPerServing: parseFloat(calsPs) } : {}) });
    setName(""); setCals(""); setQty("1"); setGrams(""); setServing(""); setCalsPs("");
  };

  return (
    <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMethod("manual")} className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${method === "manual" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>Manual</button>
        <button type="button" onClick={() => setMethod("grams")} className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${method === "grams" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>By Grams</button>
      </div>
      <Input placeholder="Ingredient name" value={name} onChange={e => setName(e.target.value)} />
      {method === "manual" ? (
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="Calories each" value={cals} onChange={e => setCals(e.target.value)} />
          <Input type="number" inputMode="decimal" placeholder="Quantity" value={qty} onChange={e => setQty(e.target.value)} min="0.1" step="0.1" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1">
            <Input type="number" placeholder="g eaten" value={grams} onChange={e => setGrams(e.target.value)} />
            <Input type="number" placeholder="serving g" value={serving} onChange={e => setServing(e.target.value)} />
            <Input type="number" placeholder="cal/srv" value={calsPs} onChange={e => setCalsPs(e.target.value)} />
          </div>
          <Input type="number" inputMode="decimal" placeholder="Quantity" value={qty} onChange={e => setQty(e.target.value)} min="0.1" step="0.1" />
        </>
      )}
      {baseCals > 0 && (
        <div className="text-xs text-center text-gray-500 font-mono bg-gray-50 rounded-lg py-1.5">
          {baseCals} each × {qty || 1} = <strong className="text-gray-800">{totalCals} kcal</strong>
        </div>
      )}
      <Button size="sm" className="w-full" onClick={handleAdd} disabled={!canAdd}>Add Ingredient{totalCals > 0 ? ` (${totalCals} kcal)` : ""}</Button>
    </div>
  );
}

function SavedMealCard({ meal, onDelete, onAddToday }: { meal: SavedMeal; onDelete: () => void; onAddToday: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{meal.name}</p>
            <p className="text-sm text-gray-500">{meal.calories} kcal · {meal.ingredients.length} ingredients</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-300 hover:text-gray-600 p-1" data-testid={`button-meal-menu-${meal.id}`}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAddToday}>Add to Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExpanded(e => !e)}>{expanded ? "Collapse" : "View Ingredients"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {expanded && (
          <div className="mt-3 space-y-1.5 border-t border-gray-50 pt-3">
            {meal.ingredients.map(ing => (
              <div key={ing.id} className="flex justify-between text-sm text-gray-600">
                <span>{ing.name}</span>
                <span className="font-medium">{ing.calories} kcal</span>
              </div>
            ))}
          </div>
        )}
        <Button size="sm" className="w-full mt-3" onClick={onAddToday} data-testid={`button-add-meal-today-${meal.id}`}>
          Add to Today
        </Button>
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Saved Meal?</AlertDialogTitle>
              <AlertDialogDescription>This will remove "{meal.name}" from your saved meals.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function SavedRegularCard({ item, onDelete, onAddToday }: { item: { id: string; name: string; calories: number; createdAt: string }; onDelete: () => void; onAddToday: (qty: number) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showQty, setShowQty] = useState(false);
  const [qty, setQty] = useState("1");
  const qtyVal = parseFloat(qty) > 0 ? parseFloat(qty) : 1;
  const total = Math.round(item.calories * qtyVal);

  const handleConfirmAdd = () => {
    onAddToday(qtyVal);
    setShowQty(false);
    setQty("1");
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-500">{item.calories} kcal each</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowQty(v => !v)} data-testid={`button-add-regular-today-${item.id}`}>Add to Today</Button>
            <button onClick={() => setConfirmDelete(true)} className="text-gray-300 hover:text-red-500 transition-colors p-1" data-testid={`button-delete-regular-${item.id}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showQty && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-gray-500 uppercase">Quantity</Label>
                <Input type="number" inputMode="decimal" value={qty} onChange={e => setQty(e.target.value)} min="0.1" step="0.1" placeholder="1" autoFocus />
              </div>
              <div className="text-right shrink-0 mt-5">
                <p className="text-xs text-gray-400">{item.calories} × {qty || 1}</p>
                <p className="text-sm font-bold text-gray-900">{total} kcal</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => { setShowQty(false); setQty("1"); }}>Cancel</Button>
              <Button size="sm" onClick={handleConfirmAdd} disabled={parseFloat(qty) <= 0}>Add {total} kcal</Button>
            </div>
          </div>
        )}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Saved Item?</AlertDialogTitle>
              <AlertDialogDescription>This will remove "{item.name}" from your saved items.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function Saved() {
  const { savedRegular, savedMeals, addSavedRegular, deleteSavedRegular, addSavedMeal, deleteSavedMeal, addEntry } = useCalorieData();
  const { toast } = useToast();
  const todayDate = format(new Date(), "yyyy-MM-dd");

  const [isAddRegularOpen, setIsAddRegularOpen] = useState(false);
  const [newRegularName, setNewRegularName] = useState("");
  const [newRegularCals, setNewRegularCals] = useState("");

  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [newMealIngredients, setNewMealIngredients] = useState<Ingredient[]>([]);
  const newMealTotal = newMealIngredients.reduce((acc, i) => acc + i.calories, 0);

  const handleSaveRegular = (e: React.FormEvent) => {
    e.preventDefault();
    const cals = parseInt(newRegularCals);
    if (!newRegularName.trim() || isNaN(cals) || cals <= 0) return;
    addSavedRegular({ name: newRegularName.trim(), calories: cals, type: "add" });
    setNewRegularName(""); setNewRegularCals(""); setIsAddRegularOpen(false);
    toast({ title: "Saved", description: "Item added to saved list." });
  };

  const handleSaveMeal = () => {
    if (!newMealName.trim() || newMealIngredients.length === 0) return;
    addSavedMeal({ name: newMealName.trim(), calories: newMealTotal, ingredients: newMealIngredients });
    setNewMealName(""); setNewMealIngredients([]); setIsAddMealOpen(false);
    toast({ title: "Saved", description: "Meal added to saved list." });
  };

  const handleAddMealToday = (meal: SavedMeal) => {
    addEntry({ date: todayDate, time: format(new Date(), "h:mm a"), type: "meal", name: meal.name, calories: meal.calories, ingredients: meal.ingredients });
    toast({ title: "Added", description: `${meal.name} added to today.` });
  };

  const handleAddRegularToday = (item: { name: string; calories: number }, qty: number) => {
    const total = Math.round(item.calories * qty);
    addEntry({ date: todayDate, time: format(new Date(), "h:mm a"), type: "add", name: item.name, calories: total, ...(qty !== 1 ? { quantity: qty } : {}) });
    toast({ title: "Added", description: `${item.name}${qty !== 1 ? ` × ${qty}` : ""} (${total} kcal) added to today.` });
  };

  return (
    <div className="flex-1 p-6 animate-in fade-in duration-300 overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-primary" /> Saved
        </h1>
      </header>

      <Tabs defaultValue="meals">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="meals" className="flex-1">Meals</TabsTrigger>
          <TabsTrigger value="regular" className="flex-1">Regular</TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="space-y-4">
          <Button variant="outline" className="w-full" onClick={() => setIsAddMealOpen(true)} data-testid="button-add-saved-meal">
            <Plus className="w-4 h-4 mr-2" /> Add Saved Meal
          </Button>
          {savedMeals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <ChefHat className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No saved meals yet.</p>
              <p className="text-gray-400 text-xs mt-1">Save a meal entry to reuse it later.</p>
            </div>
          ) : (
            savedMeals.map(meal => (
              <SavedMealCard key={meal.id} meal={meal} onDelete={() => deleteSavedMeal(meal.id)} onAddToday={() => handleAddMealToday(meal)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="regular" className="space-y-4">
          <Button variant="outline" className="w-full" onClick={() => setIsAddRegularOpen(true)} data-testid="button-add-saved-regular">
            <Plus className="w-4 h-4 mr-2" /> Add Saved Item
          </Button>
          {savedRegular.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No saved items yet.</p>
              <p className="text-gray-400 text-xs mt-1">Save a food entry to quickly add it again.</p>
            </div>
          ) : (
            savedRegular.map(item => (
              <SavedRegularCard key={item.id} item={item} onDelete={() => deleteSavedRegular(item.id)} onAddToday={(qty) => handleAddRegularToday(item, qty)} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Add Regular Modal */}
      <Dialog open={isAddRegularOpen} onOpenChange={setIsAddRegularOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle>Save Regular Item</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveRegular} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newRegularName} onChange={e => setNewRegularName(e.target.value)} placeholder="e.g. Quest Bar" autoFocus data-testid="input-regular-name" />
            </div>
            <div className="space-y-2">
              <Label>Calories</Label>
              <Input type="number" inputMode="numeric" value={newRegularCals} onChange={e => setNewRegularCals(e.target.value)} placeholder="e.g. 180" min="1" data-testid="input-regular-cals" />
            </div>
            <Button type="submit" className="w-full" disabled={!newRegularName.trim() || parseInt(newRegularCals) <= 0} data-testid="button-submit-regular">Save Item</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Meal Modal */}
      <Dialog open={isAddMealOpen} onOpenChange={(o) => { setIsAddMealOpen(o); if (!o) { setNewMealName(""); setNewMealIngredients([]); } }}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Save Meal</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Meal Name</Label>
              <Input value={newMealName} onChange={e => setNewMealName(e.target.value)} placeholder="e.g. Turkey Sandwich" autoFocus data-testid="input-saved-meal-name" />
            </div>
            <div className="space-y-2">
              {newMealIngredients.map(ing => (
                <div key={ing.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-800">{ing.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{ing.calories} kcal</span>
                    <button onClick={() => setNewMealIngredients(prev => prev.filter(i => i.id !== ing.id))} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <AddIngredientInline onAdd={(ing) => setNewMealIngredients(prev => [...prev, ing])} />
            {newMealIngredients.length > 0 && (
              <div className="flex justify-between py-2 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">{newMealTotal} kcal</span>
              </div>
            )}
            <Button className="w-full" onClick={handleSaveMeal} disabled={!newMealName.trim() || newMealIngredients.length === 0} data-testid="button-submit-saved-meal">
              Save Meal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

