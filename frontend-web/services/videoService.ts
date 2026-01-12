// ============================================
// 视频 API 服务
// ============================================
// 这个文件包含所有与视频相关的 API 调用
// TODO: 将所有 API_BASE_URL 替换为实际的后端地址

import type {
  Video,
  VideoListResponse,
  LikeVideoRequest,
  BookmarkVideoRequest,
  FollowUserRequest
} from '@/types/video';

// TODO: 从环境变量读取
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// ============================================
// 假数据（开发用）
// ============================================
const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    videoUrl: '/vid.mp4',
    thumbnailUrl: '/vid.mp4',
    title: '精彩视频 #1',
    description: '这是第一个测试视频，展示了精彩的内容 #测试 #短视频',
    author: {
      id: 'user1',
      username: '创作者一号',
      avatarUrl: undefined,
      isFollowing: false,
    },
    stats: {
      likes: 1234,
      comments: 345,
      shares: 89,
      views: 12000,
    },
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    videoUrl: '/vid.mp4',
    thumbnailUrl: '/vid.mp4',
    title: '精彩视频 #2',
    description: '这是第二个测试视频 #娱乐 #搞笑',
    author: {
      id: 'user2',
      username: '创作者二号',
      avatarUrl: undefined,
      isFollowing: false,
    },
    stats: {
      likes: 5678,
      comments: 890,
      shares: 234,
      views: 45000,
    },
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    videoUrl: '/vid.mp4',
    thumbnailUrl: '/vid.mp4',
    title: '精彩视频 #3',
    description: '这是第三个测试视频，内容丰富多彩 #生活 #记录',
    author: {
      id: 'user3',
      username: '创作者三号',
      avatarUrl: undefined,
      isFollowing: true,
    },
    stats: {
      likes: 9012,
      comments: 1234,
      shares: 456,
      views: 78000,
    },
    isLiked: true,
    isBookmarked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    videoUrl: '/vid.mp4',
    thumbnailUrl: '/vid.mp4',
    title: '精彩视频 #4',
    description: '第四个视频来啦 #美食 #分享',
    author: {
      id: 'user4',
      username: '创作者四号',
      avatarUrl: undefined,
      isFollowing: false,
    },
    stats: {
      likes: 3456,
      comments: 567,
      shares: 123,
      views: 23000,
    },
    isLiked: false,
    isBookmarked: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    videoUrl: '/vid.mp4',
    thumbnailUrl: '/vid.mp4',
    title: '精彩视频 #5',
    description: '最后一个测试视频 #旅行 #风景',
    author: {
      id: 'user5',
      username: '创作者五号',
      avatarUrl: undefined,
      isFollowing: false,
    },
    stats: {
      likes: 7890,
      comments: 901,
      shares: 345,
      views: 56000,
    },
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date().toISOString(),
  },
];

// ============================================
// API 函数
// ============================================

/**
 * 获取视频列表（Feed 流）
 * @param cursor - 分页游标
 * @param limit - 每页数量
 * @returns 视频列表响应
 *
 * TODO: 对接后端 API
 * 后端接口: GET /videos/feed?cursor={cursor}&limit={limit}
 */
export async function getVideoFeed(
  cursor?: string,
  limit: number = 10
): Promise<VideoListResponse> {
  // TODO: 替换为真实 API 调用
  // const response = await fetch(`${API_BASE_URL}/videos/feed?cursor=${cursor || ''}&limit=${limit}`);
  // const data = await response.json();
  // return data;

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 返回假数据
  return {
    videos: MOCK_VIDEOS,
    nextCursor: undefined,
    hasMore: false,
  };
}

/**
 * 点赞/取消点赞视频
 * @param request - 点赞请求
 *
 * TODO: 对接后端 API
 * 后端接口: POST /videos/{videoId}/like
 * Request Body: { isLiked: boolean }
 */
export async function toggleLikeVideo(request: LikeVideoRequest): Promise<void> {
  // TODO: 替换为真实 API 调用
  // const response = await fetch(`${API_BASE_URL}/videos/${request.videoId}/like`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ isLiked: request.isLiked }),
  // });
  // if (!response.ok) throw new Error('Failed to toggle like');

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('Toggle like:', request);
}

/**
 * 收藏/取消收藏视频
 * @param request - 收藏请求
 *
 * TODO: 对接后端 API
 * 后端接口: POST /videos/{videoId}/bookmark
 * Request Body: { isBookmarked: boolean }
 */
export async function toggleBookmarkVideo(request: BookmarkVideoRequest): Promise<void> {
  // TODO: 替换为真实 API 调用
  // const response = await fetch(`${API_BASE_URL}/videos/${request.videoId}/bookmark`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ isBookmarked: request.isBookmarked }),
  // });
  // if (!response.ok) throw new Error('Failed to toggle bookmark');

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('Toggle bookmark:', request);
}

/**
 * 关注/取消关注用户
 * @param request - 关注请求
 *
 * TODO: 对接后端 API
 * 后端接口: POST /users/{userId}/follow
 * Request Body: { isFollowing: boolean }
 */
export async function toggleFollowUser(request: FollowUserRequest): Promise<void> {
  // TODO: 替换为真实 API 调用
  // const response = await fetch(`${API_BASE_URL}/users/${request.userId}/follow`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ isFollowing: request.isFollowing }),
  // });
  // if (!response.ok) throw new Error('Failed to toggle follow');

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('Toggle follow:', request);
}

/**
 * 分享视频
 * @param videoId - 视频 ID
 *
 * TODO: 对接后端 API（如果需要记录分享统计）
 * 后端接口: POST /videos/{videoId}/share
 */
export async function shareVideo(videoId: string): Promise<void> {
  // TODO: 替换为真实 API 调用
  // const response = await fetch(`${API_BASE_URL}/videos/${videoId}/share`, {
  //   method: 'POST',
  // });
  // if (!response.ok) throw new Error('Failed to share video');

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('Share video:', videoId);
}

/**
 * 增加视频播放次数
 * @param videoId - 视频 ID
 *
 * TODO: 对接后端 API
 * 后端接口: POST /videos/{videoId}/view
 */
export async function incrementVideoView(videoId: string): Promise<void> {
  // TODO: 替换为真实 API 调用
  // const response = await fetch(`${API_BASE_URL}/videos/${videoId}/view`, {
  //   method: 'POST',
  // });
  // if (!response.ok) throw new Error('Failed to increment view');

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Increment view:', videoId);
}
