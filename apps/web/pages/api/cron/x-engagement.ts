/**
 * API endpoint to process X engagement jobs
 * Can be called by cron or manually
 * Protected by CRON_API_KEY
 */
import {
  processXEngagementJobs,
  getWorkerStats,
} from "@quillsocial/lib/xEngagement/worker";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const apiKey = req.headers.authorization || req.query.apiKey;

  if (process.env.CRON_API_KEY !== apiKey) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  if (req.method === "POST") {
    try {
      const result = await processXEngagementJobs();
      return res.status(200).json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error("Error processing X engagement jobs:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  if (req.method === "GET") {
    try {
      const stats = await getWorkerStats();
      return res.status(200).json({
        success: true,
        stats,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
