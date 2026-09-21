export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  type: "SECURITY" | "EMERGENCY" | "BILLING" | "SYSTEM";
  createdAt: string;
}

export interface IInAppNotificationService {
  dispatch(notification: Omit<InAppNotification, "id" | "read" | "createdAt">): Promise<InAppNotification>;
  getUnreadForUser(userId: string): Promise<InAppNotification[]>;
  markAsRead(id: string): Promise<void>;
}
