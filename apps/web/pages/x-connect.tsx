/**
 * X Connect Engagement Page
 * Discover posts with hashtags, preview comments, and queue engagement jobs
 */

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import PageWrapper from "@components/PageWrapper";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { trpc } from "@quillsocial/trpc/react";
import { Button, showToast } from "@quillsocial/ui";
import { ssrInit } from "@server/lib/ssr";
import Shell from "@quillsocial/features/shell/Shell";
import { Loader2, Settings, RefreshCw, ExternalLink, ArrowUp } from "lucide-react";
import SettingsSheet from "@components/x-connect/SettingsSheet";
import ScanStatusCard from "@components/x-connect/ScanStatusCard";
import PostCard from "@components/x-connect/PostCard";
import BulkToolbar from "@components/x-connect/BulkToolbar";
import EngageModal from "@components/x-connect/EngageModal";

export default function XConnectEngagement() {
  const router = useRouter();
  const { data: session } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [engageModalOpen, setEngageModalOpen] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [page, setPage] = useState(1);
  const [onlyNotFollowed, setOnlyNotFollowed] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll to top button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Queries
  const statsQuery = trpc.viewer.xConnect.stats.useQuery();
  const postsQuery = trpc.viewer.xConnect.listDiscovered.useQuery({
    page,
    pageSize: 20,
    onlyNotFollowed,
  });

  // Mutations
  const scanMutation = trpc.viewer.xConnect.startScan.useMutation({
    onSuccess: (data) => {
      showToast(
        `Scan complete! Found ${data.found} posts, inserted ${data.inserted}, skipped ${data.skipped}`,
        "success"
      );
      postsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  const posts = postsQuery.data?.posts || [];
  const stats = statsQuery.data;

  // Selection handlers
  const handleSelectAll = () => {
    setSelectedPostIds(posts.map((p) => p.xPostId));
  };

  const handleSelectNone = () => {
    setSelectedPostIds([]);
  };

  const handleSelectNotFollowed = () => {
    setSelectedPostIds(posts.filter((p) => !p.authorIsFollowed).map((p) => p.xPostId));
  };

  const handleTogglePost = (postId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleStartScan = () => {
    scanMutation.mutate({ force: true });
  };

  const handleOpenEngage = () => {
    if (selectedPostIds.length === 0) {
      showToast("Please select at least one post", "error");
      return;
    }
    setEngageModalOpen(true);
  };

  // Check if user has X credential
  const hasXCredential = true; // TODO: Check from session/query

  if (!hasXCredential) {
    return (
      <Shell heading="Connect Engagement" hideHeadingOnMobile>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-foreground mb-4 text-2xl font-semibold">No X Account Connected</h2>
            <p className="text-muted mb-6">
              Please connect your X (Twitter) account to use Connect Engagement.
            </p>
            <Button href="/apps/installed/xsocial">Connect X Account</Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell heading="Connect Engagement (X)" hideHeadingOnMobile>
      {/* Header */}
      <div className="border-subtle mb-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-foreground text-xl font-bold sm:text-2xl">Connect Engagement (X)</h1>
            <p className="text-muted mt-1 text-sm sm:mt-2 sm:text-base">
              Find #letsconnect posts, drop a friendly reply, then connect on X.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              color="secondary"
              StartIcon={Settings}
              onClick={() => setSettingsOpen(true)}
              disabled={scanMutation.isLoading}
              size="sm"
              className="sm:size-base"
            >
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Settings</span>
            </Button>
            <Button
              color="primary"
              StartIcon={scanMutation.isLoading ? Loader2 : RefreshCw}
              onClick={handleStartScan}
              loading={scanMutation.isLoading}
              size="sm"
              className="sm:size-base"
            >
              {scanMutation.isLoading ? "Scanning..." : "Start Scan"}
            </Button>
          </div>
        </div>

        {/* Scan Status */}
        {stats && <ScanStatusCard stats={stats} onRescan={handleStartScan} />}
      </div>

      {/* Bulk Toolbar */}
      {posts.length > 0 && (
        <BulkToolbar
          selectedCount={selectedPostIds.length}
          totalCount={posts.length}
          onSelectAll={handleSelectAll}
          onSelectNone={handleSelectNone}
          onSelectNotFollowed={handleSelectNotFollowed}
          template={bulkTemplate}
          onTemplateChange={setBulkTemplate}
          topics={stats?.settings.topics || []}
        />
      )}

      {/* Results Grid */}
      <div className={selectedPostIds.length > 0 ? "mb-24 pb-6" : "mb-6"}>
        {postsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted h-8 w-8 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="border-subtle rounded-2xl border bg-card p-12 text-center">
            <p className="text-muted text-lg">
              No posts found. Click "Start Scan" to discover posts with your hashtags.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isSelected={selectedPostIds.includes(post.xPostId)}
                  onToggle={handleTogglePost}
                  template={bulkTemplate}
                  topics={stats?.settings.topics || []}
                />
              ))}
            </div>

            {/* Pagination */}
            {postsQuery.data && postsQuery.data.totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  color="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-muted flex items-center px-4">
                  Page {page} of {postsQuery.data.totalPages}
                </span>
                <Button
                  color="secondary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= postsQuery.data.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky Footer */}
      {selectedPostIds.length > 0 && (
        <div className="border-subtle bg-card/95 fixed bottom-0 left-0 right-0 z-50 border-t p-4 shadow-2xl backdrop-blur-md">
          <div className="container mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <p className="text-foreground text-lg font-semibold">
                {selectedPostIds.length} post{selectedPostIds.length !== 1 ? "s" : ""} selected
              </p>
              <Button color="minimal" size="sm" onClick={handleSelectNone}>
                Clear
              </Button>
            </div>
            <Button color="primary" size="lg" onClick={handleOpenEngage} className="w-full sm:w-auto">
              Generate & Engage ({selectedPostIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Settings Sheet */}
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={stats?.settings}
        onSave={() => {
          statsQuery.refetch();
          showToast("Settings saved", "success");
        }}
      />

      {/* Engage Modal */}
      <EngageModal
        open={engageModalOpen}
        onClose={() => setEngageModalOpen(false)}
        selectedPostIds={selectedPostIds}
        template={bulkTemplate}
        topics={stats?.settings.topics || []}
        dailyMax={stats?.dailyMax || 20}
        todayPosted={stats?.todayPosted || 0}
        onSuccess={() => {
          setSelectedPostIds([]);
          setEngageModalOpen(false);
          showToast("Engagement jobs queued successfully!", "success");
        }}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="bg-primary hover:bg-emphasis fixed bottom-20 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-2xl transition-all hover:scale-110 sm:bottom-6"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </Shell>
  );
}

XConnectEngagement.PageWrapper = PageWrapper;

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { req, res } = context;
  const ssr = await ssrInit(context);
  const session = await getServerSession({ req, res });

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  // TODO: Check if user has X credential
  // For now, we'll let the page handle it

  return {
    props: {
      trpcState: ssr.dehydrate(),
    },
  };
};
