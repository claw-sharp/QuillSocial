import React, { useState } from "react";
import { TextArea, Button, showToast } from "@quillsocial/ui";
import { Copy, Wand, Calendar, Send } from "@quillsocial/ui/components/icon";
import { BlogMarkdownEditor } from "@components/blog-editor/BlogMarkdownEditor";
import { trpc } from "@quillsocial/trpc/react";
import { InstallAppButtonWithoutPlanCheck } from "@quillsocial/app-store/components";
import SocialAvatar from "@quillsocial/features/shell/SocialAvatar";

type Outputs = {
  linkedin: string;
  x: string;
  carousel: string;
  shorts: string;
  blog: string;
};

type Props = {
  activeTab: string;
  setActiveTab: (t: string) => void;
  outputs: Outputs;
  setOutputs: (o: Outputs) => void;
  xThreadItems: string[];
  setXThreadItems: (items: string[]) => void;
  carouselSlides: string[];
  setCarouselSlides: (s: string[]) => void;
  regenerateLoading: boolean;
  handleCopy: () => void;
  handleRegenerate: () => void;
};

const tabs = [
  { id: "linkedin", name: "LinkedIn" },
  { id: "x", name: "X Thread" },
  { id: "carousel", name: "IG Carousel" },
  { id: "shorts", name: "Shorts" },
  { id: "blog", name: "Blog" },
];

const OutputPanel: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  outputs,
  setOutputs,
  xThreadItems,
  setXThreadItems,
  carouselSlides,
  setCarouselSlides,
  regenerateLoading,
  handleCopy,
  handleRegenerate,
}) => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Query LinkedIn integration status
  const { data: linkedinIntegration, isLoading: linkedinLoading } = trpc.viewer.integrations.useQuery({
    variant: "social",
    onlyInstalled: false,
    slug: "linkedin-social",
  });

  // Get social accounts to find LinkedIn account
  const { data: socialAccounts } = trpc.viewer.socials.getSocialNetWorking.useQuery();

  const linkedinAccount = socialAccounts?.find(
    (account) => account.appId === "linkedin-social"
  );

  const hasLinkedinAccount = linkedinIntegration?.items?.some(
    (item) => item.credentialIds.length > 0
  );

  const handlePublish = async () => {
    if (!linkedinAccount) {
      showToast("Please connect a LinkedIn account first", "error");
      return;
    }

    if (!outputs.linkedin?.trim()) {
      showToast("Please generate LinkedIn content first", "error");
      return;
    }

    showToast("Publishing to LinkedIn...", "success");
    // TODO: Implement actual publishing logic
  };

  const handleSchedule = () => {
    if (!linkedinAccount) {
      showToast("Please connect a LinkedIn account first", "error");
      return;
    }

    if (!outputs.linkedin?.trim()) {
      showToast("Please generate LinkedIn content first", "error");
      return;
    }

    setIsScheduleOpen(true);
    // TODO: Open schedule dialog
  };

  const handleInstallLinkedIn = async () => {
    try {
      const response = await fetch("/api/integrations/linkedinsocial/add");
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_self");
      }
    } catch (error) {
      showToast("Failed to initiate LinkedIn installation", "error");
    }
  };

  return (
    <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold mb-1">Outputs</h3>
        <p className="text-sm text-slate-500">Preview & tweak each format</p>
      </div>

      <div className="space-y-4">
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

        <div className="mt-4">
          {activeTab === "carousel" ? (
            <div className="space-y-3">
              {carouselSlides.map((slide, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">{index + 1}</div>
                  <TextArea
                    className="flex-1 min-h-[100px] rounded-xl border-slate-200"
                    value={slide}
                    onChange={(e) => {
                      const newSlides = [...carouselSlides];
                      newSlides[index] = e.target.value;
                      setCarouselSlides(newSlides);
                      setOutputs({ ...outputs, carousel: newSlides.join("\n\n") });
                    }}
                    placeholder={`Slide ${index + 1}: Title\n\n• Point 1\n• Point 2\n• Point 3`}
                  />
                  <button
                    onClick={() => {
                      const newSlides = carouselSlides.filter((_, i) => i !== index);
                      setCarouselSlides(newSlides);
                      setOutputs({ ...outputs, carousel: newSlides.join("\n\n") });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button onClick={() => setCarouselSlides([...carouselSlides, `Slide ${carouselSlides.length + 1}: Title\n\n• Point 1\n• Point 2\n• Point 3`])} className="text-sm text-purple-600 hover:text-purple-800 font-medium">+ Add slide</button>
            </div>
          ) : activeTab === "x" ? (
            <div className="space-y-3">
              {xThreadItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">{index + 1}</div>
                  <TextArea
                    className="flex-1 min-h-[80px] rounded-xl border-slate-200"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...xThreadItems];
                      newItems[index] = e.target.value;
                      setXThreadItems(newItems);
                      setOutputs({ ...outputs, x: newItems.map((t, i) => `${i + 1}/ ${t}`).join("\n\n") });
                    }}
                  />
                  <button
                    onClick={() => {
                      const newItems = xThreadItems.filter((_, i) => i !== index);
                      setXThreadItems(newItems);
                      setOutputs({ ...outputs, x: newItems.map((t, i) => `${i + 1}/ ${t}`).join("\n\n") });
                    }}
                    className="flex-shrink-0 text-red-500 hover:text-red-700 px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button onClick={() => setXThreadItems([...xThreadItems, ""]) } className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add tweet</button>
            </div>
          ) : activeTab === "blog" ? (
            <BlogMarkdownEditor value={outputs.blog} onChange={(value: string) => setOutputs({ ...outputs, blog: value })} placeholder="Write your blog post in markdown..." />
          ) : (
            <TextArea className="min-h-[300px] w-full rounded-xl border-slate-200" value={outputs[activeTab as keyof Outputs]} onChange={(e) => setOutputs({ ...outputs, [activeTab]: e.target.value } as Outputs)} />
          )}
        </div>

        <div className="border-t border-slate-200 my-4" />

        {/* LinkedIn-specific actions */}
        {activeTab === "linkedin" && (
          <div className="mb-4">
            {!linkedinLoading && (
              <>
                {hasLinkedinAccount && linkedinAccount ? (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                    {/* LinkedIn Account Info */}
                    <SocialAvatar
                      avatarUrl={linkedinAccount.avatarUrl || ""}
                      name={linkedinAccount.name}
                      appId={linkedinAccount.appId}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{linkedinAccount.name}</p>
                      <p className="text-xs text-slate-600 truncate">{linkedinAccount.emailOrUserName}</p>
                    </div>

                    {/* Publish & Schedule Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        className="rounded-xl px-4 py-2"
                        onClick={handlePublish}
                        StartIcon={Send}
                        disabled={!outputs.linkedin?.trim()}
                        size="sm"
                      >
                        Publish
                      </Button>
                      <Button
                        className="rounded-xl px-4 py-2"
                        color="secondary"
                        onClick={handleSchedule}
                        StartIcon={Calendar}
                        disabled={!outputs.linkedin?.trim()}
                        size="sm"
                      >
                        Schedule
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 text-center">
                    <p className="text-sm text-slate-600 mb-3">Connect your LinkedIn account to publish posts</p>
                    <Button
                      className="rounded-xl px-6"
                      onClick={handleInstallLinkedIn}
                    >
                      Install LinkedIn
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button className="rounded-xl" onClick={handleCopy} StartIcon={Copy}>Copy</Button>
          <Button className="rounded-xl" color="secondary" onClick={handleRegenerate} StartIcon={Wand} loading={regenerateLoading} disabled={regenerateLoading}>{regenerateLoading ? "Regenerating..." : "Regenerate"}</Button>
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;
