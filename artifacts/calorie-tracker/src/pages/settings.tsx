import { useState } from "react";
import { useCalorieData, ColorRange } from "../hooks/use-calorie-data";
import { useGrading } from "../hooks/use-grading";
import { DEFAULT_GRADE_SCALE } from "../lib/grading-utils";
import { getContrastColor } from "../lib/color-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save, RotateCcw, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VERSION_HISTORY = [
  {
    version: "1.3",
    date: "June 2026",
    features: [
      "Added quantity support for calorie entries",
      "Added decimal quantity support (e.g. 0.5, 1.5, 2.25)",
      "Added quantity support for meal ingredients",
      "Added quantity support for saved regular items",
      "Added quantity support for saved meals",
      "Added Quick Adjust Dial on the dashboard",
      "Quick Adjust supports −1000 to +1000 calories",
      "Quick Adjust moves in 5-calorie steps with hold-to-repeat",
      "Quick Adjust entries are always logged",
      "Added optional auto-name setting for Quick Adjust entries",
    ],
    improvements: [
      "Updates section now uses separate dropdowns for each version",
      "Duplicated entries preserve quantity",
      "Saved items can be reused with a custom quantity",
      "Entry cards show per-unit math when quantity ≠ 1",
    ],
    bugfixes: [] as string[],
  },
  {
    version: "1.2",
    date: "June 2026",
    features: [
      "Added optional calorie grading system",
      "Added ideal calorie goal range for grading",
      "Added daily grade reports",
      "Added 12:30 AM report availability",
      "Added browser notifications for new grade reports",
      "Added weekly grade reports",
      "Added customizable grading strictness",
      "Added standard American school-style letter grades",
      "Added grade colors",
      "Added No Data day handling",
      "Allowed net calories to go negative",
    ],
    improvements: [
      "Daily reports are based on total consumed calories",
      "Editing past days can recalculate reports after confirmation",
      "Weekly grades average completed daily reports",
    ],
    bugfixes: [] as string[],
  },
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
    improvements: [] as string[],
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

  const { settings: gradingSettings, updateSettings: updateGrading, requestNotificationPermission } = useGrading([]);

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

  const handleNotificationToggle = async () => {
    if (!gradingSettings.notificationsEnabled) {
      const perm = await requestNotificationPermission();
      if (perm === "granted") {
        updateGrading({ notificationsEnabled: true });
        toast({ title: "Notifications enabled", description: "You'll be notified when new grade reports are ready." });
      } else if (perm === "denied") {
        toast({ title: "Notifications blocked", description: "Browser notifications are blocked. Please enable them in your browser settings.", variant: "destructive" });
      }
    } else {
      updateGrading({ notificationsEnabled: false });
      toast({ title: "Notifications disabled" });
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col h-full animate-in fade-in duration-300 overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-xs text-gray-400 mt-1">App Version: v1.3</p>
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

        {/* Grading System */}
        <AccordionItem value="grading" className="border border-gray-200 rounded-2xl overflow-hidden px-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors" data-testid="accordion-grading">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {["#16a34a", "#86efac", "#facc15", "#f97316", "#ef4444"].map(c => (
                  <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="font-semibold text-gray-900">Grading System</span>
              {gradingSettings.enabled && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">ON</span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="pt-2 space-y-5">

              {/* Enable toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Enable Grading</p>
                  <p className="text-xs text-gray-400 mt-0.5">Show daily grade reports based on your goal range</p>
                </div>
                <button
                  onClick={() => updateGrading({ enabled: !gradingSettings.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${gradingSettings.enabled ? 'bg-primary' : 'bg-gray-200'}`}
                  data-testid="toggle-grading-enabled"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${gradingSettings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {gradingSettings.enabled && (
                <>
                  {/* Goal Range */}
                  <div className="space-y-3 pt-1 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 pt-2">Ideal Calorie Goal Range</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 uppercase">Min Calories</Label>
                        <Input
                          type="number"
                          value={gradingSettings.goalMin}
                          onChange={e => updateGrading({ goalMin: parseInt(e.target.value) || 0 })}
                          className="h-9 text-sm"
                          data-testid="input-goal-min"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 uppercase">Max Calories</Label>
                        <Input
                          type="number"
                          value={gradingSettings.goalMax}
                          onChange={e => updateGrading({ goalMax: parseInt(e.target.value) || 0 })}
                          className="h-9 text-sm"
                          data-testid="input-goal-max"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Consuming within this range earns an A+.</p>
                  </div>

                  {/* Strictness */}
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-700">Grading Strictness</p>
                    <div className="flex gap-2">
                      {(["lenient", "normal", "strict"] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => updateGrading({ strictness: s })}
                          className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${gradingSettings.strictness === s ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                          data-testid={`button-strictness-${s}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Controls how quickly grades drop outside your goal range.</p>
                  </div>

                  {/* No Data Days */}
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-700">No Data Days</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateGrading({ noDataHandling: "exclude" })}
                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${gradingSettings.noDataHandling === "exclude" ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        Exclude
                      </button>
                      <button
                        onClick={() => updateGrading({ noDataHandling: "zero" })}
                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${gradingSettings.noDataHandling === "zero" ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        Count as 0%
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">How days with no entries affect your weekly grade average.</p>
                  </div>

                  {/* Notifications */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Grade Report Notifications</p>
                        <p className="text-xs text-gray-400 mt-0.5">Notify when a new daily report is ready</p>
                      </div>
                      <Button
                        variant={gradingSettings.notificationsEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={handleNotificationToggle}
                        className="shrink-0"
                        data-testid="button-notifications"
                      >
                        {gradingSettings.notificationsEnabled ? <Bell className="w-4 h-4 mr-1.5" /> : <BellOff className="w-4 h-4 mr-1.5" />}
                        {gradingSettings.notificationsEnabled ? "On" : "Off"}
                      </Button>
                    </div>
                    {"Notification" in window && Notification.permission === "denied" && (
                      <p className="text-xs text-amber-600 mt-2">Notifications are blocked in your browser. Please enable them in your browser settings to use this feature.</p>
                    )}
                  </div>

                  {/* Advanced Grade Scale */}
                  <Accordion type="single" collapsible className="border border-gray-100 rounded-xl">
                    <AccordionItem value="grade-scale" className="border-0">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-medium text-gray-700">
                        Advanced: Grade Scale
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2 pt-1">
                          {gradingSettings.gradeScale.map((threshold, i) => (
                            <div key={threshold.letter} className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: threshold.color + "33", color: threshold.color }}
                              >
                                {threshold.letter}
                              </div>
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  type="number"
                                  value={threshold.minScore}
                                  onChange={e => {
                                    const newScale = [...gradingSettings.gradeScale];
                                    newScale[i] = { ...newScale[i], minScore: parseInt(e.target.value) || 0 };
                                    updateGrading({ gradeScale: newScale });
                                  }}
                                  className="h-8 text-sm w-20"
                                  min="0"
                                  max="100"
                                />
                                <span className="text-xs text-gray-400">– {i > 0 ? gradingSettings.gradeScale[i - 1].minScore - 1 : 100}</span>
                              </div>
                              <div
                                className="w-7 h-7 rounded-full border border-gray-200 shrink-0 relative overflow-hidden"
                                style={{ backgroundColor: threshold.color }}
                              >
                                <input
                                  type="color"
                                  value={threshold.color}
                                  onChange={e => {
                                    const newScale = [...gradingSettings.gradeScale];
                                    newScale[i] = { ...newScale[i], color: e.target.value };
                                    updateGrading({ gradeScale: newScale });
                                  }}
                                  className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
                                />
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3 text-xs text-gray-500"
                            onClick={() => updateGrading({ gradeScale: DEFAULT_GRADE_SCALE })}
                          >
                            Reset to Defaults
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Quick Adjust Settings */}
        <AccordionItem value="quick-adjust" className="border border-gray-200 rounded-2xl overflow-hidden px-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors" data-testid="accordion-quick-adjust">
            <span className="font-semibold text-gray-900">Quick Adjust Settings</span>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="pt-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-medium text-gray-800">Require name for Quick Adjust entries</p>
                  <p className="text-xs text-gray-400 mt-0.5">When on, you'll be prompted to name each Quick Adjust entry before it's logged.</p>
                </div>
                <button
                  onClick={() => {
                    if (appSettings.requireNameForQuickAdjust) {
                      if (confirm("Quick Adjust entries will still be logged, but they will use automatic names instead of custom names (e.g. \"Quick Add +150\"). This may make your log harder to review later.\n\nTurn off custom names?")) {
                        updateAppSettings({ requireNameForQuickAdjust: false });
                      }
                    } else {
                      updateAppSettings({ requireNameForQuickAdjust: true });
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${appSettings.requireNameForQuickAdjust ? 'bg-primary' : 'bg-gray-200'}`}
                  data-testid="toggle-require-name-quick-adjust"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${appSettings.requireNameForQuickAdjust ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {!appSettings.requireNameForQuickAdjust && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700">Auto-names are active. Quick Adjust entries will be logged as <span className="font-mono font-medium">"Quick Add +150"</span> or <span className="font-mono font-medium">"Quick Subtract -75"</span>.</p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Updates */}
        <AccordionItem value="updates" className="border border-gray-200 rounded-2xl overflow-hidden px-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors" data-testid="accordion-updates">
            <span className="font-semibold text-gray-900">Updates</span>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="pt-2">
              <Accordion type="single" collapsible className="space-y-2">
                {VERSION_HISTORY.map(v => (
                  <AccordionItem key={v.version} value={`v${v.version}`} className="border border-gray-100 rounded-xl overflow-hidden px-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 transition-colors">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-gray-800 text-sm">Version {v.version}</span>
                        <span className="text-[10px] text-gray-400">{v.date}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3 pt-1">
                        {v.features.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Features</p>
                            <ul className="space-y-1">
                              {v.features.map((f, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-primary shrink-0">•</span> {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {v.improvements.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Improvements</p>
                            <ul className="space-y-1">
                              {v.improvements.map((imp, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-blue-400 shrink-0">•</span> {imp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {v.bugfixes.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bug Fixes</p>
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
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
