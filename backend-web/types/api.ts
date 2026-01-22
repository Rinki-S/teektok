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

export interface PageResult<T> {
  list: T[];
  total: number;
}

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
// status: 0 正常, 1 冻结
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

// ------------------------------------------------------------
// Backend entities / VOs (derived from actual backend code)
// ------------------------------------------------------------

export interface UserEntity {
  id: number;
  username: string;
  avatar?: string | null;
  status: number;
  createTime?: string;
}

export interface VideoVO {
  videoId: number;
  title: string;
  videoUrl?: string | null;
  coverUrl?: string | null;
  playCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  favoriteCount?: number;
  isLiked?: boolean | null;
  isFavorited?: boolean | null;
  isFollowed?: boolean | null;
  description?: string | null;
  uploaderId?: number | null;
  uploaderName?: string | null;
  uploaderAvatar?: string | null;
}

export interface AdminUserListParams {
  page?: number;
  pageSize?: number;
}

export type AdminUserListResponse = ApiResponse<PageResult<UserEntity>>;

export interface VideoListParams {
  page?: number;
  size?: number;
}

export type VideoListResponse = ApiResponse<PageResult<VideoVO>>;

export interface AdminVideoVO {
  videoId: number;
  title: string;
  videoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  uploaderId?: number | null;
  status?: number;
  isHot?: number;
  isDeleted?: number;
  createTime?: string;
  updateTime?: string;
  playCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  favoriteCount?: number;
}

export type AdminVideoListResponse = ApiResponse<PageResult<AdminVideoVO>>;

export interface UserLoginRequest {
  username: string;
  password: string;
}

export interface UserRegisterRequest {
  username: string;
  password: string;
}

export interface UserLoginVO {
  userId: number;
  token: string;
}

export type UserLoginResponse = ApiResponse<UserLoginVO>;
export type UserRegisterResponse = ApiResponseNoData;

export interface UserMeVO {
  id: number;
  username: string;
  avatar?: string | null;
  followingCount?: number;
  followerCount?: number;
  likeCount?: number;
  videoUrls?: string[];
  videoCoverUrls?: string[];
}

export type UserMeResponse = ApiResponse<UserMeVO>;

export interface UserSearchVO {
  id: number;
  username: string;
  avatar?: string | null;
  isFollowing?: boolean;
}

export type UserSearchResponse = ApiResponse<UserSearchVO[]>;

export interface BehaviorDTO {
  videoId: number;
}

export interface PlayDTO {
  videoId: number;
}

export interface ShareDTO {
  videoId: number;
}

export interface CommentCreateDTO {
  videoId: number;
  content: string;
  parentId?: number | null;
}

export type BehaviorResponse = ApiResponseNoData;

export interface CommentVO {
  id: number;
  videoId: number;
  userId: number;
  content: string;
  createTime?: string;
  username?: string | null;
  avatar?: string | null;
  parentId?: number | null;
  likeCount?: number;
  isLiked?: boolean | null;
}

export type CommentListResponse = ApiResponse<PageResult<CommentVO>>;

export interface RecommendVideoVO {
  id: number;
  title: string;
  videoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  uploaderId?: number | null;
  uploaderName?: string | null;
  uploaderAvatar?: string | null;
  likeCount?: number;
  commentCount?: number;
  favoriteCount?: number;
  shareCount?: number;
  IsLiked?: boolean | null;
  IsFavorited?: boolean | null;
  isLiked?: boolean | null;
  isFavorited?: boolean | null;
}

export type RecommendListResponse = ApiResponse<RecommendVideoVO[]>;

export interface RelationActionDTO {
  targetId: number;
  actionType: 1 | 2;
}
