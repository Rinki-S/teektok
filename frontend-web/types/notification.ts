export type NotificationType = 1 | 2 | 3 | 4;
export type NotificationTargetType = 1 | 2 | 3;

export type NotificationItem = {
  id: number;
  actorId: number;
  actorUsername?: string;
  actorAvatar?: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetId: number;
  content?: string | null;
  isRead: number;
  createTime: string;
};
