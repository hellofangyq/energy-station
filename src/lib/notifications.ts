import type { Notification } from "@prisma/client";
import { formatDateTime } from "@/lib/format";

export type NotificationPreview = {
  id: string;
  memberId?: string | null;
  title: string;
  content: string;
  createdAtLabel: string;
  read: boolean;
};

export function toNotificationPreview(notification: Notification): NotificationPreview {
  return {
    id: notification.id,
    memberId: notification.memberId ?? null,
    title: notification.title,
    content: notification.content,
    createdAtLabel: formatDateTime(notification.createdAt),
    read: notification.read
  };
}
