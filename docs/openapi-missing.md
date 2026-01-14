# Teektok 后端 OpenAPI 需补齐接口清单（Markdown 规范稿）

## 0. 背景

当前后端 OpenAPI（`GET /v3/api-docs`）已覆盖：

- 用户注册/登录
- 点赞/评论/分享（用户行为）
- 视频上传/播放记录/视频列表
- 推荐（热门/个性化）
- 全站行为统计
- 管理员登录、封禁用户、审核视频、设置热门、删除视频

但从项目现有的页面与交互（`frontend-web` + `backend-web`）来看，仍缺少若干核心接口，导致：

- 用户端仍需 mock 数据或 no-op（收藏、关注、评论列表、视频流分页等）
- 管理端缺少用户列表、视频管理列表（筛选/分页）等关键能力
- OpenAPI 中部分路径/参数风格不统一，前端容易配置错误（例如 `/api/api/...`）

本文档列出建议补齐/修正的接口与规范。

---

## 1. 全局约定

### 1.1 鉴权（Authentication/Authorization）

采用 **JWT Bearer Token**：

- 客户端请求头：`Authorization: Bearer <token>`

权限约定：

- 普通用户接口：需要登录（或可匿名，接口会注明）
- 管理员接口（`/api/admin/**`）：需要 `ADMIN` 权限（token 内含角色信息，例如 `role=ADMIN`）

> 建议 OpenAPI 中为需要鉴权的接口标记 `security: [bearerAuth]`

### 1.2 分页（Pagination）

- **用户端刷流/评论等无限滚动**：Cursor 分页
  - 请求：`cursor?: string`, `limit: number`
  - 返回：`items`, `nextCursor?`, `hasMore`
- **管理端表格列表**：页码分页
  - 请求：`page: number`, `size: number`
  - 返回：`items`, `total`, `page`, `size`

### 1.3 统一响应结构（建议标准化）

建议后端所有接口统一使用：

- `Result<T>`
  - `code: number`（成功固定 200）
  - `msg: string`
  - `data: T`

- `CursorResult<T>`
  - `items: T[]`
  - `nextCursor?: string`
  - `hasMore: boolean`

- `PageResult<T>`
  - `items: T[]`
  - `page: number`
  - `size: number`
  - `total: number`

---

## 2. OpenAPI 必须修正（强烈建议先做）

### 2.1 路径重复：`/api/api/video/...`

现有 OpenAPI 出现：

- `/api/api/video/list`
- `/api/api/video/play`
- `/api/api/video/upload`

建议统一为：

- `/api/video/list`
- `/api/video/play`
- `/api/video/upload`

原因：

- 避免客户端 baseUrl 配置错误（否则容易出现 `/api/api/...` 叠加）
- 简化前端调用与文档一致性

### 2.2 POST 参数放 query 的问题（风格统一）

现有 OpenAPI：

- `POST /api/admin/user/status`（query）
- `POST /api/admin/video/hot`（query）

建议改为 JSON body：

- `POST /api/admin/user/status`：body `{ userId, status }`
- `POST /api/admin/video/hot`：body `{ videoId, hot }`

原因：

- 更符合 REST/JSON API 常规实践
- 未来扩展字段不破坏兼容性
- 前端实现更简单

---

## 3. 用户端（frontend-web）需补齐接口

### 3.1 用户会话

#### 3.1.1 获取当前用户信息

- **GET** `/api/user/me`
- 鉴权：需要（bearer）
- 用途：刷新页面恢复登录态；“我的”页/顶部栏展示个人信息
- 返回：`Result<UserMeVO>`

`UserMeVO` 建议字段：

- `userId: int64`
- `username: string`
- `avatarUrl?: string`
- `status: int32`（例如 0 正常，1 封禁；或你已有的状态定义）
- `createdAt: string`

#### 3.1.2 退出登录（可选但推荐）

- **POST** `/api/user/logout`
- 鉴权：需要（bearer）
- 返回：`Result<Void>`

> JWT 无状态也可只前端清 token，但建议保留以便未来做 token 黑名单/注销等。

---

### 3.2 视频 Feed（短视频刷流核心）

#### 3.2.1 视频推荐流（Cursor 分页）

- **GET** `/api/video/feed`
- 鉴权：可选（匿名可看；登录后可个性化）
- Query：
  - `cursor?: string`
  - `limit: int32`（默认 10）
  - `type?: string`（`recommend | hot | following | friends`，可选）
- 返回：`Result<CursorResult<VideoFeedItemVO>>`

`VideoFeedItemVO` 建议字段（足够驱动 UI）：

- `videoId: int64`
- `title: string`
- `description?: string`
- `videoUrl: string`
- `coverUrl?: string`
- `author: UserBriefVO`
- `stats: VideoStatsVO`
- `viewerState?: VideoViewerStateVO`
- `createdAt: string`

`UserBriefVO`：

- `userId: int64`
- `username: string`
- `avatarUrl?: string`
- `isFollowing?: boolean`

`VideoStatsVO`：

- `playCount: int64`
- `likeCount: int64`
- `commentCount: int64`
- `shareCount: int64`
- `favoriteCount?: int64`

`VideoViewerStateVO`：

- `isLiked: boolean`
- `isFavorited: boolean`

#### 3.2.2 视频详情

- **GET** `/api/video/{videoId}`
- 鉴权：可选
- 返回：`Result<VideoFeedItemVO>`

> 用于分享链接打开、视频详情页、评论面板等。

---

### 3.3 播放行为（上报播放次数）

现有 OpenAPI 有“play”，但路径建议迁移后统一为：

- **POST** `/api/video/play`
- 鉴权：可选
- Body：`{ videoId: int64 }`
- 返回：`Result<Void>`

---

### 3.4 点赞/取消点赞（需补齐取消语义）

现有 `POST /api/behavior/like` 只有“点赞视频”的语义，建议改成可切换：

- **POST** `/api/behavior/like`
- 鉴权：需要（bearer）
- Body：`{ videoId: int64, action: "LIKE" | "UNLIKE" }`
- 返回：`Result<Void>`

> 若不想修改现有端点，也可新增：
>
> - **DELETE** `/api/behavior/like?videoId=...`

---

### 3.5 收藏/取消收藏（必须新增）

用户端存在收藏/书签行为，但 OpenAPI 缺少：

- **POST** `/api/behavior/favorite`
- 鉴权：需要（bearer）
- Body：`{ videoId: int64, action: "FAVORITE" | "UNFAVORITE" }`
- 返回：`Result<Void>`

可选增强（常见需求）：

- **GET** `/api/user/favorites`
- 鉴权：需要（bearer）
- Query：`cursor?, limit`
- 返回：`Result<CursorResult<VideoFeedItemVO>>`

---

### 3.6 评论体系（必须补齐列表）

现有只有“发表评论”：

- `POST /api/behavior/comment`

但用户端通常需要评论列表：

#### 3.6.1 获取评论列表（Cursor）

- **GET** `/api/comment/list`
- 鉴权：可选
- Query：
  - `videoId: int64`
  - `cursor?: string`
  - `limit: int32`
- 返回：`Result<CursorResult<CommentVO>>`

`CommentVO` 建议字段：

- `commentId: int64`
- `videoId: int64`
- `content: string`
- `author: UserBriefVO`
- `createdAt: string`

#### 3.6.2 删除评论（可选）

- **DELETE** `/api/comment/{commentId}`
- 鉴权：需要（bearer）
- 权限：作者本人或管理员
- 返回：`Result<Void>`

---

### 3.7 分享行为（已有，可保持）

你已有：

- `POST /api/behavior/share`

建议可选增强：

- 返回分享后最新 `shareCount` 或 `shareId`（便于统计/展示）

---

### 3.8 关注体系（必须新增）

用户端存在 following/friends 页面骨架和 follow 行为，但 OpenAPI 缺失：

#### 3.8.1 关注/取关

- **POST** `/api/follow`
- 鉴权：需要（bearer）
- Body：`{ userId: int64, action: "FOLLOW" | "UNFOLLOW" }`
- 返回：`Result<Void>`

#### 3.8.2 我的关注列表

- **GET** `/api/follow/following`
- 鉴权：需要（bearer）
- Query：`cursor?, limit`
- 返回：`Result<CursorResult<UserBriefVO>>`

#### 3.8.3 我的粉丝列表

- **GET** `/api/follow/followers`
- 鉴权：需要（bearer）
- Query：`cursor?, limit`
- 返回：`Result<CursorResult<UserBriefVO>>`

#### 3.8.4 关注流（用于 following 页刷视频）

推荐复用视频 feed：

- **GET** `/api/video/feed?type=following`

---

### 3.9 搜索（可选，但你已有 Searchbar）

#### 3.9.1 搜索视频

- **GET** `/api/search/video?q=...`
- Query：`cursor?, limit`
- 返回：`Result<CursorResult<VideoFeedItemVO>>`

#### 3.9.2 搜索用户

- **GET** `/api/search/user?q=...`
- Query：`cursor?, limit`
- 返回：`Result<CursorResult<UserBriefVO>>`

---

## 4. 管理端（backend-web）需补齐接口

### 4.1 管理端用户列表（必须）

- **GET** `/api/admin/user/list`
- 鉴权：需要（ADMIN）
- Query：
  - `page: int32`
  - `size: int32`
  - `status?: int32`
  - `keyword?: string`（用户名/ID 模糊搜索）
- 返回：`Result<PageResult<AdminUserVO>>`

`AdminUserVO` 建议字段：

- `userId: int64`
- `username: string`
- `status: int32`
- `createdAt: string`

### 4.2 管理端视频列表（必须）

- **GET** `/api/admin/video/list`
- 鉴权：需要（ADMIN）
- Query（建议）：
  - `page: int32`
  - `size: int32`
  - `auditStatus?: int32`（0 待审 / 1 通过 / 2 拒绝）
  - `isHot?: boolean`
  - `keyword?: string`
  - `uploaderId?: int64`
- 返回：`Result<PageResult<AdminVideoVO>>`

`AdminVideoVO` 建议字段：

- `videoId: int64`
- `title: string`
- `uploader: UserBriefVO`（或 uploaderId + username）
- `auditStatus: int32`
- `isHot: boolean`
- `createdAt: string`
- `stats: VideoStatsVO`

### 4.3 管理端封禁/审核/热门/删除（建议调整风格）

现有接口建议保留，但统一 JSON body 与路径规范：

- `POST /api/admin/user/status`（Body）
- `POST /api/admin/video/audit`（Body）
- `POST /api/admin/video/hot`（Body）
- `DELETE /api/admin/video/delete/{videoId}`

---

## 5. 数据分析（analysis）建议补齐（可选增强）

你已有：

- `GET /api/analysis/video`（全站汇总）

建议补充以支撑管理端图表/排行：

### 5.1 行为趋势（按天）

- **GET** `/api/analysis/video/trend`
- 鉴权：ADMIN
- Query：`from: string`, `to: string`, `granularity: "day" | "week"`
- 返回：`Result<VideoTrendPointVO[]>`

`VideoTrendPointVO`：

- `date: string`
- `playCount: int64`
- `likeCount: int64`
- `commentCount: int64`
- `shareCount: int64`

### 5.2 Top 视频排行

- **GET** `/api/analysis/video/top`
- 鉴权：ADMIN
- Query：`by: "play" | "like" | "comment" | "share"`, `limit: int32`
- 返回：`Result<VideoRankVO[]>`

`VideoRankVO`：

- `videoId: int64`
- `title: string`
- `value: int64`

---

## 6. 错误码建议（写入规范更利于前端处理）

- `200`：成功
- `400`：参数错误
- `401`：未登录 / token 无效
- `403`：无权限（非 ADMIN 调用 admin 接口）
- `404`：资源不存在（videoId/commentId/userId）
- `409`：状态冲突（重复点赞/重复关注等，如果你希望严格）

---

## 7. 推荐的实现顺序（最短路径）

### 第一阶段（让用户端真正可用）

1. `GET /api/video/feed`（cursor）
2. `POST /api/video/play`
3. `POST /api/behavior/like` 支持 unlike
4. `GET /api/comment/list`
5. `POST /api/behavior/comment`
6. `POST /api/behavior/favorite`
7. `POST /api/follow`
8. `GET /api/user/me`

### 第二阶段（让管理端完整）

1. `GET /api/admin/video/list`
2. `GET /api/admin/user/list`
3. 分析：trend/top