import PageWrapper from "@components/PageWrapper";
import Shell from "@quillsocial/features/shell/Shell";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { Button, HeadSeo, Badge } from "@quillsocial/ui";
import { Plus, Star, Trash2, ChevronDown } from "@quillsocial/ui/components/icon";
import React, { useState } from "react";

interface Idea {
  id: string;
  title: string;
  pillar: string;
  status: "Raw" | "Outlined";
  tags: string[];
}

function IdeasPillarsPage() {
  const { t } = useLocale();

  const [selectedPillar, setSelectedPillar] = useState<string>("Build in Public");
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([
    {
      id: "1",
      title: "Shipped MVP in 14 days — trade-offs and scope cuts",
      pillar: "Build in Public",
      status: "Raw",
      tags: ["#shipping", "#scope"],
    },
    {
      id: "2",
      title: "Raising prices without losing clients — laddering value",
      pillar: "Founder Lessons",
      status: "Outlined",
      tags: ["#pricing", "#value"],
    },
    {
      id: "3",
      title: "Client reduced churn 18% by fixing handoff emails",
      pillar: "Client Wins",
      status: "Raw",
      tags: [],
    },
  ]);

  const pillars = [
    { name: "Build in Public", color: "bg-indigo-600 hover:bg-indigo-700" },
    { name: "Founder Lessons", color: "bg-cyan-500 hover:bg-cyan-600" },
    { name: "Client Wins", color: "bg-green-600 hover:bg-green-700" },
    { name: "Playbooks", color: "bg-orange-500 hover:bg-orange-600" },
  ];

  const filteredIdeas = ideas.filter((idea) => idea.pillar === selectedPillar);

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
  };

  const handleExpandToOutline = () => {
    if (selectedIdea) {
      console.log("Expand to Outline:", selectedIdea.id);
      // TODO: Implement expand to outline functionality
    }
  };

  const handlePromoteToPost = () => {
    if (selectedIdea) {
      console.log("Promote to Post:", selectedIdea.id);
      // TODO: Implement promote to post functionality
    }
  };

  return (
    <>
      <HeadSeo title={t("Ideas & Pillars")} description={t("Organize your content ideas")} />

      <Shell withoutSeo heading={t("Ideas & Pillars")} subtitle="Drop a note, link, or reply. We'll shape it.">
        <div className="mt-5">
          {/* Header with Add Idea button */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ideas & Pillars</h2>
              <p className="mt-1 text-sm text-gray-600">Drop a note, link, or reply. We'll shape it.</p>
            </div>
            <Button
              color="primary"
              StartIcon={Plus}
              className="rounded-lg px-4 py-2 text-white shadow-lg"
            >
              Add Idea
            </Button>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left column - Ideas List */}
            <div className="col-span-12 lg:col-span-8">
              {/* Pillar Tabs */}
              <div className="mb-6 flex flex-wrap gap-2">
                {pillars.map((pillar) => (
                  <button
                    key={pillar.name}
                    onClick={() => setSelectedPillar(pillar.name)}
                    className={`${
                      selectedPillar === pillar.name
                        ? pillar.color
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } rounded-full px-4 py-2 text-sm font-medium text-white transition-colors`}
                  >
                    {pillar.name}
                  </button>
                ))}
                <button className="flex items-center gap-1 rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
                  <Plus className="h-4 w-4" />
                  Add Pillar
                </button>
              </div>

              {/* Ideas Cards */}
              <div className="space-y-4">
                {filteredIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    onClick={() => handleSelectIdea(idea)}
                    className={`cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                      selectedIdea?.id === idea.id ? "ring-2 ring-indigo-600" : "border-gray-200"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={idea.pillar === "Build in Public" ? "blue" : idea.pillar === "Founder Lessons" ? "default" : "success"}
                          size="sm"
                        >
                          {idea.pillar}
                        </Badge>
                        <Badge variant="gray" size="sm">
                          {idea.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <Star className="h-4 w-4" />
                        </button>
                        <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-base font-medium text-gray-900">{idea.title}</h3>
                    {idea.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {idea.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {filteredIdeas.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <p className="text-gray-500">No ideas in this pillar yet.</p>
                    <Button color="primary" StartIcon={Plus} className="mt-4">
                      Add First Idea
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Selected Idea Details */}
            <div className="col-span-12 lg:col-span-4">
              {selectedIdea ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Selected Idea</h3>

                  <div className="mb-6">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">Content</h4>
                    <p className="text-sm text-gray-900">{selectedIdea.title}</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">Status</h4>
                    <Badge variant="gray">{selectedIdea.status}</Badge>
                  </div>

                  {selectedIdea.tags.length > 0 && (
                    <div className="mb-6">
                      <h4 className="mb-2 text-sm font-medium text-gray-700">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedIdea.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      color="primary"
                      StartIcon={Star}
                      onClick={handleExpandToOutline}
                      className="w-full justify-center"
                    >
                      Expand to Outline
                    </Button>
                    <Button
                      color="secondary"
                      onClick={handlePromoteToPost}
                      className="w-full justify-center"
                    >
                      Promote to Post
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                  <p className="text-sm text-gray-500">Select an idea to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
}

IdeasPillarsPage.PageWrapper = PageWrapper;
export default IdeasPillarsPage;
