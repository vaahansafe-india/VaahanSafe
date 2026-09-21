import { navigationIcons, NavigationIconName } from "./navigation";
import { statusIcons, StatusIconName } from "./status";
import { vehicleIcons, VehicleIconName } from "./vehicle";
import { qrIcons, QrIconName } from "./qr";
import { commerceIcons, CommerceIconName } from "./commerce";
import { accountIcons, AccountIconName } from "./account";
import { adminIcons, AdminIconName } from "./admin";

export const ICON_REGISTRY = {
  ...navigationIcons,
  ...statusIcons,
  ...vehicleIcons,
  ...qrIcons,
  ...commerceIcons,
  ...accountIcons,
  ...adminIcons,
} as const;

export type VaahanIconName =
  | NavigationIconName
  | StatusIconName
  | VehicleIconName
  | QrIconName
  | CommerceIconName
  | AccountIconName
  | AdminIconName;
