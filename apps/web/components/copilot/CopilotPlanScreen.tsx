import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  Input,
  NumberInput,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  TextArea,
  Tooltip,
  showToast,
} from "@quillsocial/ui";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Download,
  Edit,
  Info,
  Loader2,
  Plus,
  Save,
  Trash2,
  Undo2,
  Wand2,
} from "@quillsocial/ui/components/icon";
import classNames from "classnames";
import { COPILOT_PRESETS } from "./presets";
import {
  CadenceConflict,
  cadenceChannels,
  cadenceDays,
  cadenceFormats,
  createId,
  dedupeTargets,
  detectCadenceConflicts,
  summarisePlan,
  targetPlatforms,
  validatePlan,
  COPILOT_DRAFT_STORAGE_KEY,
  buildDefaultPlan,
} from "./utils";
import {
  AudienceStage,
  CadenceChannel,
  CadenceDay,
  CadenceFormat,
  Plan,
  PlanBlockKey,
  PlanCadenceSlot,
  PlanPillar,
  PlanTargets,
  Target,
  TargetPlatform,
  ToneOption,
} from "./types";

interface DraftPayload {
  plan: Plan;
  purpose: string;
  tone: ToneOption;
  audienceStage: AudienceStage;
  selectedPresetId: string | null;
  savedAt: string;
}

interface PurposeCardProps {
  purpose: string;
  onPurposeChange: (value: string) => void;
  tone: ToneOption;
  onToneChange: (tone: ToneOption) => void;
  audienceStage: AudienceStage;
  onAudienceStageChange: (stage: AudienceStage) => void;
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  onGeneratePlan: () => void;
  onUsePreset: () => void;
  disableGenerate: boolean;
  isGenerating: boolean;
}

const PurposeCard: React.FC<PurposeCardProps> = ({
  purpose,
  onPurposeChange,
  tone,
  onToneChange,
  audienceStage,
  onAudienceStageChange,
  selectedPresetId,
  onSelectPreset,
  onGeneratePlan,
  onUsePreset,
  disableGenerate,
  isGenerating,
}) => {
  const toneOptions: { key: ToneOption; label: string }[] = [
    { key: "friendly", label: "Friendly" },
    { key: "authoritative", label: "Authoritative" },
    { key: "contrarian", label: "Contrarian" },
  ];

  const audienceOptions: { key: AudienceStage; label: string }[] = [
    { key: "starting", label: "Starting" },
    { key: "small", label: "Small" },
    { key: "growing", label: "Growing" },
  ];

  return (
    <div className="p-6 space-y-6 rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Purpose</h2>
          <p className="text-sm text-slate-500">
            Describe what you want to achieve. Copilot will translate it into pillars, cadence, and reach targets.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onGeneratePlan}
          StartIcon={isGenerating ? Loader2 : Wand2}
          disabled={disableGenerate || isGenerating}
        >
          {isGenerating ? "Generating" : "Generate Plan"}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="copilot-purpose">
            Describe what you want to achieve
          </label>
          <TextArea
            id="copilot-purpose"
            value={purpose}
            onChange={(event) => onPurposeChange(event.target.value)}
            rows={5}
            placeholder="e.g. Launch a contrarian SaaS voice that attracts senior operators"
            className="min-h-[160px]"
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-600">Preset personas</span>
            <div className="flex flex-wrap gap-2">
              {COPILOT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className={classNames(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                    selectedPresetId === preset.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[160px] space-y-2">
              <span className="text-sm font-medium text-slate-600">Tone</span>
              <div className="flex gap-2">
                {toneOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onToneChange(option.key)}
                    className={classNames(
                      "flex-1 rounded-xl px-3 py-1.5 text-sm font-medium",
                      tone === option.key
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-[160px] space-y-2">
              <span className="text-sm font-medium text-slate-600">Audience size</span>
              <div className="flex gap-2">
                {audienceOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onAudienceStageChange(option.key)}
                    className={classNames(
                      "flex-1 rounded-xl px-3 py-1.5 text-sm font-medium",
                      audienceStage === option.key
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Info size={16} />
          <span>Using a preset keeps defaults but still lets you edit before applying.</span>
        </div>
        <Button
          variant="secondary"
          onClick={onUsePreset}
          disabled={!selectedPresetId}
        >
          Use Preset
        </Button>
      </div>
    </div>
  );
};

interface PlanPreviewProps {
  plan: Plan;
  expandedBlock: PlanBlockKey | null;
  onToggleBlock: (block: PlanBlockKey) => void;
  onEditPillars: () => void;
  onEditCadence: () => void;
  onEditTargets: () => void;
  onEditEngagement: () => void;
  validationErrors: Partial<Record<PlanBlockKey, string>>;
}

const PlanPreviewBlock: React.FC<{
  title: string;
  block: PlanBlockKey;
  expandedBlock: PlanBlockKey | null;
  onToggleBlock: (block: PlanBlockKey) => void;
  onEdit: () => void;
  hasError?: boolean;
  helper?: string;
  children: React.ReactNode;
}> = ({
  title,
  block,
  expandedBlock,
  onToggleBlock,
  onEdit,
  hasError,
  helper,
  children,
}) => {
  const isOpen = expandedBlock === block;
  return (
    <div className={classNames("rounded-2xl border bg-white", hasError ? "border-rose-400" : "border-slate-200")}>
      <button
        type="button"
        onClick={() => onToggleBlock(block)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{title}</span>
            {hasError && (
              <Badge color="danger" size="sm">
                Fix
              </Badge>
            )}
          </div>
          {helper && <p className="text-xs text-slate-500">{helper}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="icon"
            color="minimal"
            size="sm"
            aria-label={`Edit ${title}`}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <Edit size={16} />
          </Button>
          <ChevronDown
            className={classNames(
              "transition-transform",
              isOpen ? "rotate-180" : "rotate-0"
            )}
            size={18}
          />
        </div>
      </button>
      {isOpen && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
    </div>
  );
};

const PillarTag: React.FC<{ pillar: PlanPillar }> = ({ pillar }) => (
  <div
    className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-slate-800"
    style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}
  >
    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pillar.color }} />
    {pillar.name}
  </div>
);

const formatLegend: Record<CadenceFormat, string> = {
  text: "Text",
  thread: "Thread",
  carousel: "Carousel",
  shorts: "Shorts",
  blog: "Blog",
};

const channelLabels: Record<CadenceChannel, string> = {
  linkedin: "LinkedIn",
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  blog: "Blog",
};

const platformBadges: Record<TargetPlatform, { label: string; tone: string }> = {
  x: { label: "X", tone: "bg-slate-900 text-white" },
  linkedin: { label: "LinkedIn", tone: "bg-blue-100 text-blue-700" },
  youtube: { label: "YouTube", tone: "bg-red-100 text-red-600" },
  instagram: { label: "Instagram", tone: "bg-fuchsia-100 text-fuchsia-600" },
  rss: { label: "RSS", tone: "bg-amber-100 text-amber-700" },
  other: { label: "Other", tone: "bg-slate-100 text-slate-600" },
};

const CadenceGrid: React.FC<{ plan: Plan }> = ({ plan }) => {
  const dayColumns = cadenceDays.map((day) => ({
    day,
    slots: plan.cadence.filter((slot) => slot.day === day),
  }));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-7 gap-3">
        {dayColumns.map(({ day, slots }) => (
          <div key={day} className="space-y-2">
            <div className="text-sm font-semibold text-slate-600">{day}</div>
            {slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">
                Empty
              </div>
            ) : (
              slots.map((slot) => (
                <div
                  key={`${slot.id}-${slot.type}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <span>{formatLegend[slot.type]}</span>
                    {slot.hourHint && <span>{`${slot.hourHint}:00`}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {slot.channels.map((channel) => (
                      <span
                        key={`${slot.id}-${channel}`}
                        className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500"
                      >
                        {channelLabels[channel]}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-600">Legend</span>
          {Object.entries(formatLegend).map(([key, label]) => (
            <span key={key} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const TargetsList: React.FC<{ targets: Target[] }> = ({ targets }) => {
  if (targets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">
        No targets yet. Import handles or add manually.
      </div>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {targets.map((target) => {
        const badge = platformBadges[target.platform] ?? platformBadges.other;
        return (
          <li
            key={target.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <div>
              <div className="font-medium text-slate-700">{target.handle}</div>
              {target.notes && <div className="text-xs text-slate-500">{target.notes}</div>}
            </div>
            <span className={classNames("rounded-full px-2 py-0.5 text-xs font-semibold", badge.tone)}>
              {badge.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const PlanPreview: React.FC<PlanPreviewProps> = ({
  plan,
  expandedBlock,
  onToggleBlock,
  onEditCadence,
  onEditEngagement,
  onEditPillars,
  onEditTargets,
  validationErrors,
}) => (
  <div className="space-y-4">
    <PlanPreviewBlock
      title="Pillars"
      block="pillars"
      expandedBlock={expandedBlock}
      onToggleBlock={onToggleBlock}
      onEdit={onEditPillars}
      hasError={Boolean(validationErrors.pillars)}
      helper="These set your storytelling themes."
    >
      <div className="flex flex-wrap gap-2">
        {plan.pillars.map((pillar) => (
          <PillarTag key={pillar.id} pillar={pillar} />
        ))}
      </div>
    </PlanPreviewBlock>

    <PlanPreviewBlock
      title="Cadence"
      block="cadence"
      expandedBlock={expandedBlock}
      onToggleBlock={onToggleBlock}
      onEdit={onEditCadence}
      hasError={Boolean(validationErrors.cadence)}
      helper="Weekly structure across channels."
    >
      <CadenceGrid plan={plan} />
    </PlanPreviewBlock>

    <PlanPreviewBlock
      title="Targets"
      block="targets"
      expandedBlock={expandedBlock}
      onToggleBlock={onToggleBlock}
      onEdit={onEditTargets}
      helper="Accounts to follow, reply to, or study."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>Peers</span>
            <Badge size="sm">{plan.targets.peers.length}</Badge>
          </div>
          <TargetsList targets={plan.targets.peers} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>Prospects</span>
            <Badge size="sm">{plan.targets.prospects.length}</Badge>
          </div>
          <TargetsList targets={plan.targets.prospects} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>Leaders</span>
            <Badge size="sm">{plan.targets.leaders.length}</Badge>
          </div>
          <TargetsList targets={plan.targets.leaders} />
        </div>
      </div>
    </PlanPreviewBlock>

    <PlanPreviewBlock
      title="Engagement Goal"
      block="engagement"
      expandedBlock={expandedBlock}
      onToggleBlock={onToggleBlock}
      onEdit={onEditEngagement}
      hasError={Boolean(validationErrors.engagement)}
      helper="Replies per day to hit."
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl font-semibold text-slate-800">{plan.dailyReplies}</div>
        <div className="text-sm text-slate-500">replies / day</div>
      </div>
    </PlanPreviewBlock>
  </div>
);

interface ApplyBarProps {
  visible: boolean;
  plan?: Plan | null;
  onApply: () => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
  disableApply: boolean;
  isApplying: boolean;
  isSavingDraft: boolean;
  summaryLabel?: string;
  hasUnsavedChanges: boolean;
}

const ApplyBar: React.FC<ApplyBarProps> = ({
  visible,
  plan,
  onApply,
  onDiscard,
  onSaveDraft,
  disableApply,
  isApplying,
  isSavingDraft,
  summaryLabel,
  hasUnsavedChanges,
}) => {
  if (!visible || !plan) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg shadow-slate-900/5 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 text-sm text-slate-600">
          <div className="font-semibold text-slate-800">Ready to apply?</div>
          <div>{summaryLabel}</div>
          {hasUnsavedChanges && <div className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle size={14}/> Unsaved edits</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            color="minimal"
            onClick={onDiscard}
            StartIcon={Trash2}
          >
            Discard
          </Button>
          <Button
            color="secondary"
            onClick={onSaveDraft}
            StartIcon={isSavingDraft ? Loader2 : Save}
            disabled={isSavingDraft}
          >
            {isSavingDraft ? "Saving" : "Save as Draft"}
          </Button>
          <Button
            onClick={onApply}
            StartIcon={isApplying ? Loader2 : CalendarDays}
            disabled={disableApply || isApplying}
          >
            {isApplying ? "Applying" : "Apply to Workspace"}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface PillarEditorProps {
  open: boolean;
  pillars: PlanPillar[];
  onClose: () => void;
  onSave: (pillars: PlanPillar[]) => void;
}

const colorChoices = [
  "#6366F1",
  "#F97316",
  "#22C55E",
  "#0EA5E9",
  "#EC4899",
  "#F59E0B",
  "#8B5CF6",
  "#14B8A6",
];

const PillarEditor: React.FC<PillarEditorProps> = ({ open, pillars, onClose, onSave }) => {
  const [localPillars, setLocalPillars] = useState<PlanPillar[]>(pillars);

  useEffect(() => {
    setLocalPillars(pillars);
  }, [pillars]);

  const handleChange = (id: string, key: keyof PlanPillar, value: string) => {
    setLocalPillars((prev) => prev.map((pillar) => (pillar.id === id ? { ...pillar, [key]: value } : pillar)));
  };

  const handleAdd = () => {
    setLocalPillars((prev) => [
      ...prev,
      {
        id: createId(),
        name: "New Pillar",
        color: colorChoices[prev.length % colorChoices.length],
      },
    ]);
  };

  const handleRemove = (id: string) => {
    setLocalPillars((prev) => prev.filter((pillar) => pillar.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader title="Edit pillars" />
        <div className="space-y-4">
          {localPillars.map((pillar) => (
            <div key={pillar.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3">
              <input
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={pillar.name}
                onChange={(event) => handleChange(pillar.id, "name", event.target.value)}
              />
              <div className="flex items-center gap-2">
                {colorChoices.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={classNames(
                      "h-6 w-6 rounded-full border-2",
                      pillar.color === color ? "border-slate-900" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleChange(pillar.id, "color", color)}
                  />
                ))}
              </div>
              <Button
                variant="icon"
                color="minimal"
                size="sm"
                aria-label="Remove pillar"
                onClick={() => handleRemove(pillar.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}

          <Button color="minimal" onClick={handleAdd} StartIcon={Plus}>
            Add pillar
          </Button>
        </div>
        <DialogFooter className="gap-2">
          <Button color="minimal" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(localPillars.filter((pillar) => pillar.name.trim().length > 0));
              onClose();
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CadenceEditorProps {
  open: boolean;
  cadence: PlanCadenceSlot[];
  onClose: () => void;
  onSave: (cadence: PlanCadenceSlot[]) => void;
}

const CadenceEditor: React.FC<CadenceEditorProps> = ({ open, cadence, onClose, onSave }) => {
  const [localCadence, setLocalCadence] = useState<PlanCadenceSlot[]>(cadence);

  useEffect(() => {
    setLocalCadence(cadence);
  }, [cadence]);

  const updateSlot = (id: string, updater: Partial<PlanCadenceSlot>) => {
    setLocalCadence((prev) => prev.map((slot) => (slot.id === id ? { ...slot, ...updater } : slot)));
  };

  const toggleChannel = (id: string, channel: CadenceChannel) => {
    setLocalCadence((prev) =>
      prev.map((slot) => {
        if (slot.id !== id) return slot;
        const channels = slot.channels.includes(channel)
          ? slot.channels.filter((value) => value !== channel)
          : [...slot.channels, channel];
        return { ...slot, channels };
      })
    );
  };

  const addSlot = () => {
    setLocalCadence((prev) => [
      ...prev,
      {
        id: createId(),
        day: "Mon",
        type: "text",
        channels: ["linkedin"],
        hourHint: 9,
      },
    ]);
  };

  const removeSlot = (id: string) => {
    setLocalCadence((prev) => prev.filter((slot) => slot.id !== id));
  };

  return (
    <Sheet open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>Edit cadence</SheetTitle>
        </SheetHeader>
        <div className="mt-6 grid gap-4">
          {localCadence.map((slot) => (
            <div key={slot.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-600">{slot.day} • {formatLegend[slot.type]}</div>
                <Button
                  variant="icon"
                  color="minimal"
                  size="sm"
                  onClick={() => removeSlot(slot.id)}
                  aria-label="Remove slot"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Day</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={slot.day}
                    onChange={(event) => updateSlot(slot.id, { day: event.target.value as CadenceDay })}
                  >
                    {cadenceDays.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Format</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={slot.type}
                    onChange={(event) => updateSlot(slot.id, { type: event.target.value as CadenceFormat })}
                  >
                    {cadenceFormats.map((format) => (
                      <option key={format} value={format}>
                        {formatLegend[format]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Channels</label>
                <div className="flex flex-wrap gap-2">
                  {cadenceChannels.map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(slot.id, channel)}
                      className={classNames(
                        "rounded-xl px-3 py-1 text-xs font-semibold transition",
                        slot.channels.includes(channel)
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {channelLabels[channel]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Hour hint</label>
                <NumberInput
                  value={slot.hourHint ?? ""}
                  min={5}
                  max={20}
                  placeholder="9"
                  onChange={(event) =>
                    updateSlot(slot.id, {
                      hourHint: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <SheetFooter className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button color="minimal" onClick={addSlot} StartIcon={Plus}>
              Add slot
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button color="minimal" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(localCadence)}>Save cadence</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

interface TargetsEditorProps {
  open: boolean;
  targets: PlanTargets;
  onClose: () => void;
  onSave: (targets: PlanTargets) => void;
  onImport: (group: keyof PlanTargets) => void;
}

const TargetsEditor: React.FC<TargetsEditorProps> = ({
  open,
  targets,
  onClose,
  onSave,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<keyof PlanTargets>("peers");
  const [localTargets, setLocalTargets] = useState<PlanTargets>(targets);

  useEffect(() => {
    setLocalTargets(targets);
  }, [targets]);

  const addTarget = (group: keyof PlanTargets) => {
    setLocalTargets((prev) => ({
      ...prev,
      [group]: [
        ...prev[group],
        {
          id: createId(),
          handle: "",
          platform: "x",
        },
      ],
    }));
  };

  const updateTarget = (group: keyof PlanTargets, id: string, update: Partial<Target>) => {
    setLocalTargets((prev) => ({
      ...prev,
      [group]: prev[group].map((target) => (target.id === id ? { ...target, ...update } : target)),
    }));
  };

  const removeTarget = (group: keyof PlanTargets, id: string) => {
    setLocalTargets((prev) => ({
      ...prev,
      [group]: prev[group].filter((target) => target.id !== id),
    }));
  };

  const groups: { key: keyof PlanTargets; label: string; helper: string }[] = [
    { key: "peers", label: "Peers", helper: "Creators at a similar stage" },
    { key: "prospects", label: "Prospects", helper: "Accounts likely to convert" },
    { key: "leaders", label: "Leaders", helper: "Signals and inspiration" },
  ];

  return (
    <Sheet open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <SheetContent position="left" size="xl">
        <SheetHeader>
          <SheetTitle>Curate targets</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setActiveTab(group.key)}
                className={classNames(
                  "rounded-xl px-3 py-1.5 text-sm font-semibold",
                  activeTab === group.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {group.label} ({localTargets[group.key].length})
              </button>
            ))}
            <Tooltip content="Paste handles in bulk">
              <span>
                <Button
                  color="minimal"
                  size="sm"
                  StartIcon={Download}
                  onClick={() => onImport(activeTab)}
                >
                  Import
                </Button>
              </span>
            </Tooltip>
          </div>
          <div>
            <p className="text-sm text-slate-500">
              {groups.find((group) => group.key === activeTab)?.helper}
            </p>
          </div>
          <div className="space-y-3">
            {localTargets[activeTab].map((target) => (
              <div key={target.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center">
                <Input
                  value={target.handle}
                  placeholder="@handle or url"
                  onChange={(event) => updateTarget(activeTab, target.id, { handle: event.target.value })}
                  className="flex-1"
                />
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-48"
                  value={target.platform}
                  onChange={(event) => updateTarget(activeTab, target.id, { platform: event.target.value as TargetPlatform })}
                >
                  {targetPlatforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platformBadges[platform].label}
                    </option>
                  ))}
                </select>
                <Input
                  value={target.notes ?? ""}
                  placeholder="Notes"
                  onChange={(event) => updateTarget(activeTab, target.id, { notes: event.target.value })}
                  className="flex-1"
                />
                <Button
                  variant="icon"
                  color="minimal"
                  size="sm"
                  aria-label="Remove target"
                  onClick={() => removeTarget(activeTab, target.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button color="minimal" onClick={() => addTarget(activeTab)} StartIcon={Plus}>
              Add target
            </Button>
          </div>
        </div>
        <SheetFooter className="mt-8 flex justify-end gap-2">
          <Button color="minimal" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(localTargets)}>Save targets</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

interface ImportTargetsDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (items: Target[]) => void;
}

const guessPlatform = (handle: string): TargetPlatform => {
  if (handle.startsWith("@")) {
    return "x";
  }
  if (handle.includes("linkedin")) {
    return "linkedin";
  }
  if (handle.includes("youtube") || handle.includes("youtu")) {
    return "youtube";
  }
  if (handle.includes("instagram")) {
    return "instagram";
  }
  if (handle.includes("http")) {
    return "other";
  }
  return "x";
};

const ImportTargetsDialog: React.FC<ImportTargetsDialogProps> = ({ open, onClose, onImport }) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!open) {
      setInputValue("");
    }
  }, [open]);

  const handleImport = () => {
    const rows = inputValue
      .split(/\n|,/)
      .map((row) => row.trim())
      .filter(Boolean);

    const targets = rows.map((handle) => ({
      id: createId(),
      handle,
      platform: guessPlatform(handle),
    }));

    onImport(targets);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader title="Import targets" />
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Paste handles or URLs. One per line. We will detect the platform when possible.
          </p>
          <TextArea
            rows={8}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={`@levelsio\nhttps://www.linkedin.com/in/revenueops\nfrontend.focus`}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button color="minimal" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!inputValue.trim()}>
            Import handles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface EngagementDialogProps {
  open: boolean;
  current: number;
  onClose: () => void;
  onSave: (value: number) => void;
}

const EngagementDialog: React.FC<EngagementDialogProps> = ({ open, current, onClose, onSave }) => {
  const [value, setValue] = useState<number>(current);

  useEffect(() => {
    setValue(current);
  }, [current, open]);

  return (
    <Dialog open={open} onOpenChange={(dialogOpen) => (!dialogOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader title="Adjust replies per day" />
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Your engagement goal feeds the engagement progress bar. Keep it above four to stay consistent.
          </p>
          <NumberInput
            value={value}
            min={1}
            onChange={(event) => setValue(Number(event.target.value))}
          />
          <p className="text-xs text-slate-500">Minimum recommended is 4 replies per day.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button color="minimal" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(Math.max(0, value))}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ConflictsReviewDialogProps {
  open: boolean;
  conflicts: CadenceConflict[];
  onClose: () => void;
  onResolve: (resolutions: Record<string, { action: "keep" | "merge" | "move"; moveDay?: CadenceDay }>) => void;
}

const ConflictsReviewDialog: React.FC<ConflictsReviewDialogProps> = ({
  open,
  conflicts,
  onClose,
  onResolve,
}) => {
  const [resolutions, setResolutions] = useState<
    Record<string, { action: "keep" | "merge" | "move"; moveDay?: CadenceDay }>
  >({});

  useEffect(() => {
    if (open) {
      const defaultResolutions: Record<string, { action: "keep" | "merge" | "move"; moveDay?: CadenceDay }> = {};
      conflicts.forEach((conflict) => {
        defaultResolutions[conflict.id] = { action: "merge" };
      });
      setResolutions(defaultResolutions);
    }
  }, [conflicts, open]);

  const handleActionChange = (conflictId: string, action: "keep" | "merge" | "move") => {
    setResolutions((prev) => ({
      ...prev,
      [conflictId]: {
        ...(prev[conflictId] ?? { action: "merge" }),
        action,
      },
    }));
  };

  const handleMoveDay = (conflictId: string, day: CadenceDay) => {
    setResolutions((prev) => ({
      ...prev,
      [conflictId]: {
        ...(prev[conflictId] ?? { action: "move" }),
        action: "move",
        moveDay: day,
      },
    }));
  };

  const actionLabel: Record<"keep" | "merge" | "move", string> = {
    keep: "Keep both slots",
    merge: "Merge into one slot",
    move: "Move to a different day",
  };

  return (
    <Dialog open={open} onOpenChange={(dialogOpen) => (!dialogOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader title="Resolve cadence conflicts" />
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Some cadence slots overlap on the same day, channel, and format. Choose how to resolve each conflict so placeholders line up cleanly.
          </p>
          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-amber-700">
                      {conflict.day} · {channelLabels[conflict.channel]} ({conflict.slots.length} slots)
                    </div>
                    <p className="text-xs text-amber-600">
                      Slots share the same day and channel. Decide whether to keep, merge, or move.
                    </p>
                  </div>
                  <Badge color="warning" size="sm">Conflict</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {conflict.slots.map((slot) => (
                    <div key={slot.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-slate-600">
                      {formatLegend[slot.type]} • {slot.channels.map((channel) => channelLabels[channel]).join(", ")}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {(Object.keys(actionLabel) as Array<"keep" | "merge" | "move">).map((action) => (
                    <label key={action} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="radio"
                        name={`conflict-${conflict.id}`}
                        checked={(resolutions[conflict.id]?.action ?? "merge") === action}
                        onChange={() => handleActionChange(conflict.id, action)}
                      />
                      {actionLabel[action]}
                    </label>
                  ))}
                  {resolutions[conflict.id]?.action === "move" && (
                    <div className="ml-6 flex flex-wrap gap-2">
                      {cadenceDays.map((day) => (
                        <button
                          key={day}
                          type="button"
                          className={classNames(
                            "rounded-xl px-3 py-1 text-xs font-semibold",
                            resolutions[conflict.id]?.moveDay === day
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          )}
                          onClick={() => handleMoveDay(conflict.id, day)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button color="minimal" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onResolve(resolutions)}>Resolve conflicts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const applyConflictResolutions = (
  plan: Plan,
  conflicts: CadenceConflict[],
  resolutions: Record<string, { action: "keep" | "merge" | "move"; moveDay?: CadenceDay }>
): Plan => {
  let updatedCadence = [...plan.cadence];

  conflicts.forEach((conflict) => {
    const resolution = resolutions[conflict.id] ?? { action: "merge" };
    if (resolution.action === "keep") {
      return;
    }
    if (resolution.action === "merge") {
      const [first, ...rest] = conflict.slots;
      updatedCadence = updatedCadence.filter((slot) =>
        rest.every((item) => item.id !== slot.id)
      );
      updatedCadence = updatedCadence.map((slot) => (slot.id === first.id ? { ...slot, channels: Array.from(new Set(conflict.slots.flatMap((s) => s.channels))) } : slot));
    }
    if (resolution.action === "move") {
      const targetDay = resolution.moveDay ?? conflict.day;
      const slotToMove = conflict.slots[conflict.slots.length - 1];
      updatedCadence = updatedCadence.map((slot) =>
        slot.id === slotToMove.id
          ? {
              ...slot,
              day: targetDay,
            }
          : slot
      );
    }
  });

  return {
    ...plan,
    cadence: updatedCadence,
  };
};

const fastSleep = (duration = 500) => new Promise((resolve) => setTimeout(resolve, duration));

const CopilotPlanScreen: React.FC = () => {
  const [purpose, setPurpose] = useState<string>("");
  const [tone, setTone] = useState<ToneOption>("friendly");
  const [audienceStage, setAudienceStage] = useState<AudienceStage>("starting");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<PlanBlockKey | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<PlanBlockKey, string>>>({});
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [draftMeta, setDraftMeta] = useState<string | null>(null);
  const [pillarsEditorOpen, setPillarsEditorOpen] = useState(false);
  const [cadenceEditorOpen, setCadenceEditorOpen] = useState(false);
  const [targetsEditorOpen, setTargetsEditorOpen] = useState(false);
  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);
  const [importTargetsOpen, setImportTargetsOpen] = useState(false);
  const [conflicts, setConflicts] = useState<CadenceConflict[]>([]);
  const [conflictsDialogOpen, setConflictsDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(COPILOT_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw) as DraftPayload;
      if (payload?.plan) {
        setShowRestoreBanner(true);
        setDraftMeta(payload.savedAt);
      }
    } catch (error) {
      console.error("Failed to parse copilot draft", error);
    }
  }, []);

  const summaryInfo = useMemo(() => {
    if (!plan) return null;
    return summarisePlan(plan);
  }, [plan]);

  const disableGenerate = !purpose.trim() && !selectedPresetId;

  const hydrateFromDraft = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(COPILOT_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw) as DraftPayload;
      if (!payload.plan) return;
      setPurpose(payload.purpose);
      setTone(payload.tone);
      setAudienceStage(payload.audienceStage);
      setSelectedPresetId(payload.selectedPresetId);
      setPlan(payload.plan);
      setShowRestoreBanner(false);
      setHasUnsavedChanges(false);
      setValidationErrors({});
      setExpandedBlock("pillars");
      showToast("Draft restored", "success");
    } catch (error) {
      console.error("Unable to restore Copilot draft", error);
      showToast("Could not restore draft", "error");
    }
  };

  const clearDraftStorage = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(COPILOT_DRAFT_STORAGE_KEY);
    setDraftMeta(null);
  };

  const persistDraft = (currentPlan: Plan) => {
    if (typeof window === "undefined") return;
    setIsSavingDraft(true);
    const payload: DraftPayload = {
      plan: currentPlan,
      purpose,
      tone,
      audienceStage,
      selectedPresetId,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(COPILOT_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    setTimeout(() => {
      setIsSavingDraft(false);
      setHasUnsavedChanges(false);
      setDraftMeta(payload.savedAt);
      showToast("Draft saved", "success");
    }, 200);
  };

  const handleGeneratePlan = async () => {
    if (disableGenerate) {
      showToast("Describe a purpose or choose a preset first", "error");
      return;
    }
    setIsGenerating(true);
    console.log("copilot_generate_clicked", {
      preset: selectedPresetId ?? undefined,
      tone,
      audienceStage,
    });

    await fastSleep(450);

    const selectedPreset = COPILOT_PRESETS.find((preset) => preset.id === selectedPresetId);
    let generatedPlan: Plan;
    if (selectedPreset) {
      generatedPlan = selectedPreset.buildPlan();
      generatedPlan.purpose = purpose.trim() || generatedPlan.purpose;
      generatedPlan.tone = tone;
      generatedPlan.audienceStage = audienceStage;
    } else {
      generatedPlan = buildDefaultPlan(purpose, tone, audienceStage);
    }

    setPlan(generatedPlan);
    setExpandedBlock("pillars");
    setValidationErrors({});
    setHasUnsavedChanges(true);
    setIsGenerating(false);
    console.log("copilot_plan_generated", {
      pillars: generatedPlan.pillars.length,
      slots: generatedPlan.cadence.length,
      targets: generatedPlan.targets.peers.length + generatedPlan.targets.prospects.length + generatedPlan.targets.leaders.length,
    });
  };

  const handleUsePreset = () => {
    if (!selectedPresetId) {
      showToast("Select a preset to load", "error");
      return;
    }
    const preset = COPILOT_PRESETS.find((item) => item.id === selectedPresetId);
    if (!preset) return;
    const presetPlan = preset.buildPlan();
    presetPlan.tone = tone;
    presetPlan.audienceStage = audienceStage;
    presetPlan.purpose = purpose.trim() || presetPlan.purpose;
    setPlan(presetPlan);
    setExpandedBlock("pillars");
    setValidationErrors({});
    setHasUnsavedChanges(true);
    showToast(`${preset.label} preset applied. Review and apply when ready.`, "success");
  };

  const touchPlan = (updater: (plan: Plan) => Plan) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      setHasUnsavedChanges(true);
      console.log("copilot_plan_edited", { block: "unknown" });
      return updated;
    });
  };

  const handleEditPillars = (updatedPillars: PlanPillar[]) => {
    setPlan((prev) => {
      if (!prev) return prev;
      setHasUnsavedChanges(true);
      console.log("copilot_plan_edited", { block: "pillars" });
      return {
        ...prev,
        pillars: updatedPillars,
      };
    });
  };

  const handleEditCadence = (updatedCadence: PlanCadenceSlot[]) => {
    setPlan((prev) => {
      if (!prev) return prev;
      setHasUnsavedChanges(true);
      console.log("copilot_plan_edited", { block: "cadence" });
      return {
        ...prev,
        cadence: updatedCadence,
      };
    });
  };

  const handleEditTargets = (updatedTargets: PlanTargets) => {
    setPlan((prev) => {
      if (!prev) return prev;
      setHasUnsavedChanges(true);
      console.log("copilot_plan_edited", { block: "targets" });
      return {
        ...prev,
        targets: updatedTargets,
      };
    });
  };

  const handleEditEngagement = (value: number) => {
    setPlan((prev) => {
      if (!prev) return prev;
      setHasUnsavedChanges(true);
      console.log("copilot_plan_edited", { block: "engagement" });
      return {
        ...prev,
        dailyReplies: value,
      };
    });
  };

  const handleSaveDraft = () => {
    if (!plan) return;
    persistDraft(plan);
  };

  const handleDiscard = () => {
    if (!plan) return;
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("Discard this plan? Unsaved edits will be lost.");
      if (!confirmed) return;
    }
    setPlan(null);
    setHasUnsavedChanges(false);
    setValidationErrors({});
    setExpandedBlock(null);
    showToast("Cleared plan preview", "success");
  };

  const handleApply = async () => {
    if (!plan) return;
    console.log("copilot_apply_clicked", {
      counts: summaryInfo ?? undefined,
      conflicts: 0,
    });
    const validation = validatePlan(plan);
    setValidationErrors(validation.errors);
    if (!validation.valid) {
      const firstError = Object.keys(validation.errors)[0] as PlanBlockKey | undefined;
      if (firstError) {
        setExpandedBlock(firstError);
      }
      showToast("Fix the highlighted blocks before applying.", "error");
      return;
    }

    const dedupedTargets = dedupeTargets(plan.targets);
    const planForApply = {
      ...plan,
      targets: dedupedTargets,
    };

    const foundConflicts = detectCadenceConflicts(planForApply);
    if (foundConflicts.length > 0) {
      console.log("copilot_apply_conflicts", { count: foundConflicts.length });
      setConflicts(foundConflicts);
      setConflictsDialogOpen(true);
      return;
    }

    setIsApplying(true);
    await fastSleep(650);
    console.log("copilot_applied_success", {
      createdPlaceholders: planForApply.cadence.length * 4,
      upsertedTargets:
        planForApply.targets.peers.length +
        planForApply.targets.prospects.length +
        planForApply.targets.leaders.length,
    });
    showToast("Plan applied to workspace. Check Calendar & Engagement.", "success");
    setHasUnsavedChanges(false);
    clearDraftStorage();
    setIsApplying(false);
  };

  const handleResolveConflicts = (
    resolutions: Record<string, { action: "keep" | "merge" | "move"; moveDay?: CadenceDay }>
  ) => {
    if (!plan) return;
    const resolvedPlan = applyConflictResolutions(plan, conflicts, resolutions);
    setPlan(resolvedPlan);
    setConflicts([]);
    setConflictsDialogOpen(false);
    setHasUnsavedChanges(true);
    showToast("Conflicts updated. Review cadence and apply again.", "success");
  };

  const emptyState = !plan;

  return (
    <div className="flex flex-col gap-6 pb-24">
      {showRestoreBanner && draftMeta && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Undo2 size={16} />
            <span>
              Draft saved {new Date(draftMeta).toLocaleString()}. Restore it to keep editing.
            </span>
          </div>
          <div className="flex gap-2">
            <Button color="minimal" size="sm" onClick={() => { clearDraftStorage(); setShowRestoreBanner(false); }}>
              Dismiss
            </Button>
            <Button size="sm" onClick={hydrateFromDraft}>
              Restore draft
            </Button>
          </div>
        </div>
      )}

      {!plan && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <div className="text-base font-semibold text-slate-800">Copilot flow</div>
            <p>Describe your purpose, generate a plan, then apply pillars, cadence, and targets to your workspace in one click.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
        <PurposeCard
          purpose={purpose}
          onPurposeChange={setPurpose}
          tone={tone}
          onToneChange={setTone}
          audienceStage={audienceStage}
          onAudienceStageChange={setAudienceStage}
          selectedPresetId={selectedPresetId}
          onSelectPreset={setSelectedPresetId}
          onGeneratePlan={handleGeneratePlan}
          onUsePreset={handleUsePreset}
          disableGenerate={disableGenerate}
          isGenerating={isGenerating}
        />

        {plan && (
          <PlanPreview
            plan={plan}
            expandedBlock={expandedBlock}
            onToggleBlock={(block) =>
              setExpandedBlock((current) => (current === block ? null : block))
            }
            onEditPillars={() => setPillarsEditorOpen(true)}
            onEditCadence={() => setCadenceEditorOpen(true)}
            onEditTargets={() => setTargetsEditorOpen(true)}
            onEditEngagement={() => setEngagementDialogOpen(true)}
            validationErrors={validationErrors}
          />
        )}
      </div>

      <ApplyBar
        visible={!emptyState}
        plan={plan}
        onApply={handleApply}
        onSaveDraft={handleSaveDraft}
        onDiscard={handleDiscard}
        disableApply={!plan}
        isApplying={isApplying}
        isSavingDraft={isSavingDraft}
        summaryLabel={summaryInfo?.label}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {plan && (
        <>
          <PillarEditor
            open={pillarsEditorOpen}
            pillars={plan.pillars}
            onClose={() => setPillarsEditorOpen(false)}
            onSave={handleEditPillars}
          />
          <CadenceEditor
            open={cadenceEditorOpen}
            cadence={plan.cadence}
            onClose={() => setCadenceEditorOpen(false)}
            onSave={handleEditCadence}
          />
          <TargetsEditor
            open={targetsEditorOpen}
            targets={plan.targets}
            onClose={() => setTargetsEditorOpen(false)}
            onSave={handleEditTargets}
            onImport={() => setImportTargetsOpen(true)}
          />
          <EngagementDialog
            open={engagementDialogOpen}
            current={plan.dailyReplies}
            onClose={() => setEngagementDialogOpen(false)}
            onSave={(value) => {
              handleEditEngagement(value);
              setEngagementDialogOpen(false);
            }}
          />
          <ImportTargetsDialog
            open={importTargetsOpen}
            onClose={() => setImportTargetsOpen(false)}
            onImport={(targets) => {
              setPlan((prev) => {
                if (!prev) return prev;
                const mergedTargets: PlanTargets = {
                  ...prev.targets,
                  prospects: [...prev.targets.prospects, ...targets],
                };
                setHasUnsavedChanges(true);
                return {
                  ...prev,
                  targets: mergedTargets,
                };
              });
              setImportTargetsOpen(false);
            }}
          />
          <ConflictsReviewDialog
            open={conflictsDialogOpen}
            conflicts={conflicts}
            onClose={() => setConflictsDialogOpen(false)}
            onResolve={handleResolveConflicts}
          />
        </>
      )}
    </div>
  );
};

export default CopilotPlanScreen;
