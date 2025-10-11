/**
 * X Engagement Worker
 * Processes queued engagement jobs with rate limiting and retry logic
 * Uses GCP Pub/Sub for job queue
 */

import prisma from "@quillsocial/prisma";
import * as twitterManager from "@quillsocial/app-store/xconsumerkeyssocial/lib/twitterManager";
import { PubSub, Message } from "@google-cloud/pubsub";

interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

/**
 * Process pending X engagement jobs
 * Should be called by a cron job or background worker
 */
export async function processXEngagementJobs(): Promise<ProcessResult> {
  const result: ProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Find jobs ready to be processed
    const now = new Date();
    const jobs = await prisma.xEngagementJob.findMany({
      where: {
        status: "PENDING",
        scheduledAt: {
          lte: now,
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
      take: 50, // Process in batches
    });

    console.log(`Found ${jobs.length} jobs to process`);

    for (const job of jobs) {
      try {
        // Mark as running
        await prisma.xEngagementJob.update({
          where: { id: job.id },
          data: {
            status: "RUNNING",
            startedAt: new Date(),
          },
        });

        // Get user's X credential
        const credential = await prisma.credential.findFirst({
          where: {
            userId: job.userId,
            appId: "xconsumerkeys-social",
            invalid: false,
          },
        });

        if (!credential) {
          throw new Error("No valid X credential found");
        }

        // Re-validate that author is not followed (optional)
        const post = await prisma.xDiscoveredPost.findFirst({
          where: {
            userId: job.userId,
            xPostId: job.xPostId,
          },
        });

        if (post?.authorIsFollowed) {
          console.log(`Skipping job ${job.id} - author is now followed`);
          await prisma.xEngagementJob.update({
            where: { id: job.id },
            data: {
              status: "CANCELLED",
              finishedAt: new Date(),
              error: "Author is now followed",
            },
          });
          result.processed++;
          continue;
        }

        // Post reply
        const replyResult = await twitterManager.replyToTweet(
          credential.id,
          job.xPostId,
          job.plannedComment
        );

        if (replyResult.error) {
          throw new Error(replyResult.error);
        }

        // Mark as success
        await prisma.xEngagementJob.update({
          where: { id: job.id },
          data: {
            status: "SUCCESS",
            finishedAt: new Date(),
          },
        });

        // Update usage counter
        await prisma.xUsageCounter.updateMany({
          where: { userId: job.userId },
          data: {
            postsUsed: {
              increment: 1,
            },
          },
        });

        console.log(
          `Job ${job.id} completed successfully. Tweet ID: ${replyResult.tweetId || "unknown"}`
        );
        result.processed++;
        result.succeeded++;

        // TODO: Send notification to user

        // Rate limiting: wait between posts
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second spacing
      } catch (error: any) {
        console.error(`Error processing job ${job.id}:`, error);

        // Increment attempt
        const nextAttempt = job.attempt + 1;
        const maxAttempts = 5;

        if (nextAttempt >= maxAttempts) {
          // Mark as failed after max attempts
          await prisma.xEngagementJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              finishedAt: new Date(),
              error: error.message,
              attempt: nextAttempt,
            },
          });

          result.failed++;
          result.errors.push(`Job ${job.id}: ${error.message}`);
        } else {
          // Retry with exponential backoff
          const backoffMinutes = Math.pow(2, nextAttempt); // 1m, 2m, 4m, 8m, 16m
          const nextSchedule = new Date(Date.now() + backoffMinutes * 60 * 1000);

          await prisma.xEngagementJob.update({
            where: { id: job.id },
            data: {
              status: "PENDING",
              attempt: nextAttempt,
              scheduledAt: nextSchedule,
              error: error.message,
              startedAt: null,
            },
          });

          console.log(`Job ${job.id} rescheduled for ${nextSchedule.toISOString()}`);
        }

        result.processed++;
      }
    }
  } catch (error: any) {
    console.error("Fatal error in processXEngagementJobs:", error);
    result.errors.push(`Fatal error: ${error.message}`);
  }

  return result;
}

/**
 * Check if we need to throttle based on 3-hour window (300 posts limit)
 */
export async function checkRateLimit(userId: number): Promise<boolean> {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const count = await prisma.xEngagementJob.count({
    where: {
      userId,
      status: "SUCCESS",
      finishedAt: {
        gte: threeHoursAgo,
      },
    },
  });

  return count < 300;
}

/**
 * Get worker stats
 */
export async function getWorkerStats() {
  const [pending, running, failed] = await Promise.all([
    prisma.xEngagementJob.count({ where: { status: "PENDING" } }),
    prisma.xEngagementJob.count({ where: { status: "RUNNING" } }),
    prisma.xEngagementJob.count({ where: { status: "FAILED" } }),
  ]);

  const nextJob = await prisma.xEngagementJob.findFirst({
    where: { status: "PENDING" },
    orderBy: { scheduledAt: "asc" },
  });

  return {
    pending,
    running,
    failed,
    nextJob: nextJob?.scheduledAt,
  };
}
