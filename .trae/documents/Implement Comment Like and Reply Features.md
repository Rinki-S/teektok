I will implement the comment like and reply features by modifying the database schema, backend service, and frontend components.

## Database Changes
1.  Create `docs/sql/update_comment.sql` with:
    *   Add `parent_id` (BIGINT) and `like_count` (BIGINT, default 0) to `comment` table.
    *   Create `comment_like` table to track user likes on comments.

## Backend Implementation (Java)
1.  **Entity Updates**:
    *   Update `Comment.java`: Add `parentId` and `likeCount` fields.
    *   Create `CommentLike.java`: New entity for the `comment_like` table.
2.  **Mapper Updates**:
    *   Create `CommentLikeMapper.java`.
    *   Update `CommentMapper.java`: Add method to atomic increment/decrement like count.
3.  **DTO/VO Updates**:
    *   Update `CommentCreateDTO.java`: Add `parentId` field.
    *   Update `CommentVO.java`: Add `parentId`, `likeCount`, and `isLiked` fields.
4.  **Service Logic (`BehaviorServiceImpl`)**:
    *   Update `comment` method: Save `parentId` if provided.
    *   Implement `likeComment` and `unlikeComment` methods.
    *   Update `listComments` method:
        *   Retrieve `likeCount` from `Comment` entity.
        *   Check `CommentLike` table to populate `isLiked` for the current user.
        *   (Note: For simplicity, we will return a flat list with `parentId`, and the frontend will handle the nesting/rendering).
5.  **Controller Updates (`BehaviorController`)**:
    *   Add endpoints: `POST /api/behavior/comment/like` and `POST /api/behavior/comment/unlike`.

## Frontend Implementation (React/TS)
1.  **Type Definitions**:
    *   Update `Comment` interface in `types/video.ts` to include `parentId`, `likeCount`, `isLiked`.
2.  **Service Layer**:
    *   Update `createComment` in `videoService.ts` to accept `parentId`.
    *   Add `likeComment` function in `videoService.ts`.
3.  **UI Components (`comments-sheet.tsx`)**:
    *   Add **Reply** button to each comment.
    *   Add **Like** button (Heart icon) with count.
    *   Update input area to show "Replying to @User" state.
    *   Update rendering to visually distinguish replies (e.g., indentation).

I will start by creating the SQL file and then proceed with the backend and frontend changes.