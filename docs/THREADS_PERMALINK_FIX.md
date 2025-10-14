# Threads Connect - Permalink Fix

## Issue
The Threads post URLs were incorrectly constructed as:
```
https://www.threads.com/@ha.doanx/post/18306473110223671
```

But this URL format doesn't work because:
1. We were manually constructing the URL
2. The format might not match Threads' actual URL structure
3. We weren't using the `permalink` field returned by the Threads Graph API

## Solution
Use the actual `permalink` returned by the Threads Graph API instead of manually constructing URLs.

## Changes Made

### 1. Database Schema Update

**File**: `packages/prisma/schema.prisma`

Added `permalink` field to store the actual Threads post URL from the API:

```prisma
model ThreadsDiscoveredPost {
  id               String                  @id @default(cuid())
  userId           Int
  threadsPostId    String
  authorId         String
  authorHandle     String
  authorName       String?
  authorIsFollowed Boolean                 @default(false)
  text             String                  @db.Text
  likeCount        Int                     @default(0)
  replyCount       Int                     @default(0)
  lang             String?
  permalink        String?                 // ← New field: Actual Threads post URL from API
  discoveredAt     DateTime                @default(now())
  lastSeenAt       DateTime                @default(now())
  status           ThreadsDiscoveredStatus @default(ACTIVE)
  // ... indexes
}
```

**Migration**: `20251014114230_add_permalink_to_threads_discovered_post`

### 2. Store Permalink from API

**File**: `packages/trpc/server/routers/viewer/threadsConnect.ts`

Updated the `startScan` procedure to store the permalink from the API response:

```typescript
await prisma.threadsDiscoveredPost.create({
  data: {
    userId,
    threadsPostId: post.id,
    authorId: post.username,
    authorHandle: post.username,
    authorName: post.username,
    authorIsFollowed: false,
    text: post.text || "",
    likeCount,
    replyCount,
    lang: settings.language || null,
    permalink: post.permalink || null, // ← Store actual permalink from API
    status: "ACTIVE",
  },
});
```

The API already fetches the permalink field:
```typescript
fields: ["id", "text", "media_type", "permalink", "timestamp", "username", "like_count", "reply_count"]
```

### 3. Update TypeScript Types

**File**: `apps/web/lib/connect-engagement/types.ts`

Added `permalink` to the `DiscoveredPost` interface:

```typescript
export interface DiscoveredPost {
  id: string;
  postId: string;
  authorHandle: string;
  authorName?: string | null;
  authorIsFollowed: boolean;
  text: string;
  likeCount: number;
  replyCount: number;
  discoveredAt: Date;
  status: Exclude<DiscoveredStatus, "ALL">;
  permalink?: string | null; // ← Added
}
```

### 4. Update PostCard Component

**File**: `apps/web/components/x-connect/PostCard.tsx`

**Added permalink to interface**:
```typescript
interface PostCardProps {
  post: {
    id: string;
    xPostId: string;
    authorHandle: string;
    authorName?: string | null;
    authorIsFollowed: boolean;
    text: string;
    likeCount: number;
    replyCount: number;
    discoveredAt: Date;
    status: "ACTIVE" | "QUEUED" | "ENGAGED" | "SKIPPED";
    permalink?: string | null; // ← Added
  };
  // ... other props
}
```

**Updated URL logic to prefer API permalink**:
```typescript
const getPlatformUrl = () => {
  // Use permalink from API if available (most reliable)
  if (post.permalink) {
    return post.permalink;
  }
  
  // Fallback to constructed URLs
  if (platform === "threads") {
    return `https://www.threads.net/@${post.authorHandle}/post/${post.xPostId}`;
  }
  
  return `https://twitter.com/${post.authorHandle}/status/${post.xPostId}`;
};

const platformLabels = {
  viewLabel: platform === "threads" ? "View on Threads" : "View on X",
  commentLabel: platform === "threads" ? "Reply" : "Comment",
  engageLabel: platform === "threads" ? "Engage Reply" : "Engage Comment",
  platformUrl: getPlatformUrl(), // ← Now uses API permalink first
};
```

## How It Works

### For Threads Posts:
1. **API Search**: When scanning for posts, the Threads Graph API returns a `permalink` field with the actual URL
2. **Storage**: The permalink is stored in the database
3. **Display**: PostCard component uses the stored permalink (if available) instead of constructing the URL
4. **Fallback**: If no permalink is stored (older posts), falls back to constructed URL

### For X (Twitter) Posts:
- Uses the existing URL construction: `https://twitter.com/{handle}/status/{postId}`
- No changes to existing X Connect functionality

## Benefits

1. **Accurate URLs**: Uses the exact URL provided by Threads API
2. **Future-proof**: If Threads changes URL format, API will return the correct format
3. **No Manual Construction**: No need to guess or maintain URL patterns
4. **Backward Compatible**: Falls back to constructed URLs if permalink is not available

## API Reference

According to Threads Graph API documentation, the `permalink` field returns the full URL to the post:

**Example Response**:
```json
{
  "data": [
    {
      "id": "18306473110223671",
      "text": "Example post text",
      "username": "ha.doanx",
      "permalink": "https://www.threads.net/@ha.doanx/post/[ACTUAL_PERMALINK_ID]",
      "like_count": 10,
      "reply_count": 5
    }
  ]
}
```

The `permalink` field contains the actual working URL, not the post ID.

## Testing

After these changes:
1. Run a new scan to fetch posts with permalinks
2. Click "View on Threads" button
3. The link should now work correctly using the API-provided permalink

For existing posts without permalinks:
- They will continue to use the fallback constructed URL
- Re-scan to get permalinks for those posts

## Migration Status

✅ **Migration Applied**: `20251014114230_add_permalink_to_threads_discovered_post`
✅ **Build Status**: Successful
✅ **TypeScript**: No errors
✅ **Backward Compatible**: Yes

## Next Steps

1. Test with actual Threads posts to verify permalinks work
2. Consider backfilling permalinks for existing posts (optional)
3. Monitor if Threads API returns working permalinks consistently
