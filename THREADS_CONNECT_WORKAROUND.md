# Threads Connect - Possible Workaround Implementation

## Overview

While the Threads API doesn't support the core X Connect feature (replying to discovered posts), this document outlines a **limited workaround** using **Quote Posts** instead of replies.

⚠️ **Important**: This is NOT equivalent to X Connect and has significant limitations.

## What This Would Enable

### Instead of Direct Replies
```
Original Flow (X Connect):
User discovers post → Generate comment → Reply directly to post
                                         ↓
                              Creates conversational thread

Workaround Flow (Threads):
User discovers post → Generate comment → Create quote post
                                         ↓
                              Creates separate post quoting original
```

## Threads Quote Post API

The Threads API DOES support creating quote posts:

```typescript
// POST /v1.0/me/threads
{
  "media_type": "TEXT",
  "text": "Your commentary on the quoted post",
  "quote_post_id": "discovered_thread_id",
  "access_token": "..."
}
```

## Limited Implementation Plan

### Phase 1: Manual Discovery (Week 1)

Since there's no search API, users would:
1. Manually discover interesting threads
2. Copy thread URLs/IDs into the app
3. App generates engaging quote text
4. App creates quote posts

**Files to Create:**
```typescript
// packages/trpc/server/routers/viewer/threadsConnect.ts
export const threadsConnectRouter = router({
  // Manual thread input
  addThreadForEngagement: protectedProcedure
    .input(z.object({
      threadUrl: z.string().url(),
      authorHandle: z.string(),
      context: z.string(), // What the thread is about
    }))
    .mutation(async ({ ctx, input }) => {
      // Extract thread ID from URL
      // Store for processing
    }),
  
  // Generate quote comment
  generateQuoteComment: protectedProcedure
    .input(z.object({
      threadId: z.string(),
      topics: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use ChatGPT to generate engaging quote
    }),
  
  // Queue quote post
  queueQuotePost: protectedProcedure
    .input(z.object({
      threadId: z.string(),
      comment: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Queue job to create quote post
    }),
});
```

### Phase 2: Quote Post Worker (Week 1-2)

Reuse X engagement worker infrastructure:

```typescript
// packages/lib/threadsEngagement/worker.ts
export async function processThreadsEngagementJobs() {
  const jobs = await prisma.threadsEngagementJob.findMany({
    where: { status: "PENDING" },
  });
  
  for (const job of jobs) {
    try {
      // Get user's Threads credential
      const credential = await prisma.credential.findFirst({
        where: {
          userId: job.userId,
          appId: "threads-social",
        },
      });
      
      // Create quote post using ThreadsManager
      const result = await ThreadsManager.createQuotePost(
        credential.id,
        job.threadId,
        job.plannedComment
      );
      
      // Mark job as complete
      await prisma.threadsEngagementJob.update({
        where: { id: job.id },
        data: { status: "SUCCESS" },
      });
    } catch (error) {
      // Handle retry logic
    }
  }
}
```

### Phase 3: Extend ThreadsManager (Week 2)

Add quote post creation:

```typescript
// packages/app-store/threadssocial/lib/threadsManager.ts

/**
 * Create a quote post (workaround for reply functionality)
 */
export async function createQuotePost(
  credentialId: number,
  quotedThreadId: string,
  commentText: string
): Promise<{ success: boolean; threadId?: string; error?: string }> {
  try {
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });
    
    if (!credential) {
      return {
        success: false,
        error: "Credential not found",
      };
    }
    
    // Parse credential for access token
    const accessToken = getAccessToken(credential);
    const userId = getUserId(credential) || "me";
    
    // Step 1: Create quote post container
    const createResp = await postForm(
      `${GRAPH}/${userId}/threads`,
      {
        media_type: "TEXT",
        text: commentText,
        quote_post_id: quotedThreadId,
        access_token: accessToken,
      }
    );
    
    const creationId = createResp.data.id;
    
    // Step 2: Publish the quote post
    const publishResp = await postForm(
      `${GRAPH}/${userId}/threads_publish`,
      {
        creation_id: creationId,
        access_token: accessToken,
      }
    );
    
    return {
      success: true,
      threadId: publishResp.data.id,
    };
  } catch (error: any) {
    console.error("Error creating quote post:", error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

function getAccessToken(credential: any): string {
  // Parse credential.key to extract access_token
  let key = credential.key;
  if (typeof key === 'string') {
    key = JSON.parse(key);
  }
  return key.access_token;
}

function getUserId(credential: any): string | null {
  let key = credential.key;
  if (typeof key === 'string') {
    key = JSON.parse(key);
  }
  return key.user_id || null;
}
```

### Phase 4: Basic UI (Week 3)

Simple page for manual thread input:

```typescript
// apps/web/pages/threads-connect.tsx
export default function ThreadsConnect() {
  const [threadUrl, setThreadUrl] = useState("");
  const [comment, setComment] = useState("");
  
  const addThreadMutation = trpc.viewer.threadsConnect.addThreadForEngagement.useMutation();
  const generateMutation = trpc.viewer.threadsConnect.generateQuoteComment.useMutation();
  const queueMutation = trpc.viewer.threadsConnect.queueQuotePost.useMutation();
  
  return (
    <Shell heading="Threads Connect (Quote Posts)">
      <Alert variant="warning">
        ⚠️ Limited functionality: Creates quote posts, not direct replies.
        Threads API doesn't support replying to discovered posts.
      </Alert>
      
      <div>
        <Label>Thread URL</Label>
        <Input
          value={threadUrl}
          onChange={(e) => setThreadUrl(e.target.value)}
          placeholder="https://threads.net/@user/post/..."
        />
      </div>
      
      <div>
        <Label>Generated Quote Comment</Label>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
        <Button onClick={() => generateMutation.mutate({ threadUrl })}>
          Generate Comment
        </Button>
      </div>
      
      <Button
        onClick={() => queueMutation.mutate({ threadUrl, comment })}
        disabled={!comment || !threadUrl}
      >
        Queue Quote Post
      </Button>
    </Shell>
  );
}
```

## Database Schema (Minimal)

```prisma
model ThreadsEngagementJob {
  id             String   @id @default(cuid())
  userId         Int
  threadId       String
  authorHandle   String?
  plannedComment String   @db.Text
  status         ThreadsEngagementStatus @default(PENDING)
  scheduledAt    DateTime
  finishedAt     DateTime?
  error          String?  @db.Text
  
  @@index([userId, status])
}

enum ThreadsEngagementStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  CANCELLED
}
```

## Comparison: Full vs Workaround

| Feature | X Connect (Full) | Threads Workaround | Notes |
|---------|------------------|-------------------|-------|
| Discovery | Automated hashtag search | ❌ Manual input | Major limitation |
| Engagement | Direct replies | Quote posts | Not conversational |
| Following check | Automated | ❌ Manual | Can't filter |
| Rate limiting | Automated tracking | ✅ Can implement | Reuse worker |
| Job queue | ✅ | ✅ | Same infrastructure |
| User experience | Excellent | Poor | Manual work required |

## Effort Estimate

| Phase | Effort | Deliverable |
|-------|--------|-------------|
| 1. Manual input UI | 2 days | Basic form for thread URLs |
| 2. Quote worker | 3 days | Job processing for quotes |
| 3. ThreadsManager extension | 2 days | createQuotePost() method |
| 4. Testing | 2 days | E2E testing |
| **Total** | **9 days** | **Limited workaround** |

## Limitations Summary

### ❌ What's Missing

1. **No Discovery** - Users must manually find threads
2. **Not Conversational** - Quote posts are separate, not replies
3. **No Following Filter** - Can't auto-filter followed accounts
4. **Manual Process** - Defeats automation purpose
5. **Confusing UX** - Users expect X Connect experience

### ✅ What Works

1. **Quote Post Creation** - Technical capability exists
2. **Job Queue** - Infrastructure reusable
3. **Rate Limiting** - Can track Threads API limits
4. **Comment Generation** - ChatGPT works same way

## Recommendation

### ⚠️ Consider the Trade-offs

**Implement If:**
- You want *something* for Threads engagement
- Users understand it's NOT like X Connect
- Manual discovery is acceptable
- Quote posts (not replies) are okay

**DON'T Implement If:**
- Users expect X Connect experience
- Manual work is unacceptable
- Conversational replies are essential
- You want automated discovery

### 🎯 Suggested Path

**Option A: Minimal Viable** (1-2 weeks)
- Manual thread input
- Quote post creation
- Basic job queue
- Clear UX warnings about limitations

**Option B: Wait for API** (RECOMMENDED)
- Monitor Threads API updates
- Implement quickly when reply API added
- Avoid confusing half-solution
- Focus on X Connect enhancements

## Decision Questions

Before implementing, answer:

1. ✅ Do users understand quote posts ≠ replies?
2. ✅ Is manual thread discovery acceptable?
3. ✅ Is 9 days of development worth limited functionality?
4. ✅ Will this confuse users expecting X Connect?
5. ✅ Can we clearly communicate limitations in UI?

If **all answers are YES**, proceed with workaround.  
If **any answer is NO**, wait for proper API support.

---

**Recommendation**: ⏸️ **WAIT FOR API**

The workaround requires significant effort for a poor user experience that doesn't match the core value proposition of X Connect.

---

**Last Updated**: October 13, 2025  
**Status**: Proposal for limited workaround  
**Decision**: Pending stakeholder review
