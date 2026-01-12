// 视频数据类型定义
export interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
    isFollowing?: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
}

// API 响应类型
export interface VideoListResponse {
  videos: Video[];
  nextCursor?: string;
  hasMore: boolean;
}

// 用户交互请求类型
export interface LikeVideoRequest {
  videoId: string;
  isLiked: boolean;
}

export interface BookmarkVideoRequest {
  videoId: string;
  isBookmarked: boolean;
}

export interface FollowUserRequest {
  userId: string;
  isFollowing: boolean;
}
