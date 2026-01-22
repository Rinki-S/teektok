// Admin module domain types for UI tables (backend-web)
//
// These types are for the *admin frontend UI* (tables/filters/forms).
// They are derived from the docs in `backend-web/docs/md/接口文档.md` and
// `backend-web/docs/md/数据库设计.md`.
//
// Notes:
// - Backend APIs are not implemented yet; UI should treat these as the contract
//   for view models and mock data.
// - DB design uses: user.status (0 normal, 1 frozen) but API doc says
//   /admin/user/status status: 0 frozen, 1 normal. We keep BOTH as separate
//   enums so you can map explicitly in UI code.

export type ID = number;

/**
 * Database-based user status (from `数据库设计.md`):
 * - 0: 正常
 * - 1: 冻结
 */
export type DbUserStatus = 0 | 1;

/**
 * Admin API user status intent (from `接口文档.md` /admin/user/status):
 * - 0: 正常
 * - 1: 冻结
 */
export type AdminUserStatusAction = 0 | 1;

export type VideoAuditStatus = 0 | 1; // 1 通过, 0 拒绝 (from docs)
export type VideoHotFlag = 0 | 1; // 0 否, 1 是 (from db design)

/**
 * Admin session representation (local, UI-only).
 * Backend docs are ambiguous about /admin/login response shape, so this is
 * intentionally tolerant.
 */
export interface AdminSession {
  adminId?: ID;
  token: string;
  username?: string;
}

/**
 * User row for admin user list pages.
 * Derived from `user` table + admin actions.
 */
export interface AdminUserRow {
  id: ID;
  username: string;
  status: DbUserStatus;

  avatarUrl?: string | null;
  createdAt?: string; // ISO datetime string
}

/**
 * Video row for admin video management.
 * Derived from `video` table + docs video list/hot list examples.
 */
export interface AdminVideoRow {
  id: ID;
  title: string;

  videoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;

  uploaderId?: ID | null;

  /**
   * From DB design:
   * - 0: 待审核
   * - 1: 通过
   * - 2: 拒绝
   */
  auditStatus?: 0 | 1 | 2;

  isHot?: VideoHotFlag;
  isDeleted?: 0 | 1;

  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string

  // Stats (docs examples: playCount/likeCount; db suggests video_stat table)
  playCount?: number;
  likeCount?: number;
  commentCount?: number;
  favoriteCount?: number;
}

/**
 * Video list query for admin pages (UI-only).
 * The docs only define GET /video/list with page/size, but admin UI usually
 * needs filters; keep them optional for now.
 */
export interface AdminVideoListQuery {
  page: number;
  size: number;

  auditStatus?: 0 | 1 | 2;
  isHot?: VideoHotFlag;
  uploaderId?: ID;
  titleKeyword?: string;
}

/**
 * Simple pagination wrapper for admin lists (UI-only).
 * Backend docs don't define a pagination envelope; admin UI can use this for mocks.
 */
export interface PageResult<T> {
  items: T[];
  page: number;
  size: number;
  total?: number;
}

/**
 * Aggregated stats for dashboard (from docs /analysis/video response example).
 */
export interface AdminVideoAnalysis {
  playCount: number;
  likeCount: number;
  commentCount: number;
}

/**
 * UI helpers: map between API status action and DB status semantics.
 * - Admin API expects: 0 frozen, 1 normal.
 * - DB stores:        0 normal, 1 frozen.
 */
export function mapAdminUserStatusActionToDbStatus(
  action: AdminUserStatusAction,
): DbUserStatus {
  return action;
}

export function mapDbUserStatusToAdminUserStatusAction(
  status: DbUserStatus,
): AdminUserStatusAction {
  return status;
}
