"use client";

import {
  VaahanIcon,
  type VaahanIconName,
  type VaahanIconProps,
} from "@vaahansafe/icons";
import type { ComponentType } from "react";

export type CustomerIconProps = Omit<VaahanIconProps, "name">;
export type CustomerIcon = ComponentType<CustomerIconProps>;

function icon(name: VaahanIconName): CustomerIcon {
  function Icon(props: CustomerIconProps) {
    return <VaahanIcon name={name} {...props} />;
  }
  Icon.displayName = `CustomerIcon(${name})`;
  return Icon;
}

export const Activity = icon("activity");
export const AlertCircle = icon("alert");
export const AlertTriangle = icon("warning");
export const ArrowRight = icon("arrow-right");
export const Bell = icon("notification");
export const Car = icon("vehicle");
export const Check = icon("check");
export const CheckCircle2 = icon("success");
export const ChevronDown = icon("chevron-down");
export const ChevronLeft = icon("chevron-left");
export const ChevronRight = icon("chevron-right");
export const ChevronsLeft = icon("chevrons-left");
export const ChevronsRight = icon("chevrons-right");
export const ChevronsUpDown = icon("chevrons-up-down");
export const Circle = icon("circle");
export const Clock = icon("clock");
export const Copy = icon("copy");
export const CreditCard = icon("payment");
export const Download = icon("download");
export const ExternalLink = icon("external-link");
export const FileCheck2 = icon("document");
export const FileText = icon("document");
export const HelpCircle = icon("help");
export const KeyRound = icon("key");
export const LayoutDashboard = icon("dashboard");
export const Loader2 = icon("loading-02");
export const LocateFixed = icon("location");
export const LogOut = icon("logout");
export const Mail = icon("mail");
export const MapPin = icon("map-pin");
export const MoreHorizontal = icon("more-horizontal");
export const Navigation = icon("route");
export const Package = icon("package");
export const PackageCheck = icon("package-check");
export const PanelLeft = icon("panel-left");
export const PhoneCall = icon("phone");
export const Printer = icon("print");
export const QrCode = icon("qr");
export const RefreshCw = icon("refresh");
export const RotateCcw = icon("rotate-ccw");
export const ScanLine = icon("qr-scan");
export const Search = icon("search");
export const Shield = icon("shield");
export const ShieldAlert = icon("shield-alert");
export const ShieldCheck = icon("shield-check");
export const ShoppingCart = icon("cart");
export const SlidersHorizontal = icon("adjustments");
export const Smartphone = icon("mobile");
export const Sparkles = icon("sparkles");
export const Truck = icon("truck-delivery");
export const User = icon("user");
export const Wallet = icon("wallet");
export const X = icon("close");
export const XCircle = icon("error");
