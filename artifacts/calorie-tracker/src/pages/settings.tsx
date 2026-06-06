import { useState } from "react";
import { useCalorieData, ColorRange } from "../hooks/use-calorie-data";
import { getContrastColor } from "../lib/color-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save, RotateCcw, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VERSION_HISTORY = [
  {
    version: "1.1",
    date: "June 2026",
    features: [
      "Added calories burned tracking and daily net calories",
      "Added temporary photo entries with auto-expiration",
      "Added 24-hour and 48-hour photo expiration settings",
      "Added Weigh by Container calculator",
      "Added Meal Entry mode with multiple ingredients",
      "Added manual and automatic ingredient calorie entry",
      "Added Saved list for meals and regular entries",
      "Added duplicate entry options",
      "Added editing support for previous calendar days",
      "Added warnings when editing a day that is not today",
      "Calorie color ranges moved to collapsible section",
    ],
    bugfixes: [
      "Fixed missing calendar icon on quick-action card",
      "Improved settings page organization",
    ],
  },
];

export default function Settings() {
  const { ranges, setRanges, resetRanges, appSettings, updateAppSettings } = useCalorieData();
  const [localRanges, setLocalRanges] = useState<ColorRange[]>(ranges);
  const { toast } = useToast();

  const handleSave = () => {
    let valid = true;
    for (let i = 1; i < localRanges.length; i++) {
      if (localRanges[i].min <= (localRanges[i - 1].max || 0)) {
        valid = false;
        break;
      }
    }
    if (!valid) {
      toast({ title: "Invalid ranges", description: "Ensure min values are greater than previous max values.", variant: "destructive" });
      return;
    }
    setRanges(localRanges);
    toast({ title: "Settings Saved", description: "Color ranges updated successfully." });
  };

  const handleReset = () => {
    if (confirm("Reset color ranges to defaults?")) {
      resetRanges();
      window.location.reload();
    }
  };

  const updateRange = (index: number, field: keyof ColorRange, value: string | number | null) => {
    const newRanges = [...localRanges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setLocalRanges(newRanges);
  };

  return (
    <div className="flex-1 p-6 flex flex-col h-full animate-in fade-in duration-300 overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-xs text-gray-400 mt-1">App Version: v1.1</p>
      </header>

      <Accordion type="single" collapsible className="space-y-3">

        {/* Calorie Color Ranges */}
        <AccordionItem value="color-ranges" className="border border-gray-200 rounded-2xl overflow-hidden px-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors" data-testid="accordion-color-ranges">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {["#22c55e","#facc15","#ef4444","#6d28d9"].map(c => (
                  <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="font-semibold text-gray-900">Calorie Color Ranges</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-4 pt-2">
              {localRanges.map((range, i) => (
                <Card key={range.id} className="overflow-hidden border-gray-100">
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
              <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                <Button onClick={handleSave} className="w-full" size="lg" data-testid="button-save-ranges">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
                <Button onClick={handleReset} variant="outline" className="w-full text-gray-500" size="lg" data-testid="button-reset-ranges">
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset to Defaults
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Temporary Photo Settings */}
        <AccordionItem value="photo-settings" className="border border-gray-200 rounded-2xl overflow-hidden px-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors" data-testid="accordion-photo-settings">
            <span className="font-semibold text-gray-900">Temporary Photo Settings</span>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="pt-2 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Photo Expiration</p>
                <div className="flex gap-3">
                  {[24, 48].map(hours => (
                    <button
                      key={hours}
                      onClick={() => updateAppSettings({ photoExpirationHours: hours as 24 | 48 })}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${appSettings.photoExpirationHours === hours ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      data-testid={`button-expiry-${hours}h`}
                    >
                      {hours} hours
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Photos are automatically deleted after this time.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Updates */}
        <AccordionItem value="updates" className="border border-gray-200 rounded-2xl overflow-hidden px-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors" data-testid="accordion-updates">
            <span className="font-semibold text-gray-900">Updates</span>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="pt-2 space-y-6">
              {VERSION_HISTORY.map(v => (
                <div key={v.version}>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h3 className="text-base font-bold text-gray-900">Version {v.version}</h3>
                    <span className="text-xs text-gray-400">{v.date}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">New Features</p>
                      <ul className="space-y-1">
                        {v.features.map((f, i) => (
                          <li key={i} className="text-sm text-gray-700 flex gap-2">
                            <span className="text-primary shrink-0">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {v.bugfixes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bug Fixes</p>
                        <ul className="space-y-1">
                          {v.bugfixes.map((b, i) => (
                            <li key={i} className="text-sm text-gray-700 flex gap-2">
                              <span className="text-green-500 shrink-0">•</span> {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
