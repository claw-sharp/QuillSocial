import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@components/PageWrapper";
import Shell from "@quillsocial/features/shell/Shell";
import { HeadSeo, Button, TextArea, showToast } from "@quillsocial/ui";
import {
  PenTool,
  CalendarDays,
  Copy,
  Save,
  Wand
} from "@quillsocial/ui/components/icon";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { trpc } from "@quillsocial/trpc/react";

// Helper function to parse X/Twitter thread content into individual tweets
function parseXThread(content: string): string[] {
  // Try to split by numbered pattern (1/, 2/, 3/, etc.)
  const numberedPattern = /\d+\/\s*/g;

  // Check if content has numbered format
  if (numberedPattern.test(content)) {
    const items = content.split(numberedPattern).filter(item => item.trim());
    return items;
  }

  // Fallback: split by double newlines or single newlines if content is short
  const byDoubleNewline = content.split(/\n\n+/).filter(item => item.trim());
  if (byDoubleNewline.length > 1) {
    return byDoubleNewline;
  }

  // Last resort: split by single newlines
  return content.split(/\n/).filter(item => item.trim());
}

interface Tab {
  id: string;
  name: string;
}

const PostFactoryPage: React.FC & { PageWrapper?: any } = () => {
  const { t } = useLocale();
  const router = useRouter();
  const { ideaId } = router.query;

  const [outline, setOutline] = useState("Hook, 3 lessons on pricing ladder, example, CTA to pricing checklist");
  const [tone, setTone] = useState<"friendly" | "authoritative" | "contrarian">("authoritative");
  const [activeTab, setActiveTab] = useState("linkedin");
  const [cta, setCta] = useState("Join the pricing checklist");
  const [utm, setUtm] = useState("?utm_source=li&utm_medium=post");
  const [selectedPlatforms, setSelectedPlatforms] = useState<("linkedin" | "x" | "carousel" | "shorts" | "blog")[]>(["linkedin"]);
  const [xThreadItems, setXThreadItems] = useState<string[]>([
    "Most founders raise prices wrong. They wait too long, discount too fast, ladder incorrectly.",
    "Lesson 1: Value first, price second. Show ROI before discussing cost.",
    "Lesson 2: Granular pricing tiers. Give buyers choice and control.",
    "Lesson 3: Communicate early. Surprises kill trust.",
    "Example: A client shifted to annual pricing with 20% discount. Churn dropped 15%.",
    "Pricing isn't static. Test, iterate, communicate.",
    "Want the full checklist? Reply and I'll send it over.",
  ]);

  // Fetch idea from ideas-pillars if ideaId is provided
  const { data: ideas } = trpc.viewer.ideasPillars.listIdeas.useQuery(
    {},
    { enabled: !!ideaId }
  );

  // Load outline from idea when data is available
  useEffect(() => {
    if (ideaId && ideas) {
      const idea = ideas.find((i) => i.id === ideaId);
      if (idea?.outline) {
        setOutline(idea.outline.text);
        const toneMap = {
          FRIENDLY: "friendly" as const,
          AUTHORITATIVE: "authoritative" as const,
          CONTRARIAN: "contrarian" as const,
        };
        setTone(toneMap[idea.outline.tone] || "friendly");
        showToast("Loaded outline from idea", "success");
      } else if (idea) {
        // Use the idea title as a starting point
        setOutline(idea.title);
        showToast("Loaded idea. You can expand it to an outline first.", "success");
      }
    }
  }, [ideaId, ideas]);

  const [outputs, setOutputs] = useState({
    linkedin: `Most founders raise prices wrong. Here's the ladder we use:
1) Keep entry low friction
2) Add mid-tier with transformation
3) Anchor with premium service
CTA: ${cta}`,
    x: `1/ Pricing is a product.
2/ Ladder your value, not just your price.
3/ Examples...`,
    carousel: "",
    shorts: `Hook (5s): Most founders price backwards.
3 bullets (30s): Ladder, Transform, Anchor.
Proof (15s): Client cut churn 18%.
CTA (10s): Grab the free pricing checklist.`,
    blog: `# The Pricing Ladder Playbook

**Big claim:** Pricing is a product.

**Why it matters:** ...

**3 Insights:** ...

**Playbook:** ...

**CTA:** ${cta}`,
  });

  // tRPC mutations
  const generateAllMutation = trpc.viewer.postFactory.generateAll.useMutation({
    onSuccess: (data) => {
      setOutputs({
        linkedin: data.outputs.linkedin || "",
        x: data.outputs.x || "",
        carousel: data.outputs.carousel || "",
        shorts: data.outputs.shorts || "",
        blog: data.outputs.blog || "",
      });

      // Parse X thread into individual items
      if (data.outputs.x) {
        const threadItems = parseXThread(data.outputs.x);
        setXThreadItems(threadItems);
      }

      showToast("Content generated successfully!", "success");
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, "error");
    },
  });

  const expandOutlineMutation = trpc.viewer.postFactory.expandOutline.useMutation({
    onSuccess: (data) => {
      setOutline(data.outline);
      setTone(data.tone as "friendly" | "authoritative" | "contrarian");
      showToast("Outline expanded successfully!", "success");
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, "error");
    },
  });

  const regenerateMutation = trpc.viewer.postFactory.regenerate.useMutation({
    onSuccess: (data) => {
      setOutputs((prev) => ({
        ...prev,
        [data.platform]: data.content,
      }));

      // Parse X thread into individual items if regenerating X
      if (data.platform === "x" && data.content) {
        const threadItems = parseXThread(data.content);
        setXThreadItems(threadItems);
      }

      showToast(`${data.platform} content regenerated!`, "success");
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, "error");
    },
  });

  const tabs: Tab[] = [
    { id: "linkedin", name: "LinkedIn" },
    { id: "x", name: "X Thread" },
    { id: "carousel", name: "IG Carousel" },
    { id: "shorts", name: "Shorts" },
    { id: "blog", name: "Blog" },
  ];

  const togglePlatform = (platform: "linkedin" | "x" | "carousel" | "shorts" | "blog") => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const handleGenerateAll = () => {
    if (!outline.trim()) {
      showToast("Please enter an outline", "error");
      return;
    }

    if (selectedPlatforms.length === 0) {
      showToast("Please select at least one platform", "error");
      return;
    }

    generateAllMutation.mutate({
      outline,
      tone,
      platforms: selectedPlatforms,
      cta,
      utm,
    });
  };

  const handleSchedule = () => {
    // TODO: Integrate with scheduling system
    router.push("/calendar");
  };

  const handleCopy = () => {
    const content = outputs[activeTab as keyof typeof outputs];
    navigator.clipboard.writeText(content);
    showToast("Content copied to clipboard", "success");
  };

  const handleRegenerate = () => {
    if (!outline.trim()) {
      showToast("Please enter an outline first", "error");
      return;
    }

    regenerateMutation.mutate({
      outline,
      platform: activeTab as "linkedin" | "x" | "carousel" | "shorts" | "blog",
      cta,
      utm,
    });
  };

  return (
    <>
      <HeadSeo
        title={t("Post Factory")}
        description={t("Create multi-format content from a single outline")}
      />

      <Shell
        withoutSeo
        heading={t("Post Factory")}
        subtitle="One outline → multi-format outputs"
        CTA={
          <div className="flex gap-3">
            <Button
              color="secondary"
              StartIcon={Save}
              onClick={handleSchedule}
            >
              {t("Save Draft")}
            </Button>
            <Button
              StartIcon={CalendarDays}
              onClick={handleSchedule}
            >
              {t("Schedule Now")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold mb-1">Input</h3>
              <p className="text-sm text-slate-500">Outline</p>
            </div>

            <div className="space-y-4">
              <TextArea
                className="min-h-[200px] w-full rounded-xl border-slate-200"
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="Hook, 3 bullets, example, CTA"
              />

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 font-medium block mb-2">Tone</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTone("friendly")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        tone === "friendly"
                          ? "bg-blue-500 text-white"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      Friendly
                    </button>
                    <button
                      onClick={() => setTone("authoritative")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        tone === "authoritative"
                          ? "bg-blue-500 text-white"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      Authoritative
                    </button>
                    <button
                      onClick={() => setTone("contrarian")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        tone === "contrarian"
                          ? "bg-blue-500 text-white"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      Contrarian
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium block mb-2">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => togglePlatform("linkedin")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("linkedin")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      LinkedIn
                    </button>
                    <button
                      onClick={() => togglePlatform("x")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("x")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      X
                    </button>
                    <button
                      onClick={() => togglePlatform("carousel")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("carousel")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Instagram
                    </button>
                    <button
                      onClick={() => togglePlatform("shorts")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("shorts")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      YouTube
                    </button>
                    <button
                      onClick={() => togglePlatform("blog")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("blog")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Blog
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full rounded-xl"
                  onClick={handleGenerateAll}
                  StartIcon={Wand}
                  loading={generateAllMutation.isLoading}
                  disabled={generateAllMutation.isLoading}
                >
                  {generateAllMutation.isLoading ? "Generating..." : "Generate All"}
                </Button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold mb-1">Outputs</h3>
              <p className="text-sm text-slate-500">Preview & tweak each format</p>
            </div>

            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {activeTab === "carousel" ? (
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="p-3 border rounded-xl bg-slate-50 min-h-[90px] text-sm flex items-center justify-center"
                      >
                        Slide {i + 1}
                      </div>
                    ))}
                  </div>
                ) : activeTab === "x" ? (
                  <div className="space-y-3">
                    {xThreadItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <TextArea
                          className="flex-1 min-h-[80px] rounded-xl border-slate-200"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...xThreadItems];
                            newItems[index] = e.target.value;
                            setXThreadItems(newItems);
                            // Update outputs as well
                            setOutputs({
                              ...outputs,
                              x: newItems.map((t, i) => `${i + 1}/ ${t}`).join("\n\n")
                            });
                          }}
                        />
                        <button
                          onClick={() => {
                            const newItems = xThreadItems.filter((_, i) => i !== index);
                            setXThreadItems(newItems);
                            setOutputs({
                              ...outputs,
                              x: newItems.map((t, i) => `${i + 1}/ ${t}`).join("\n\n")
                            });
                          }}
                          className="flex-shrink-0 text-red-500 hover:text-red-700 px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setXThreadItems([...xThreadItems, ""]);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add tweet
                    </button>
                  </div>
                ) : (
                  <TextArea
                    className="min-h-[300px] w-full rounded-xl border-slate-200"
                    value={outputs[activeTab as keyof typeof outputs]}
                    onChange={(e) =>
                      setOutputs({ ...outputs, [activeTab]: e.target.value })
                    }
                  />
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 my-4" />

              {/* CTA & UTM Inputs */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="First-comment CTA"
                  />
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={utm}
                    onChange={(e) => setUtm(e.target.value)}
                    placeholder="UTM parameters"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-xl"
                    onClick={handleCopy}
                    StartIcon={Copy}
                  >
                    Copy
                  </Button>
                  <Button
                    className="rounded-xl"
                    color="secondary"
                    onClick={handleRegenerate}
                    StartIcon={Wand}
                    loading={regenerateMutation.isLoading}
                    disabled={regenerateMutation.isLoading}
                  >
                    {regenerateMutation.isLoading ? "Regenerating..." : "Regenerate"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
};PostFactoryPage.PageWrapper = PageWrapper;

export default PostFactoryPage;
