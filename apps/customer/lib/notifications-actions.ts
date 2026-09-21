"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedCustomer } from "./session";
import { getNotificationRepository } from "@vaahansafe/database";

export interface NotificationActionResult {
  success: boolean;
  error?: string;
  count?: number;
}

export async function markNotificationAsReadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const notifRepo = getNotificationRepository();
    const success = await notifRepo.markAsRead(notificationId, auth.user.id);
    revalidatePath("/notifications");
    return { success };
  } catch (err) {
    console.error("[VaahanSafe] Error marking notification as read:", err);
    return { success: false, error: "We couldn't update this notification right now." };
  }
}

export async function markNotificationAsUnreadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const notifRepo = getNotificationRepository();
    const success = await notifRepo.markAsUnread(notificationId, auth.user.id);
    revalidatePath("/notifications");
    return { success };
  } catch (err) {
    console.error("[VaahanSafe] Error marking notification as unread:", err);
    return { success: false, error: "We couldn't update this notification right now." };
  }
}

export async function archiveNotificationAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const notifRepo = getNotificationRepository();
    const success = await notifRepo.markAsArchived(notificationId, auth.user.id);
    revalidatePath("/notifications");
    return { success };
  } catch (err) {
    console.error("[VaahanSafe] Error archiving notification:", err);
    return { success: false, error: "We couldn't archive this notification right now." };
  }
}

export async function unarchiveNotificationAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const notifRepo = getNotificationRepository();
    const success = await notifRepo.unarchive(notificationId, auth.user.id);
    revalidatePath("/notifications");
    return { success };
  } catch (err) {
    console.error("[VaahanSafe] Error restoring notification:", err);
    return { success: false, error: "We couldn't restore this notification right now." };
  }
}

export async function bulkMarkAsReadAction(
  notificationIds: string[]
): Promise<NotificationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Authentication required" };
  }

  if (!notificationIds || notificationIds.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const notifRepo = getNotificationRepository();
    const count = await notifRepo.bulkMarkAsRead(notificationIds, auth.user.id);
    revalidatePath("/notifications");
    return { success: true, count };
  } catch (err) {
    console.error("[VaahanSafe] Error bulk marking notifications as read:", err);
    return { success: false, error: "We couldn't mark notifications as read right now." };
  }
}

export async function bulkMarkAsUnreadAction(
  notificationIds: string[]
): Promise<NotificationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Authentication required" };
  }

  if (!notificationIds || notificationIds.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const notifRepo = getNotificationRepository();
    const count = await notifRepo.bulkMarkAsUnread(notificationIds, auth.user.id);
    revalidatePath("/notifications");
    return { success: true, count };
  } catch (err) {
    console.error("[VaahanSafe] Error bulk marking notifications as unread:", err);
    return { success: false, error: "We couldn't mark notifications as unread right now." };
  }
}

export async function bulkArchiveAction(
  notificationIds: string[]
): Promise<NotificationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Authentication required" };
  }

  if (!notificationIds || notificationIds.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const notifRepo = getNotificationRepository();
    const count = await notifRepo.bulkArchive(notificationIds, auth.user.id);
    revalidatePath("/notifications");
    return { success: true, count };
  } catch (err) {
    console.error("[VaahanSafe] Error bulk archiving notifications:", err);
    return { success: false, error: "We couldn't archive notifications right now." };
  }
}

export async function markAllAsReadAction(): Promise<NotificationActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const notifRepo = getNotificationRepository();
    const count = await notifRepo.markAllAsRead(auth.user.id);
    revalidatePath("/notifications");
    return { success: true, count };
  } catch (err) {
    console.error("[VaahanSafe] Error marking all notifications as read:", err);
    return { success: false, error: "We couldn't mark all notifications as read right now." };
  }
}
