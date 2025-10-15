import React from "react";
import { Button, Badge, TextArea } from "@quillsocial/ui";
import { Loader2, Wand2, Info } from "@quillsocial/ui/components/icon";
import classNames from "classnames";
import { AudienceStage, ToneOption } from "./types";
import { COPILOT_PRESETS } from "./presets";

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

export const PurposeCard: React.FC<PurposeCardProps> = ({
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

