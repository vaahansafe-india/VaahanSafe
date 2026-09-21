import {
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  HelpCircleIcon,
  Loading01Icon,
  Wifi01Icon,
  WifiDisconnected01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";

export const statusIcons = {
  success: CheckmarkCircle01Icon,
  check: CheckmarkCircle01Icon,
  warning: AlertCircleIcon,
  error: AlertCircleIcon,
  alert: AlertCircleIcon,
  emergency: AlertCircleIcon,
  sos: AlertCircleIcon,
  info: InformationCircleIcon,
  help: HelpCircleIcon,
  loading: Loading01Icon,
  online: Wifi01Icon,
  offline: WifiDisconnected01Icon,
  shield: Shield01Icon,
} as const;

export type StatusIconName = keyof typeof statusIcons;
