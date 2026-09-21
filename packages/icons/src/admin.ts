import {
  DashboardSquare01Icon,
  ChartLineData01Icon,
  Settings01Icon,
  Database01Icon,
  CloudServerIcon,
  Activity01Icon,
  RefreshIcon,
  File01Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";

export const adminIcons = {
  dashboard: DashboardSquare01Icon,
  analytics: ChartLineData01Icon,
  chart: ChartLineData01Icon,
  settings: Settings01Icon,
  database: Database01Icon,
  server: CloudServerIcon,
  activity: Activity01Icon,
  refresh: RefreshIcon,
  file: File01Icon,
  layers: Layers01Icon,
} as const;

export type AdminIconName = keyof typeof adminIcons;
