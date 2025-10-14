/**
 * tRPC router for Threads Connect Engagement feature
 * Handles discovery, filtering, and queuing of engagement jobs for Threads
 */

import { z } from "zod";
import authedProcedure from "../../procedures/authedProcedure";
import { router } from "../../trpc";
import prisma from "@quillsocial/prisma";
import { TRPCError } from "@trpc/server";
import * as threadsManager from "@quillsocial/app-store/threadssocial/lib/threadsManager";
import { Prisma } from "@quillsocial/prisma/client";

// ============================================================================
// Zod Schemas
// ============================================================================

const settingsInputSchema = z.object({
  hashtags: z
    .array(z.string().min(1).max(100))
    .min(1)
    .max(20)
    .refine((tags) => tags.every((t) => !t.includes("#")), {
      message: "Hashtags should not include # symbol",
    }),
  language: z.string().optional(),
  minLikes: z.number().int().min(0).optional(),
  minReplies: z.number().int().min(0).optional(),
  excludeKeywords: z.array(z.string()).max(50).default([]),
  excludeFollowed: z.boolean().default(true),
  dailyMaxComments: z.number().int().min(1).max(100).default(20),
  rateSpacingMs: z.number().int().min(1000).max(60000).default(3000),
  topics: z.array(z.string()).min(1).max(20),
  maxReadsPerScan: z.number().int().min(1).max(50).default(20),
  monthlyReadCap: z.number().int().min(1).default(100),
  monthlyPostCap: z.number().int().min(1).default(500),
});

const scanInputSchema = z.object({
  force: z.boolean().optional(),
});

const listDiscoveredInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  onlyNotFollowed: z.boolean().optional(),
  q: z.string().optional(),
  status: z.enum(["ACTIVE", "QUEUED", "ENGAGED", "SKIPPED", "ALL"]).optional().default("ACTIVE"),
});

const generatePreviewInputSchema = z.object({
  threadsPostId: z.string(),
  template: z.string().max(280).optional(),
  topics: z.array(z.string()).optional(),
});

const bulkGeneratePreviewInputSchema = z.object({
  threadsPostIds: z.array(z.string()).min(1).max(50),
  template: z.string().max(280),
  topics: z.array(z.string()).optional(),
});

const queueEngagementInputSchema = z.object({
  threadsPostIds: z.array(z.string()).min(1).max(50),
  template: z.string().min(1, "Template cannot be empty").max(500, "Template must be 500 characters or less"),
  topics: z.array(z.string()).optional(),
});

const listJobsInputSchema = z.object({
  statuses: z.array(z.enum(["PENDING", "RUNNING", "SUCCESS", "FAILED", "CANCELLED"])).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const markPostsInputSchema = z.object({
  threadsPostIds: z.array(z.string()).min(1).max(50),
  status: z.enum(["QUEUED", "ENGAGED", "SKIPPED"]),
});

const commentOnPostInputSchema = z.object({
  threadsPostId: z.string().min(1, "Post ID is required"),
  comment: z.string().min(1, "Comment cannot be empty").max(500, "Comment must be 500 characters or less"),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get or create settings for a user
 */
async function getOrCreateSettings(userId: number) {
  let settings = await prisma.threadsConnectSetting.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.threadsConnectSetting.create({
      data: { userId },
    });
  }

  return settings;
}

/**
 * Get or create usage counter for a user
 */
async function getOrCreateUsageCounter(userId: number) {
  let counter = await prisma.threadsUsageCounter.findUnique({
    where: { userId },
  });

  if (!counter) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    counter = await prisma.threadsUsageCounter.create({
      data: {
        userId,
        resetAt: nextMonth,
      },
    });
  }

  // Check if counter needs reset
  if (counter.resetAt < new Date()) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    counter = await prisma.threadsUsageCounter.update({
      where: { userId },
      data: {
        readsUsed: 0,
        postsUsed: 0,
        resetAt: nextMonth,
      },
    });
  }

  return counter;
}

/**
 * Get Threads credential
 */
async function getThreadsCredential(userId: number) {
  const credential = await prisma.credential.findFirst({
    where: {
      userId,
      appId: "threads-social",
      invalid: false,
    },
  });

  if (!credential) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No Threads credential found",
    });
  }

  return credential;
}

/**
 * Render template with variables
 */
function renderTemplate(template: string, authorHandle: string, topics: string[]): string {
  let rendered = template;
  rendered = rendered.replace(/{author}/g, `@${authorHandle}`);
  if (topics.length > 0) {
    rendered = rendered.replace(/{topics}/g, topics.join(", "));
  }
  return rendered;
}

/**
 * Count posts made in last 3 hours
 */
async function countPostsInLast3Hours(userId: number): Promise<number> {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const count = await prisma.threadsEngagementJob.count({
    where: {
      userId,
      status: "SUCCESS",
      finishedAt: {
        gte: threeHoursAgo,
      },
    },
  });

  return count;
}

/**
 * Count posts made today
 */
async function countPostsToday(userId: number): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.threadsEngagementJob.count({
    where: {
      userId,
      status: "SUCCESS",
      finishedAt: {
        gte: startOfDay,
      },
    },
  });

  return count;
}

// ============================================================================
// Router
// ============================================================================

export const threadsConnectRouter = router({
  /**
   * Start a scan for new posts with hashtags
   * Note: This is a placeholder - actual implementation would need Threads API for search
   */
  startScan: authedProcedure.input(scanInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const settings = await getOrCreateSettings(userId);
    const counter = await getOrCreateUsageCounter(userId);

    // Check read budget
    const readsRemaining = settings.monthlyReadCap - counter.readsUsed;
    if (readsRemaining <= 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Read budget exhausted. Resets on ${counter.resetAt.toLocaleDateString()}`,
      });
    }

    // Get Threads credential
    const credential = await getThreadsCredential(userId);

    // TODO: Implement actual Threads API search for hashtags
    // For now, return placeholder response
    return {
      found: 0,
      inserted: 0,
      skipped: 0,
      readsConsumed: 0,
      readsRemaining: readsRemaining,
    };
  }),

  /**
   * List discovered posts
   */
  listDiscovered: authedProcedure.input(listDiscoveredInputSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { page, pageSize, onlyNotFollowed, q, status } = input;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ThreadsDiscoveredPostWhereInput = {
      userId,
      ...(status && status !== "ALL" ? { status: status as "ACTIVE" | "QUEUED" | "ENGAGED" | "SKIPPED" } : {}),
      ...(onlyNotFollowed ? { authorIsFollowed: false } : {}),
      ...(q
        ? {
            OR: [
              { text: { contains: q, mode: "insensitive" } },
              { authorHandle: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.threadsDiscoveredPost.findMany({
        where,
        orderBy: { discoveredAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.threadsDiscoveredPost.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }),

  /**
   * Save settings
   */
  saveSettings: authedProcedure.input(settingsInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    const settings = await prisma.threadsConnectSetting.upsert({
      where: { userId },
      create: {
        userId,
        ...input,
      },
      update: input,
    });

    return settings;
  }),

  /**
   * Generate preview for a single post
   */
  generatePreviewForPost: authedProcedure
    .input(generatePreviewInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { threadsPostId, template: customTemplate, topics: customTopics } = input;

      const post = await prisma.threadsDiscoveredPost.findUnique({
        where: {
          userId_threadsPostId: {
            userId,
            threadsPostId,
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const settings = await getOrCreateSettings(userId);
      const template =
        customTemplate ||
        `Let's #connect if you're into:\n🎨 Frontend • 💼 Backend • 👩‍💻 GenAI • ✨ Full-stack • 🧑‍💻 DevOps • ✅ DSA • 💻 LeetCode • 🧠 AI/ML • 🧱 Web3 • 📊 Data Science • 💸 Freelancing • 🐍 Python • 🔨 Startups\n\nHey {author}, loved your post! I'm building in public and would love to connect with folks into {topics}. #buildinpublic #letsconnect`;

      const topics = customTopics || settings.topics;
      const preview = renderTemplate(template, post.authorHandle, topics);

      return { preview };
    }),

  /**
   * Bulk generate preview (returns count)
   */
  bulkGeneratePreview: authedProcedure
    .input(bulkGeneratePreviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { threadsPostIds } = input;

      const posts = await prisma.threadsDiscoveredPost.findMany({
        where: {
          userId,
          threadsPostId: { in: threadsPostIds },
        },
      });

      return { count: posts.length };
    }),

  /**
   * Queue engagement jobs
   */
  queueEngagement: authedProcedure
    .input(queueEngagementInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { threadsPostIds, template, topics: customTopics } = input;

      const settings = await getOrCreateSettings(userId);
      const counter = await getOrCreateUsageCounter(userId);
      const topics = customTopics || settings.topics;

      // Fetch posts
      const posts = await prisma.threadsDiscoveredPost.findMany({
        where: {
          userId,
          threadsPostId: { in: threadsPostIds },
        },
      });

      if (posts.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid posts found",
        });
      }

      // Check limits
      const todayPosted = await countPostsToday(userId);
      const last3HoursPosted = await countPostsInLast3Hours(userId);
      const postsRemainingMonthly = settings.monthlyPostCap - counter.postsUsed;
      const postsRemaining3Hour = 300 - last3HoursPosted;
      const postsRemainingDaily = settings.dailyMaxComments - todayPosted;

      const allowed = Math.min(
        postsRemainingMonthly,
        postsRemaining3Hour,
        postsRemainingDaily,
        posts.length
      );

      if (allowed <= 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Daily or rate limit reached",
        });
      }

      // Create jobs
      const now = new Date();
      let queued = 0;

      for (let i = 0; i < allowed; i++) {
        const post = posts[i];
        const plannedComment = renderTemplate(template, post.authorHandle, topics);

        // Safety check: ensure comment is not empty
        if (!plannedComment || plannedComment.trim() === '') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Generated comment is empty. Please provide a valid template.",
          });
        }

        const scheduledAt = new Date(now.getTime() + i * settings.rateSpacingMs);

        await prisma.threadsEngagementJob.create({
          data: {
            userId,
            threadsPostId: post.threadsPostId,
            authorHandle: post.authorHandle,
            plannedComment,
            scheduledAt,
          },
        });

        queued++;
      }

      return {
        queued,
        capped: posts.length - allowed,
        postsRemainingInWindow: Math.min(postsRemaining3Hour, postsRemainingMonthly),
      };
    }),

  /**
   * List engagement jobs
   */
  listJobs: authedProcedure.input(listJobsInputSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { statuses, page, pageSize } = input;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ThreadsEngagementJobWhereInput = {
      userId,
      ...(statuses ? { status: { in: statuses } } : {}),
    };

    const [jobs, total] = await Promise.all([
      prisma.threadsEngagementJob.findMany({
        where,
        orderBy: { scheduledAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.threadsEngagementJob.count({ where }),
    ]);

    return {
      jobs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }),

  /**
   * Get stats
   */
  stats: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const settings = await getOrCreateSettings(userId);
    const counter = await getOrCreateUsageCounter(userId);

    const todayPosted = await countPostsToday(userId);

    const lastScan = await prisma.threadsDiscoveredPost.findFirst({
      where: { userId },
      orderBy: { discoveredAt: "desc" },
      select: { discoveredAt: true },
    });

    // Get counts for each status
    const [activeCount, queuedCount, engagedCount, skippedCount, totalCount] = await Promise.all([
      prisma.threadsDiscoveredPost.count({ where: { userId, status: "ACTIVE" } }),
      prisma.threadsDiscoveredPost.count({ where: { userId, status: "QUEUED" } }),
      prisma.threadsDiscoveredPost.count({ where: { userId, status: "ENGAGED" } }),
      prisma.threadsDiscoveredPost.count({ where: { userId, status: "SKIPPED" } }),
      prisma.threadsDiscoveredPost.count({ where: { userId } }),
    ]);

    return {
      todayPosted,
      dailyMax: settings.dailyMaxComments,
      lastScanAt: lastScan?.discoveredAt,
      lastScan: lastScan?.discoveredAt, // For backward compatibility
      monthlyReadsUsed: counter.readsUsed,
      monthlyPostsUsed: counter.postsUsed,
      monthlyReadCap: settings.monthlyReadCap,
      monthlyPostCap: settings.monthlyPostCap,
      readsRemaining: settings.monthlyReadCap - counter.readsUsed,
      postsRemaining: settings.monthlyPostCap - counter.postsUsed,
      resetAt: counter.resetAt,
      settings,
      statusCounts: {
        active: activeCount,
        queued: queuedCount,
        engaged: engagedCount,
        skipped: skippedCount,
        total: totalCount,
      },
    };
  }),

  /**
   * Mark posts as engaged or skipped
   */
  markPosts: authedProcedure.input(markPostsInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { threadsPostIds, status } = input;

    const updated = await prisma.threadsDiscoveredPost.updateMany({
      where: {
        userId,
        threadsPostId: { in: threadsPostIds },
      },
      data: {
        status,
      },
    });

    return {
      updated: updated.count,
    };
  }),

  /**
   * Check if user has Threads credential
   */
  hasThreadsCredential: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const credential = await prisma.credential.findFirst({
      where: {
        userId,
        appId: "threads-social",
        invalid: false,
      },
    });

    return {
      hasCredential: !!credential,
    };
  }),

  /**
   * Comment on a post directly (without queuing)
   * Posts comment via API immediately, then marks post as ENGAGED on success or SKIPPED on error
   */
  commentOnPost: authedProcedure.input(commentOnPostInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { threadsPostId, comment } = input;

    // Get the post
    const post = await prisma.threadsDiscoveredPost.findFirst({
      where: {
        userId,
        threadsPostId,
      },
    });

    if (!post) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post not found",
      });
    }

    // Get Threads credential
    const credential = await getThreadsCredential(userId);
    if (!credential) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No Threads credential found. Please connect your Threads account.",
      });
    }

    // Check rate limits
    const settings = await getOrCreateSettings(userId);
    const todayPosted = await countPostsToday(userId);
    const last3HoursPosted = await countPostsInLast3Hours(userId);

    if (todayPosted >= settings.dailyMaxComments) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Daily comment limit reached",
      });
    }

    if (last3HoursPosted >= 300) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Rate limit reached (300 posts per 3 hours)",
      });
    }

    // Post the comment
    try {
      // TODO: Implement actual Threads API comment posting
      // const result = await threadsManager.replyToPost(credential.id, threadsPostId, comment);

      // For now, mark as engaged (placeholder until API is implemented)
      await prisma.threadsDiscoveredPost.update({
        where: { id: post.id },
        data: { status: "ENGAGED" },
      });

      // Update usage counter
      const counter = await getOrCreateUsageCounter(userId);
      await prisma.threadsUsageCounter.update({
        where: { userId },
        data: {
          postsUsed: counter.postsUsed + 1,
        },
      });

      return {
        success: true,
        message: "Comment posted successfully!",
      };
    } catch (error: any) {
      // Mark as skipped on any error
      await prisma.threadsDiscoveredPost.update({
        where: { id: post.id },
        data: { status: "SKIPPED" },
      });

      // Re-throw TRPCError as is
      if (error instanceof TRPCError) {
        throw error;
      }

      // Wrap other errors
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to post comment",
      });
    }
  }),
});
