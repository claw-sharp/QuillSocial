import { z } from "zod";
import type { Tool, AgentContext } from "./types";
import { withUsageLogging } from "./openai";

/**
 * Input schema for expandOutlineTool
 */
const ExpandOutlineInputSchema = z.object({
  idea: z.string().min(1, "Idea cannot be empty"),
  tone: z.enum(["friendly", "authoritative", "contrarian"]).default("friendly"),
});

type ExpandOutlineInput = z.infer<typeof ExpandOutlineInputSchema>;

/**
 * Output type for expandOutlineTool
 */
type ExpandOutlineOutput = {
  outline: string;
  tone: string;
};

/**
 * Tool that expands a brief idea into a detailed outline.
 */
export const expandOutlineTool: Tool<ExpandOutlineInput, ExpandOutlineOutput> = {
  name: "expandOutline",
  description: "Expands a brief content idea into a detailed outline with the specified tone (friendly, authoritative, or contrarian).",
  schema: ExpandOutlineInputSchema,
  run: async (args, ctx: AgentContext): Promise<ExpandOutlineOutput> => {
    const { idea, tone } = args;

    ctx.logger?.info("Expanding outline", { idea, tone });

    const systemPrompt = `You are a content strategist helping to expand ideas into detailed outlines.
Create a structured outline that:
- Has 3-5 main sections
- Each section has 2-4 key points
- Uses a ${tone} tone throughout
- Is suitable for social media content or blog posts
- Focuses on actionable insights and clear takeaways`;

    const userPrompt = `Expand this idea into a detailed outline:

"${idea}"

Tone: ${tone}

Provide a clear, numbered outline with sections and subsections.`;

    const callOpenAI = withUsageLogging(ctx, {
      userId: -1, // System call, will be overridden by actual usage
      requestType: "expand_outline",
      model: "gpt-4o-mini",
    });

    const response = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], {
      temperature: 0.7,
    });

    ctx.logger?.info("Outline expanded successfully");

    return {
      outline: response.text,
      tone,
    };
  },
};

/**
 * Input schema for generatePostsTool
 */
const GeneratePostsInputSchema = z.object({
  outline: z.string().min(1, "Outline cannot be empty"),
  channels: z.array(z.enum(["linkedin", "x", "carousel", "shorts", "blog"])).min(1, "At least one channel required"),
  cta: z.string().optional(),
});

type GeneratePostsInput = z.infer<typeof GeneratePostsInputSchema>;

/**
 * Output type for generatePostsTool
 */
type GeneratePostsOutput = {
  drafts: string;
};

/**
 * Tool that generates platform-specific posts from an outline.
 */
export const generatePostsTool: Tool<GeneratePostsInput, GeneratePostsOutput> = {
  name: "generatePosts",
  description: "Generates platform-specific post drafts from an outline for specified channels (linkedin, x, carousel, shorts, blog). Optionally includes a call-to-action.",
  schema: GeneratePostsInputSchema,
  run: async (args, ctx: AgentContext): Promise<GeneratePostsOutput> => {
    const { outline, channels, cta } = args;

    ctx.logger?.info("Generating posts", { channels, hasCTA: !!cta });

    const channelGuidelines: Record<string, string> = {
      linkedin: "LinkedIn: Professional tone, 1300-2000 characters, use line breaks for readability, include relevant hashtags (3-5), engage with questions or insights.",
      x: "X/Twitter: Concise and punchy, 280 characters max, use relevant hashtags (1-3), thread format if needed (number each tweet).",
      carousel: "Carousel: 5-10 slides, each slide with a clear headline and 2-3 bullet points, visual-first approach, end with a summary slide.",
      shorts: "Shorts/Reels: Script format with hook, main points (3-5 quick tips), and strong CTA. 30-60 seconds when spoken. Include visual cues.",
      blog: "Blog: Long-form content, 800-1500 words, clear introduction, 3-5 main sections with subheadings, conclusion with key takeaways. SEO-friendly.",
    };

    const selectedGuidelines = channels
      .map((ch) => channelGuidelines[ch])
      .join("\n");

    const systemPrompt = `You are a content creator specializing in multi-platform content adaptation.
Generate platform-specific posts based on the outline provided, following these guidelines:

${selectedGuidelines}

Each post should:
- Be optimized for its specific platform
- Maintain the core message from the outline
- Be engaging and actionable
- Follow best practices for that platform`;

    const ctaSection = cta ? `\n\nCall-to-action to include: "${cta}"` : "";

    const userPrompt = `Create posts for the following platforms: ${channels.join(", ")}

Outline:
${outline}${ctaSection}

Generate a draft for each platform, clearly labeled with the platform name.`;

    const callOpenAI = withUsageLogging(ctx, {
      userId: -1, // System call, will be overridden by actual usage
      requestType: "generate_posts",
      model: "gpt-4o-mini",
    });

    const response = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], {
      temperature: 0.8, // Higher temperature for more creative variations
    });

    ctx.logger?.info("Posts generated successfully", {
      channels,
      draftLength: response.text.length
    });

    return {
      drafts: response.text,
    };
  },
};
