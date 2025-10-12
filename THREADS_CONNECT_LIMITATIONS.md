# Threads Connect Engagement - API Limitations

## Executive Summary

**The Threads API currently does NOT support creating replies to other users' posts**, which is the core functionality of the X Connect Engagement feature. This document outlines the current API limitations and potential future implementation options.

## Current Threads API Capabilities

### ✅ What IS Supported
1. **Creating Posts** - Publish your own text, image, video, or carousel posts
2. **Reply Management** - Hide/unhide replies TO your own posts
3. **Retrieve Replies** - Get replies TO your own posts
4. **Control Reply Permissions** - Set who can reply to your posts (`everyone`, `accounts_you_follow`, `mentioned_only`, etc.)
5. **Quote Posts** - Quote/repost other users' content
6. **Reposts** - Share other users' posts

### ❌ What is NOT Supported
1. **Creating Replies to Other Users' Posts** - No API endpoint exists for replying to discovered posts
2. **Search by Hashtag** - No public search API (unlike X/Twitter API v2)
3. **Following/Follower Management** - Cannot programmatically check if you follow someone
4. **Bulk Discovery** - No discovery or feed APIs for exploring content

## X Connect vs Threads Connect Feature Comparison

| Feature | X Connect | Threads (Current) | Threads (Potential) |
|---------|-----------|-------------------|---------------------|
| Search by hashtags | ✅ Yes | ❌ No API | 🔮 Future maybe |
| Discover posts | ✅ Yes | ❌ No API | 🔮 Future maybe |
| Reply to discovered posts | ✅ Yes | ❌ **NOT POSSIBLE** | 🔮 If API adds support |
| Check following status | ✅ Yes | ❌ No API | 🔮 Future maybe |
| Rate limiting | ✅ Managed | N/A | 🔮 Would need similar |
| Job queue system | ✅ Implemented | N/A | 🔮 Could reuse |

## Why This Matters

The **X Connect Engagement** feature works because the X API v2 provides:

```typescript
// X API - THIS EXISTS
await client.v2.reply(tweetId, replyText);

// Threads API - THIS DOES NOT EXIST
await threadsClient.replyTo(threadId, replyText); // ❌ Not available
```

## Official Threads API Documentation

### Creating Posts
- **Endpoint**: `POST /me/threads` → Only creates NEW posts, not replies
- **Reply Parameter**: `reply_to` parameter exists for creating reply THREADS (continuing your own conversation), NOT for replying to others

### Reply Management
- **Endpoint**: `POST /{reply_id}/manage_reply` → Only hides/unhides replies TO your posts
- **Purpose**: Content moderation, not engagement

### What's Missing
```bash
# This endpoint DOES NOT EXIST in Threads API
POST /{thread_id}/replies  # ❌ Not available

# Compare to X API which HAS this
POST /2/tweets {
  "reply": {
    "in_reply_to_tweet_id": "123456"
  },
  "text": "Your reply"
}  # ✅ Available
```

## Architectural Readiness

The good news: **Our codebase architecture is READY** for Threads Connect if/when the API adds support:

### Already Built Infrastructure
1. **Provider Pattern** (`packages/lib/providers/social/`)
   - `SocialSearchProvider` interface ready for Threads
   - `XProvider.ts` as reference implementation
   
2. **Worker System** (`packages/lib/xEngagement/worker.ts`)
   - Generic job processing with retry logic
   - Rate limiting framework
   - Pub/Sub integration
   
3. **Database Schema** (could be reused/adapted)
   - `ThreadsEngagementJob` (similar to `XEngagementJob`)
   - `ThreadsUsageCounter` (similar to `XUsageCounter`)
   - `ThreadsDiscoveredPost` (similar to `XDiscoveredPost`)

4. **UI Components** (`apps/web/components/x-connect/`)
   - Modular design allows Threads variant
   - Settings, scanning, bulk actions all reusable

## What Would Need to Be Done (IF API Support Added)

### 1. Create Threads Provider
```typescript
// packages/lib/providers/social/ThreadsProvider.ts
export class ThreadsProvider implements SocialSearchProvider {
  // Would need Threads API to add:
  // - Search/discovery endpoints
  // - Reply creation endpoint
  // - Following check endpoint
  
  async searchHashtag(params: SearchHashtagParams) {
    // Threads API: Would need discovery API
  }
  
  async isFollowing(authorId: string) {
    // Threads API: Would need following check
  }
  
  async replyTo(postId: string, text: string) {
    // Threads API: Would need reply creation endpoint ❌
  }
}
```

### 2. Extend Threads Manager
```typescript
// packages/app-store/threadssocial/lib/threadsManager.ts

/**
 * Reply to a thread (PLACEHOLDER - API doesn't support this)
 */
export async function replyToThread(
  credentialId: number,
  threadId: string,
  text: string
): Promise<{ success: boolean; threadId?: string; error?: string }> {
  // This would require Threads API to add:
  // POST /{thread_id}/replies or similar endpoint
  
  return {
    success: false,
    error: "Threads API does not support replying to other users' posts"
  };
}
```

### 3. Database Schema Extension
```sql
-- Would add similar tables for Threads
CREATE TABLE "ThreadsConnectSetting" (
  -- Similar to XConnectSetting
);

CREATE TABLE "ThreadsDiscoveredPost" (
  -- Similar to XDiscoveredPost
);

CREATE TABLE "ThreadsEngagementJob" (
  -- Similar to XEngagementJob
);
```

### 4. tRPC Router
```typescript
// packages/trpc/server/routers/viewer/threadsConnect.ts
// Would mirror xConnect.ts structure
```

### 5. UI Pages
```typescript
// apps/web/pages/threads-connect.tsx
// Would be very similar to x-connect.tsx
```

## Current Alternatives

Since the Threads API doesn't support replies, here are workarounds:

### Option 1: Manual Engagement Tracking
- Users manually visit discovered posts
- Track engagement separately
- Not automated

### Option 2: Quote Posts (Supported)
```typescript
// This IS supported by Threads API
await ThreadsManager.createQuotePost({
  quotedPostId: discoveredThreadId,
  text: "Your comment/quote"
});
```
- Not quite the same as replying
- Creates a separate post that quotes the original
- Less conversational

### Option 3: Wait for API Updates
- Monitor [Threads API Changelog](https://developers.facebook.com/docs/threads/changelog)
- Request feature from Meta
- Implement when available

## Recommendation

**Do NOT implement Threads Connect at this time** because:

1. ❌ Core feature (replying) is impossible with current API
2. ❌ No discovery/search capabilities
3. ❌ Would require significant workarounds that don't match X Connect UX
4. ✅ Architecture is ready when API support arrives
5. ✅ Can add quickly if Meta adds reply API

## Future Monitoring

Watch for these Threads API additions:
- [ ] Reply creation endpoint (`POST /{thread_id}/replies` or similar)
- [ ] Search/discovery endpoints
- [ ] Following/follower check endpoints
- [ ] Bulk operations support

## Related Documentation

- [Threads API Official Docs](https://developers.facebook.com/docs/threads)
- [X Connect Implementation](./X_CONNECT_ENGAGEMENT_README.md)
- [Threads Create Posts](https://developers.facebook.com/docs/threads/create-posts)
- [Threads Reply Management](https://developers.facebook.com/docs/threads/reply-management)

## Contact

If Meta announces reply API support, contact the development team to prioritize Threads Connect implementation. The groundwork is already in place.

---

**Last Updated**: October 13, 2025  
**Status**: ⏸️ Blocked by API limitations  
**Architecture Status**: ✅ Ready for implementation
