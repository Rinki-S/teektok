// Shared API response + Admin module API types
// Based on `backend-web/docs/md/接口文档.md`
//
// Base path (docs): http://localhost:8080/api
// Common response shape (docs):
//   { code: 200, msg: "success", data: {} }

export type ApiCode = number;

export interface ApiResponse<TData = unknown> {
  code: ApiCode;
  msg: string;
  data?: TData;
}

// Some endpoints (e.g., register) show no `data` in the example.
// This helper keeps it type-safe while being tolerant.
export type ApiResponseNoData = Omit<ApiResponse<never>, "data"> & { data?: never };

// ------------------------------------------------------------
// Admin module types (docs section 6)
// ------------------------------------------------------------

// 6.1 管理员登录
// POST /admin/login
// Docs do not specify request/response body explicitly.
// Keep request aligned with user login style.
// Response might be token only or wrapped object; docs are ambiguous.
// We'll model it as optional data with common fields.
export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginData {
  adminId?: number;
  token?: string;
}

export type AdminLoginResponse = ApiResponse<AdminLoginData>;

// 6.2 冻结/解封用户
// POST /admin/user/status
// Request: { "userId": 1, "status": 0 }
// status: 0 冻结, 1 正常
export type UserStatus = 0 | 1;

export interface AdminUserStatusRequest {
  userId: number;
  status: UserStatus;
}

export type AdminUserStatusResponse = ApiResponseNoData;

// 6.3 审核短视频
// POST /admin/video/audit
// Request: { "videoId": 1, "status": 1 }
// status: 1 通过, 0 拒绝
export type VideoAuditStatus = 0 | 1;

export interface AdminVideoAuditRequest {
  videoId: number;
  status: VideoAuditStatus;
}

export type AdminVideoAuditResponse = ApiResponseNoData;

// 6.4 设置热门视频
// POST /admin/video/hot
// Docs only provide endpoint, no body. We'll assume it sets "is_hot" flag.
// To be safe, allow either:
// - { videoId, isHot }  (commonly used)
// - { videoId }         (toggle server-side default)
export type VideoHotFlag = 0 | 1;

export interface AdminVideoHotRequest {
  videoId: number;
  isHot?: VideoHotFlag;
}

export type AdminVideoHotResponse = ApiResponseNoData;

// 6.5 删除视频
// DELETE /admin/video/delete/{videoId}
export interface AdminVideoDeleteParams {
  videoId: number;
}

export type AdminVideoDeleteResponse = ApiResponseNoData;

// ------------------------------------------------------------
// Optional: Shared types used by admin UI pages
// ------------------------------------------------------------

// From docs examples:
// video list item: { videoId, title, playCount }
// hot list item:  { videoId, title, likeCount }
export interface VideoListItem {
  videoId: number;
  title: string;
  playCount?: number;
  likeCount?: number;
}

export interface VideoAnalysisData {
  playCount: number;
  likeCount: number;
  commentCount: number;
}
