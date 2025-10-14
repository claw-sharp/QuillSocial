# Threads Connect UI Updates

## Overview
Updated the Threads Connect page to use platform-specific labels instead of X-specific terminology.

## Changes Made

### 1. PostCard Component - Made Platform-Aware

**File**: `apps/web/components/x-connect/PostCard.tsx`

**Changes**:

1. **Added platform prop** to component interface:
   ```typescript
   platform?: "x" | "threads"; // Defaults to "x" for backward compatibility
   ```

2. **Added platform-specific labels** object in component:
   ```typescript
   const platformLabels = {
     viewLabel: platform === "threads" ? "View on Threads" : "View on X",
     commentLabel: platform === "threads" ? "Reply" : "Comment",
     engageLabel: platform === "threads" ? "Engage Reply" : "Engage Comment",
     platformUrl: platform === "threads" 
       ? `https://www.threads.net/@${post.authorHandle}/post/${post.xPostId}`
       : `https://twitter.com/${post.authorHandle}/status/${post.xPostId}`,
   };
   ```

3. **Updated UI labels**:
   - "View on X" → "View on Threads" (when platform="threads")
   - "Comment" button → "Reply" button (when platform="threads")
   - "Engage Comment" → "Engage Reply" (when platform="threads")

4. **Updated platform URL**:
   - X: `https://twitter.com/{handle}/status/{postId}`
   - Threads: `https://www.threads.net/@{handle}/post/{postId}`

5. **Commented out "To Engage" button for Threads**:
   ```typescript
   {platform !== "threads" && (
     <Button
       color="secondary"
       size="sm"
       StartIcon={UserPlus}
       onClick={handleToEngage}
     >
       To Engage
     </Button>
   )}
   ```

### 2. Threads Connect Page - Pass Platform Prop

**File**: `apps/web/pages/threads-connect.tsx`

**Changes**:

Added `platform="threads"` prop to PostCard component:
```tsx
<PostCard
  key={post.id}
  post={{...}}
  onSkip={handleSkipPost}
  template={bulkTemplate}
  topics={activeTopics}
  platform="threads"  // ← Added this
  onStatusChange={() => {
    postsQuery.refetch();
    statsQuery.refetch();
  }}
/>
```

## UI Changes Summary

| Element | X Connect | Threads Connect |
|---------|-----------|-----------------|
| View Link Label | "View on X" | "View on Threads" |
| View Link URL | `twitter.com/{handle}/status/{id}` | `threads.net/@{handle}/post/{id}` |
| Primary Action Button | "Comment" | "Reply" |
| Engage Label | "Engage Comment" | "Engage Reply" |
| "To Engage" Button | Visible | **Hidden** |

## Backward Compatibility

- The `platform` prop defaults to `"x"` if not provided
- Existing X Connect page (`x-connect.tsx`) doesn't need changes
- All X-specific functionality remains intact

## Testing Recommendations

1. **Threads Connect Page** (`/threads-connect`):
   - Verify "View on Threads" button opens correct Threads URL
   - Verify "Reply" button label is correct
   - Verify "To Engage" button is hidden in the preview section
   - Test reply functionality with actual Threads API

2. **X Connect Page** (`/x-connect`):
   - Verify no regressions - all labels should remain "View on X" and "Comment"
   - Verify "To Engage" button is still visible
   - Test comment functionality

## Notes

- The PostCard component is now platform-agnostic and can be reused for both X and Threads
- Future platforms can be easily added by extending the platform prop and platformLabels object
- The component maintains backward compatibility with existing X Connect implementation

## Related Files

- `apps/web/components/x-connect/PostCard.tsx` - Main component with platform support
- `apps/web/pages/threads-connect.tsx` - Threads-specific page
- `apps/web/pages/x-connect.tsx` - X-specific page (no changes needed)
- `apps/web/lib/connect-engagement/useConnectEngagement.ts` - Shared hook (no changes needed)
