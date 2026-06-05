import { useState } from "react";
import { useCalorieData, ColorRange } from "../hooks/use-calorie-data";
import { getContrastColor } from "../lib/color-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { ranges, setRanges, resetRanges } = useCalorieData();
  const [localRanges, setLocalRanges] = useState<ColorRange[]>(ranges);
  const { toast } = useToast();

  const handleSave = () => {
    // Basic validation
    let valid = true;
    for (let i = 0; i < localRanges.length; i++) {
      if (i > 0 && localRanges[i].min <= (localRanges[i - 1].max || 0)) {
        valid = false;
        break;
      }
    }
    
    if (!valid) {
      toast({
        title: "Invalid ranges",
        description: "Please ensure min values are greater than previous max values.",
        variant: "destructive"
      });
      return;
    }

    setRanges(localRanges);
    toast({
      title: "Settings Saved",
      description: "Color ranges updated successfully."
    });
  };

  const handleReset = () => {
    if (confirm("Reset to default colors?")) {
      resetRanges();
      setLocalRanges(ranges); // The hook will provide defaults on next render, but we might need to force a sync if it's lagging. 
      // A better way is reloading or effect sync, but this is simple enough.
      window.location.reload(); 
    }
  };

  const updateRange = (index: number, field: keyof ColorRange, value: any) => {
    const newRanges = [...localRanges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setLocalRanges(newRanges);
  };

  return (
    <div className="flex-1 p-6 flex flex-col h-full animate-in fade-in duration-300 overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
      </header>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calorie Color Ranges</h2>
          <div className="space-y-4">
            {localRanges.map((range, i) => (
              <Card key={range.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full border border-gray-200 shadow-sm shrink-0 flex items-center justify-center overflow-hidden relative"
                        style={{ backgroundColor: range.color }}
                      >
                        <input 
                          type="color" 
                          value={range.color}
                          onChange={(e) => updateRange(i, 'color', e.target.value)}
                          className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
                        />
                      </div>
                      <Input 
                        value={range.label}
                        onChange={(e) => updateRange(i, 'label', e.target.value)}
                        placeholder="Label"
                        className="font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-11">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 uppercase">Min</Label>
                        <Input 
                          type="number" 
                          value={range.min}
                          onChange={(e) => updateRange(i, 'min', parseInt(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 uppercase">Max</Label>
                        <Input 
                          type="number" 
                          value={range.max === null ? "" : range.max}
                          onChange={(e) => updateRange(i, 'max', e.target.value ? parseInt(e.target.value) : null)}
                          disabled={i === localRanges.length - 1}
                          placeholder={i === localRanges.length - 1 ? "Infinity" : ""}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button onClick={handleReset} variant="outline" className="w-full text-gray-500" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
