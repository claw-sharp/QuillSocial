import {
  Badge,
  Button,
  Select,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  TextArea,
  showToast,
} from "@quillsocial/ui";
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
} from "@quillsocial/ui/components/icon";
import React, { useEffect, useState } from "react";
import type { Idea, Outline, Tone } from "./types";

// Mock outline generation based on tone and idea content
function generateMockOutline(ideaContent: string, tone: Tone): string {
  const templates = {
    friendly: {
      hook: "Most of us overcomplicate this.",
      lessons: [
        "Start with one clear next step.",
        "Make the win feel achievable in 2 minutes.",
        "Close the loop with one simple nudge.",
      ],
      example: "Real results from a simple change.",
      cta: 'Comment "checklist" and I\'ll share the template.',
    },
    authoritative: {
      hook: "Success begins at first contact.",
      lessons: [
        "Define a single activation event.",
        "Enforce a guided path to it.",
        "Instrument feedback at the moment of value.",
      ],
      example: "Measurable improvement post-implementation.",
      cta: "Get the activation checklist.",
    },
    contrarian: {
      hook: "The obvious solution isn't your problem.",
      lessons: [
        "The real issue is elsewhere—fix that first.",
        "Ship a 2-minute win, not a tour.",
        "Ask for feedback when value lands.",
      ],
      example: "Unexpected results from a counterintuitive approach.",
      cta: 'Want the script? Say "script".',
    },
  };

  const template = templates[tone];
  const ideaSnippet = ideaContent.slice(0, 40);

  return `Hook: ${template.hook}
Lesson 1: ${template.lessons[0]}
Lesson 2: ${template.lessons[1]}
Lesson 3: ${template.lessons[2]}
Example: ${ideaSnippet}... — ${template.example}
CTA: ${template.cta}`;
}

// OutlineDrawer Component Props
interface OutlineDrawerProps {
  open: boolean;
  idea: Idea | null;
  existingOutline: Outline | null;
  onSave: (outline: Outline) => void;
  onPromote: (idea: Idea) => void;
  onClose: () => void;
}

export function OutlineDrawer({
  open,
  idea,
  existingOutline,
  onSave,
  onPromote,
  onClose,
}: OutlineDrawerProps) {
  const [outlineDraft, setOutlineDraft] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [isDirty, setIsDirty] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize outline when drawer opens
  useEffect(() => {
    if (open && idea) {
      console.log("outline_opened", { ideaId: idea.id });

      if (existingOutline) {
        setOutlineDraft(existingOutline.text);
        setTone(existingOutline.metadata.tone);
        setIsDirty(false);
      } else {
        // Generate initial outline
        const initialOutline = generateMockOutline(idea.title, tone);
        setOutlineDraft(initialOutline);
        setIsDirty(false);
      }
    }
  }, [open, idea, existingOutline, tone]);

  // Handle regenerate
  const handleRegenerate = () => {
    if (!idea) return;

    console.log("outline_generated", { ideaId: idea.id, tone });
    setIsGenerating(true);

    // Simulate generation delay
    setTimeout(() => {
      const newOutline = generateMockOutline(idea.title, tone);
      setOutlineDraft(newOutline);
      setIsDirty(true);
      setIsGenerating(false);
    }, 800 + Math.random() * 400);
  };

  // Handle save
  const handleSave = () => {
    if (!idea || outlineDraft.trim().length < 30) return;

    const outline: Outline = {
      id: existingOutline?.id ?? `o_${Date.now()}`,
      ideaId: idea.id,
      text: outlineDraft,
      metadata: { tone },
    };

    console.log("outline_saved", { ideaId: idea.id });
    onSave(outline);
    setIsDirty(false);
    showToast("Outline saved", "success");
  };

  // Handle promote
  const handlePromote = () => {
    if (!idea) return;

    console.log("outline_promoted", { ideaId: idea.id });
    onPromote(idea);
    onClose();
  };

  // Handle close with dirty check
  const handleClose = () => {
    if (isDirty) {
      if (window.confirm("Discard changes?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOutlineDraft(e.target.value);
    setIsDirty(true);
  };

  if (!idea) return null;

  const ideaSnippet =
    idea.title.length > 56 ? `${idea.title.slice(0, 56)}...` : idea.title;

  const toneOptions = [
    { label: "Friendly", value: "friendly" },
    { label: "Authoritative", value: "authoritative" },
    { label: "Contrarian", value: "contrarian" },
  ];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        position="right"
        size="lg"
        className="flex flex-col overflow-hidden"
        data-testid="outline-drawer"
      >
        <SheetHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl font-semibold">Outline</SheetTitle>
              <SheetDescription className="mt-1 text-sm text-gray-600">
                From idea → {ideaSnippet}
              </SheetDescription>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 hover:bg-gray-100"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="tone-select" className="text-sm font-medium">
                Tone:
              </label>
              <Select
                id="tone-select"
                value={toneOptions.find((opt) => opt.value === tone)}
                onChange={(option: any) => {
                  setTone(option.value);
                  setIsDirty(true);
                }}
                options={toneOptions}
                className="w-40"
                data-testid="outline-tone"
              />
            </div>

            {idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag, index) => (
                  <Badge key={index} variant="blue" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <button
              className="ml-auto flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
              onClick={() => console.log("View original idea")}
            >
              <ExternalLink className="h-3 w-3" />
              View original idea
            </button>
          </div>
        </SheetHeader>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto py-4">
          <TextArea
            value={outlineDraft}
            onChange={handleTextChange}
            placeholder="Your outline will appear here..."
            className="min-h-[300px] w-full resize-none rounded-lg border p-4 font-mono text-sm"
            data-testid="outline-textarea"
          />

          <div className="mt-4">
            <Button
              color="secondary"
              onClick={handleRegenerate}
              disabled={isGenerating}
              StartIcon={isGenerating ? Loader2 : RefreshCw}
              className={isGenerating ? "animate-spin" : ""}
              data-testid="outline-regenerate"
            >
              {isGenerating ? "Generating..." : "Regenerate (mock)"}
            </Button>
          </div>
        </div>

        {/* Actions Footer */}
        <SheetFooter className="border-t pt-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              color="primary"
              onClick={handleSave}
              disabled={outlineDraft.trim().length < 30}
              className="flex-1"
              data-testid="outline-save"
              aria-label="Save outline"
            >
              Save Outline
            </Button>
            <Button
              color="secondary"
              onClick={handlePromote}
              className="flex-1"
              data-testid="outline-promote"
              aria-label="Send to Post Factory"
            >
              Promote to Post
            </Button>
            <Button
              color="minimal"
              onClick={handleClose}
              className="sm:w-auto"
              aria-label="Close drawer"
            >
              Close
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
