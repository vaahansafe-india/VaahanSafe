import {
  User02Icon,
  UserGroupIcon,
  LockIcon,
  LockKeyIcon,
  Call02Icon,
  Mail01Icon,
  Notification01Icon,
  IdCardIcon,
} from "@hugeicons/core-free-icons";

export const accountIcons = {
  user: User02Icon,
  users: UserGroupIcon,
  lock: LockIcon,
  unlock: LockKeyIcon,
  phone: Call02Icon,
  mail: Mail01Icon,
  email: Mail01Icon,
  notification: Notification01Icon,
  bell: Notification01Icon,
  "id-card": IdCardIcon,
} as const;

export type AccountIconName = keyof typeof accountIcons;
