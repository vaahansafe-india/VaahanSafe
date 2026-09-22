"use client";

import * as React from "react";
import {
  AppShell,
  ConnectionStatus,
  SystemState,
} from "@vaahansafe/ui/patterns";
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertDescription,
  AlertTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Skeleton,
  Progress,
  Separator,
} from "@vaahansafe/ui/components";
import { ThemeToggle } from "@vaahansafe/ui/theme";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { designTokens } from "@vaahansafe/ui/theme";
import { BrandShowcase } from "../../components/brand/BrandShowcase";

const BRAND_SCALE = Object.entries(designTokens.colors.brand)
  .filter(([step]) => /^\d+$/.test(step))
  .map(([step, hex]) => ({ step, hex, name: "Coral brand" }));

const MINT_SCALE = [
  { step: "950", hex: "#052E27" },
  { step: "900", hex: "#104E42" },
  { step: "800", hex: "#115E4E" },
  { step: "700", hex: "#0F765F" },
  { step: "600", hex: "#0D9675" },
  { step: "500", hex: "#16B98F" },
  { step: "400", hex: "#34D6AE" },
  { step: "300", hex: "#6EE7C8" },
  { step: "200", hex: "#A7F3DD" },
  { step: "100", hex: "#D1FAED" },
  { step: "50", hex: "#ECFDF8" },
];

const NEUTRAL_SCALE = [
  { step: "1000", hex: "#0A0F0E", name: "Absolute Ink" },
  { step: "950", hex: "#171D1B", name: "Dark Neutral" },
  { step: "900", hex: "#2E3835", name: "Text Strong" },
  { step: "800", hex: "#35413E", name: "Body Text" },
  { step: "700", hex: "#40504C", name: "Body Subdued" },
  { step: "600", hex: "#50625D", name: "Muted Medium" },
  { step: "500", hex: "#667B75", name: "Muted Text" },
  { step: "400", hex: "#899E98", name: "Muted Soft" },
  { step: "300", hex: "#BBCAC6", name: "Hairline Strong" },
  { step: "200", hex: "#DCE5E2", name: "Hairline Border" },
  { step: "100", hex: "#EFF4F2", name: "Surface Soft" },
  { step: "50", hex: "#F7FAF9", name: "Light Canvas" },
];

const SEMANTIC_SWATCHES = [
  {
    name: "Success",
    hex: "#5DB872",
    soft: "#E8F8F0",
    role: "Verification & active confirmed states",
  },
  {
    name: "Warning",
    hex: "#D4A017",
    soft: "#FFF4DE",
    role: "Attention, pending actions, sold states",
  },
  {
    name: "Danger",
    hex: "#C64545",
    soft: "#FDECEF",
    role: "Destructive actions, failures, lost/damaged",
  },
  {
    name: "Emergency SOS",
    hex: "#C64545",
    soft: "#FDEBED",
    role: "Protected emergency actions & critical alerts",
  },
  {
    name: "Info / System",
    hex: "#2684FF",
    soft: "#EAF3FF",
    role: "Transit, distribution & system updates",
  },
  {
    name: "Supporting Teal",
    hex: "#5DB8A6",
    soft: "#D1FAED",
    role: "Active QR signal & verified badge",
  },
  {
    name: "Signal Cyan",
    hex: "#38BDF8",
    soft: "#E0F4FE",
    role: "Informational secondary signal",
  },
  {
    name: "Signal Amber",
    hex: "#F2B84B",
    soft: "#FFF4D6",
    role: "Selective editorial attention",
  },
];

const ICONS_BY_CATEGORY: { category: string; icons: VaahanIconName[] }[] = [
  {
    category: "Safety & Emergency",
    icons: [
      "shield",
      "emergency",
      "alert",
      "warning",
      "info",
      "success",
      "phone",
      "lock",
    ],
  },
  {
    category: "Vehicle & Hardware",
    icons: ["vehicle", "car", "bike", "truck", "fuel", "speedometer"],
  },
  {
    category: "QR System & Logistics",
    icons: ["qr", "qr-scan", "barcode", "package", "truck-delivery", "refresh"],
  },
  {
    category: "Commerce & Billing",
    icons: [
      "payment",
      "credit-card",
      "receipt",
      "shopping-cart",
      "currency-rupee",
    ],
  },
  {
    category: "Navigation & App Controls",
    icons: [
      "dashboard",
      "user",
      "users",
      "settings",
      "search",
      "mail",
      "arrow-left",
      "arrow-right",
      "sun",
      "moon",
    ],
  },
];

export default function DesignSystemPage() {
  const [selectedRadio, setSelectedRadio] = React.useState("fast");
  const [switchActive, setSwitchActive] = React.useState(true);
  const [checkboxChecked, setCheckboxChecked] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("brand");

  return (
    <AppShell
      appName="VaahanSafe Design System"
      appDescription="Pin-to-pin implementation of VaahanSafe Premium Safety System v1.0"
      actions={
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm">
            <a href="/" className="inline-flex items-center gap-2">
              <VaahanIcon name="arrow-left" size={16} />
              <span>Back to Portal</span>
            </a>
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Header Intro */}
        <div className="border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-3">
            <VaahanIcon name="shield" size={14} />
            <span>Editorial Zinc Canvas & Brand Motion System v1.0</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-serif">
            VaahanSafe Design System
          </h1>
          <p className="text-muted-foreground text-base max-w-3xl mt-3 leading-relaxed">
            Engineered on shadcn/ui accessibility foundations, canonical
            geometric SVG mark, choreographed story motion, and the modern
            zinc editorial color palette (#cc785c coral, crisp zinc canvas,
            zinc-950 dark ink).
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-6 h-auto p-1 bg-muted/60">
            <TabsTrigger value="brand">00. Brand & Motion</TabsTrigger>
            <TabsTrigger value="foundation">01. Colors & Tokens</TabsTrigger>
            <TabsTrigger value="typography">02. Typography & Form</TabsTrigger>
            <TabsTrigger value="primitives">03. UI Primitives</TabsTrigger>
            <TabsTrigger value="domain">04. QR & Domain States</TabsTrigger>
            <TabsTrigger value="emergency">05. Emergency Systems</TabsTrigger>
          </TabsList>

          {/* =========================================================================
              TAB 00: BRAND MARK, APP ICON & MOTION SYSTEM
             ========================================================================= */}
          <TabsContent value="brand">
            <BrandShowcase />
          </TabsContent>

          {/* =========================================================================
              TAB 01: FOUNDATION (Colors, Neutrals, Themes, Spacing, Radius, Shadows)
             ========================================================================= */}
          <TabsContent value="foundation" className="space-y-10">
            {/* Section 01: Brand Colors */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <span>01. Brand Colors (Deep Safety Teal)</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Primary trust anchor. Represents 20% of public surfaces, 15%
                  of customer app, and 10% of admin.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3">
                {BRAND_SCALE.map((item) => (
                  <div
                    key={item.step}
                    className="rounded-lg border border-border p-2.5 bg-card space-y-2"
                  >
                    <div
                      className="h-14 rounded-md w-full border border-black/5"
                      style={{ backgroundColor: item.hex }}
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-foreground">
                        {item.step}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {item.hex}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 02: Neutral Scale */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  02. Neutral Scale (Teal-Tinted Graphite)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Dominates 70%–90% of interfaces. Slightly tinted toward teal
                  rather than cold generic slate.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2.5">
                {NEUTRAL_SCALE.map((item) => (
                  <div
                    key={item.step}
                    className="rounded-lg border border-border p-2 bg-card space-y-1.5"
                  >
                    <div
                      className="h-12 rounded-md w-full border border-black/5"
                      style={{ backgroundColor: item.hex }}
                    />
                    <div className="text-[11px]">
                      <div className="font-semibold text-foreground">
                        {item.step}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground truncate">
                        {item.hex}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 03: Semantic Colors */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  03. Semantic Colors & Signals
                </h2>
                <p className="text-sm text-muted-foreground">
                  Signals communicate state and are always paired with a
                  Hugeicon and explicit text label.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SEMANTIC_SWATCHES.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl border border-border p-4 bg-card space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10"
                        style={{ backgroundColor: item.hex }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {item.name}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {item.hex}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.role}
                    </div>
                    <div
                      className="text-xs font-semibold px-2.5 py-1 rounded-md inline-block border"
                      style={{
                        backgroundColor: item.soft,
                        color: item.hex,
                        borderColor: `${item.hex}30`,
                      }}
                    >
                      Soft Variant ({item.soft})
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 04 & 05: Light & Dark Theme Previews */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                04 & 05. Light & Dark Surface Architecture
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Light Theme Surface */}
                <div className="p-6 rounded-2xl border border-[#DCE5E2] bg-[#F7FAF9] text-[#101817] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm uppercase tracking-wider text-[#0D4844]">
                      Light Theme Surface
                    </span>
                    <Badge
                      variant="outline"
                      className="border-[#DCE5E2] text-[#35413E]"
                    >
                      Canvas #F7FAF9
                    </Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#DCE5E2] space-y-2">
                    <div className="font-semibold text-sm text-[#101817]">
                      Elevated Card Surface (#FFFFFF)
                    </div>
                    <p className="text-xs text-[#667B75]">
                      High legibility body text (#35413E) on clean light surface
                      with subtle hairline border (#DCE5E2).
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="bg-[#0D4844] text-white hover:bg-[#105752]"
                      >
                        Primary Action
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#DCE5E2] text-[#101817]"
                      >
                        Secondary
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Dark Theme Surface */}
                <div className="p-6 rounded-2xl border border-[#20312D] bg-[#071211] text-[#EDF7F4] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm uppercase tracking-wider text-[#45C3B3]">
                      Dark Theme Surface
                    </span>
                    <Badge
                      variant="outline"
                      className="border-[#20312D] text-[#C6D8D3]"
                    >
                      Canvas #071211
                    </Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0C1917] border border-[#20312D] space-y-2">
                    <div className="font-semibold text-sm text-[#EDF7F4]">
                      Dark Surface (#0C1917)
                    </div>
                    <p className="text-xs text-[#91A7A1]">
                      Non-pitch-black dark canvas prevents harsh contrast
                      fatigue. Primary mint accent (#45C3B3).
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="bg-[#45C3B3] text-[#071211] hover:bg-[#34D6AE]"
                      >
                        Primary
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#20312D] text-[#EDF7F4] hover:bg-[#12211E]"
                      >
                        Secondary
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 06: Spacing & Section Scale */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                06. Spacing Scale
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {[
                  { name: "1 (4px)", width: "w-1" },
                  { name: "2 (8px)", width: "w-2" },
                  { name: "3 (12px)", width: "w-3" },
                  { name: "4 (16px)", width: "w-4" },
                  { name: "6 (24px)", width: "w-6" },
                  { name: "8 (32px)", width: "w-8" },
                  { name: "12 (48px)", width: "w-12" },
                ].map((s) => (
                  <div
                    key={s.name}
                    className="p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="text-xs font-semibold text-foreground mb-2">
                      {s.name}
                    </div>
                    <div className={`h-2 bg-primary rounded ${s.width}`} />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 07: Radius & Shadows */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                07 & 08. Radius & Elevation Shadows
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-md border border-border bg-card text-center shadow-xs">
                  <div className="text-xs font-semibold">
                    sm (6px) - shadow-xs
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Tags & compact controls
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card text-center shadow-sm">
                  <div className="text-xs font-semibold">
                    md (8px) - shadow-sm
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Buttons & standard inputs
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card text-center shadow-md">
                  <div className="text-xs font-semibold">
                    lg (12px) - shadow-md
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Standard cards & alerts
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card text-center shadow-lg">
                  <div className="text-xs font-semibold">
                    xl (16px) - shadow-lg
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Dialogs & feature sections
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          {/* =========================================================================
              TAB 02: TYPOGRAPHY & HUGEICONS
             ========================================================================= */}
          <TabsContent value="typography" className="space-y-10">
            {/* Section 09: Typography Scale */}
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  09. Typography Hierarchy (Geist + Geist Mono)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Display and titles use font weight 600. Technical identifiers,
                  QR codes, and timestamps use Geist Mono.
                </p>
              </div>

              <div className="space-y-6 rounded-xl border border-border p-6 bg-card">
                <div className="border-b border-border pb-4">
                  <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    display-lg • 56px • -0.04em
                  </div>
                  <div className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
                    Next-Gen Emergency Safety
                  </div>
                </div>

                <div className="border-b border-border pb-4">
                  <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    title-xl • 26px • -0.02em
                  </div>
                  <div className="text-2xl font-semibold tracking-tight text-foreground">
                    Instant Vehicle Identification & QR Linkage
                  </div>
                </div>

                <div className="border-b border-border pb-4">
                  <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    title-md • 18px • -0.01em
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    Verified Emergency Contacts & First Responder Access
                  </div>
                </div>

                <div className="border-b border-border pb-4">
                  <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    body-md • 16px • 1.6 line-height
                  </div>
                  <p className="text-base text-body text-muted-foreground leading-relaxed max-w-3xl">
                    VaahanSafe connects physical tamper-proof vehicle QR
                    stickers to instantaneous emergency alerts, allowing
                    bystanders and first responders to notify family members
                    while keeping personal phone numbers private.
                  </p>
                </div>

                <div>
                  <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    mono • 13px • Geist Mono
                  </div>
                  <div className="font-mono text-sm bg-muted/60 p-3 rounded-lg border border-border inline-block">
                    STICKER ID: VS-2026-DL01-9482 • BATCH: B-OCT-26 • HASH:
                    7d8f4c2a
                  </div>
                </div>
              </div>
            </section>

            {/* Section 10: Hugeicons Abstraction */}
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  10. Exclusive Hugeicons Abstraction (`&lt;VaahanIcon /&gt;`)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Rule 07 & 08 strictly enforced. No Lucide, Heroicons, or
                  ad-hoc SVGs. Accessible and inherit currentColor.
                </p>
              </div>

              <div className="space-y-6">
                {ICONS_BY_CATEGORY.map((cat) => (
                  <div key={cat.category} className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {cat.category}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {cat.icons.map((iconName) => (
                        <div
                          key={iconName}
                          className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card text-center gap-2 hover:border-primary/50 transition-colors"
                        >
                          <VaahanIcon
                            name={iconName}
                            size={22}
                            className="text-primary"
                          />
                          <span className="font-mono text-[11px] text-muted-foreground truncate w-full">
                            {iconName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>

          {/* =========================================================================
              TAB 03: UI PRIMITIVES (Buttons, Inputs, Badges, Cards, Modals, Forms)
             ========================================================================= */}
          <TabsContent value="primitives" className="space-y-10">
            {/* 11. Buttons */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  11. Buttons & Action Variants
                </h2>
                <p className="text-sm text-muted-foreground">
                  Default 44px touch height. Emergency SOS button uses protected
                  red (#C64545) with 48px minHeight.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="default">
                    <VaahanIcon name="shield" size={16} className="mr-2" />
                    Primary Teal (44px)
                  </Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost Action</Button>
                  <Button variant="signature">
                    <VaahanIcon name="qr" size={16} className="mr-2" />
                    Supporting Teal
                  </Button>
                  <Button variant="emergency" size="emergency">
                    <VaahanIcon name="emergency" size={18} className="mr-2" />
                    Emergency SOS (48px)
                  </Button>
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>
            </section>

            {/* 12 - 16: Form Controls (Input, Select, Checkbox, Radio, Switch) */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                12–16. Form Controls & Inputs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border border-border bg-card">
                {/* Inputs & Textarea */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="vehicle-reg">
                      Vehicle Registration Number
                    </Label>
                    <Input
                      id="vehicle-reg"
                      placeholder="e.g. DL 01 AB 1234"
                      className="h-11 font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emergency-note">
                      Medical / Emergency Note
                    </Label>
                    <Textarea
                      id="emergency-note"
                      placeholder="Blood group, essential allergies, emergency info..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fuel-type">
                      Select Fuel / Vehicle Type
                    </Label>
                    <Select defaultValue="petrol">
                      <SelectTrigger id="fuel-type" className="h-11">
                        <SelectValue placeholder="Choose type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">
                          Petrol (Standard ICE)
                        </SelectItem>
                        <SelectItem value="diesel">
                          Diesel (Commercial/SUV)
                        </SelectItem>
                        <SelectItem value="ev">
                          Electric Vehicle (EV Battery)
                        </SelectItem>
                        <SelectItem value="cng">CNG Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Toggles, Checkboxes, Radios */}
                <div className="space-y-6 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold">
                        Immediate WhatsApp Alert
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Receive instant dispatch upon QR scan
                      </div>
                    </div>
                    <Switch
                      checked={switchActive}
                      onCheckedChange={setSwitchActive}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={checkboxChecked}
                      onCheckedChange={(c) => setCheckboxChecked(!!c)}
                    />
                    <Label
                      htmlFor="terms"
                      className="text-xs font-normal text-muted-foreground"
                    >
                      I authorize emergency contact dispatch under the
                      VaahanSafe privacy charter.
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Notification Dispatch Priority
                    </Label>
                    <RadioGroup
                      value={selectedRadio}
                      onValueChange={setSelectedRadio}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fast" id="r1" />
                        <Label htmlFor="r1" className="text-sm">
                          High (SMS + Call)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="normal" id="r2" />
                        <Label htmlFor="r2" className="text-sm">
                          Standard (WhatsApp)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </section>

            {/* 17. Badges */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                17. Semantic Status Badges
              </h2>
              <div className="p-6 rounded-xl border border-border bg-card flex flex-wrap gap-3 items-center">
                <Badge variant="default">Primary Teal</Badge>
                <Badge variant="signature">Signature Verified</Badge>
                <Badge variant="success">Active / Operational</Badge>
                <Badge variant="warning">Pending Verification</Badge>
                <Badge variant="info">In Transit</Badge>
                <Badge variant="destructive">Suspended</Badge>
                <Badge variant="emergency">SOS Triggered</Badge>
                <Badge variant="outline">Unassigned</Badge>
              </div>
            </section>

            {/* 18. Cards (Standard, Metric, Feature, Dark) */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                18. Card Archetypes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Card */}
                <Card className="rounded-xl border border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase font-semibold">
                      Active QR Stickers
                    </CardDescription>
                    <CardTitle className="text-3xl font-semibold">
                      14,280
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <VaahanIcon
                        name="success"
                        size={14}
                        className="text-[#5DB872]"
                      />
                      <span>99.98% permanent resolution uptime</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Card */}
                <Card className="rounded-xl border border-border bg-card">
                  <CardHeader>
                    <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center mb-1">
                      <VaahanIcon name="qr" size={18} />
                    </div>
                    <CardTitle className="text-base font-semibold">
                      Smart QR Masking
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Protects phone numbers through encrypted cloud routing and
                      direct WhatsApp bridge.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Dark Product Card */}
                <div className="rounded-2xl border border-[#20312D] bg-[#0C1917] p-5 text-[#EDF7F4] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#45C3B3]">
                      HARDWARE QR
                    </span>
                    <Badge variant="signature" className="text-[10px]">
                      VERIFIED
                    </Badge>
                  </div>
                  <div className="font-semibold text-base">
                    Industrial 3M Vinyl Sticker
                  </div>
                  <p className="text-xs text-[#91A7A1]">
                    Weatherproof, UV-resistant, scratch-proof adhesive rated for
                    5+ years of Indian road conditions.
                  </p>
                </div>
              </div>
            </section>

            {/* 19 - 22: Alerts, Dialogs, Sheets, Tabs */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                19–22. Interactive Overlays & Modals
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border border-border bg-card">
                <div className="space-y-4">
                  <Alert className="border-border">
                    <VaahanIcon
                      name="info"
                      size={16}
                      className="text-primary"
                    />
                    <AlertTitle>System Configuration Notice</AlertTitle>
                    <AlertDescription className="text-xs">
                      All emergency dispatch routes are active via MSG91
                      WhatsApp fallback.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    {/* Real Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <VaahanIcon
                            name="settings"
                            size={14}
                            className="mr-2"
                          />
                          Open Test Dialog
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Emergency Contact Settings</DialogTitle>
                          <DialogDescription>
                            Configure primary contacts to be alerted in case of
                            an incident.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                          <Label htmlFor="contact-phone">
                            Primary Contact Mobile
                          </Label>
                          <Input
                            id="contact-phone"
                            defaultValue="+91 98765 43210"
                            className="font-mono"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="default">Save Contact</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Real Sheet */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="secondary" size="sm">
                          <VaahanIcon name="menu" size={14} className="mr-2" />
                          Open Drawer Sheet
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Admin Quick Drawer</SheetTitle>
                          <SheetDescription>
                            Responsive administrative navigation for mobile and
                            tablet viewports.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="py-6 space-y-3">
                          <div className="p-3 rounded-lg border border-border bg-muted/40 text-xs">
                            Navigation links and contextual quick filters land
                            here.
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                {/* Progress & Skeletons */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Activation Progress</span>
                      <span>Step 3 of 4 (75%)</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs text-muted-foreground">
                      Loading Skeleton State:
                    </div>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 23 - 24: Tables & Pagination */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                23–24. Data Table & Pagination
              </h2>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono text-xs">QR ID</TableHead>
                      <TableHead>Vehicle Model</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Lifecycle Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        id: "VS-8821",
                        model: "Tata Nexon EV",
                        reg: "DL 03 CA 9012",
                        status: "activated",
                      },
                      {
                        id: "VS-8822",
                        model: "Hyundai Creta",
                        reg: "HR 26 DQ 4410",
                        status: "sold",
                      },
                      {
                        id: "VS-8823",
                        model: "Royal Enfield 350",
                        reg: "MH 02 ER 8891",
                        status: "activated",
                      },
                    ].map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {row.id}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {row.model}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.reg}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === "activated" ? "success" : "warning"
                            }
                          >
                            {row.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <VaahanIcon name="chevron-right" size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Showing 1 to 3 of 1,280 entries
                  </span>
                  <Pagination className="w-auto m-0">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>
                          1
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext href="#" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </section>
          </TabsContent>

          {/* =========================================================================
              TAB 04: QR & DOMAIN STATES (QR Lifecycle, Payments, Connections, Errors)
             ========================================================================= */}
          <TabsContent value="domain" className="space-y-10">
            {/* 27. QR Lifecycle States */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  27. QR Sticker Lifecycle States
                </h2>
                <p className="text-sm text-muted-foreground">
                  Strict type states. Never use random saturated colors. Pair
                  Hugeicon with explicit label and semantic styling.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    state: "PRINTED",
                    icon: "barcode" as const,
                    variant: "outline" as const,
                    desc: "Factory printed in batch",
                  },
                  {
                    state: "IN_TRANSIT_DISTRIBUTOR",
                    icon: "truck-delivery" as const,
                    variant: "info" as const,
                    desc: "Dispatched to regional hub",
                  },
                  {
                    state: "WITH_DISTRIBUTOR",
                    icon: "package" as const,
                    variant: "info" as const,
                    desc: "Stocked at warehouse",
                  },
                  {
                    state: "WITH_RETAILER",
                    icon: "shopping-cart" as const,
                    variant: "info" as const,
                    desc: "Available at retail outlet",
                  },
                  {
                    state: "SOLD",
                    icon: "receipt" as const,
                    variant: "warning" as const,
                    desc: "Sold, awaiting customer scratch activation",
                  },
                  {
                    state: "ACTIVATED",
                    icon: "success" as const,
                    variant: "success" as const,
                    desc: "Permanently bound to emergency profile",
                  },
                  {
                    state: "EXPIRED_UNSOLD",
                    icon: "alert" as const,
                    variant: "secondary" as const,
                    desc: "Recalled unsold inventory",
                  },
                  {
                    state: "LOST_DAMAGED",
                    icon: "warning" as const,
                    variant: "destructive" as const,
                    desc: "Reported damaged or stolen",
                  },
                  {
                    state: "REPLACED",
                    icon: "refresh" as const,
                    variant: "secondary" as const,
                    desc: "Profile transferred to replacement sticker",
                  },
                ].map((item) => (
                  <div
                    key={item.state}
                    className="p-3.5 rounded-xl border border-border bg-card flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <VaahanIcon name={item.icon} size={18} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {item.state}
                        </span>
                        <Badge
                          variant={item.variant}
                          className="text-[10px] py-0"
                        >
                          {item.variant.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 28. Payment States */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  28. Authoritative Payment States (Razorpay)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Never mark a payment successful on frontend redirect alone.
                  Distinguish pending verification from settled payment.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  {
                    state: "CREATED",
                    color: "text-muted-foreground",
                    badge: "outline" as const,
                  },
                  {
                    state: "PENDING",
                    color: "text-[#D4A017]",
                    badge: "warning" as const,
                  },
                  {
                    state: "PROCESSING",
                    color: "text-[#2684FF]",
                    badge: "info" as const,
                  },
                  {
                    state: "PAID",
                    color: "text-[#5DB872]",
                    badge: "success" as const,
                  },
                  {
                    state: "FAILED",
                    color: "text-[#C64545]",
                    badge: "destructive" as const,
                  },
                  {
                    state: "REFUNDED",
                    color: "text-muted-foreground",
                    badge: "secondary" as const,
                  },
                  {
                    state: "PARTIAL_REFUND",
                    color: "text-[#D4A017]",
                    badge: "warning" as const,
                  },
                ].map((p) => (
                  <div
                    key={p.state}
                    className="p-3 rounded-lg border border-border bg-card text-center space-y-1.5"
                  >
                    <div
                      className={`font-mono text-xs font-semibold ${p.color}`}
                    >
                      {p.state}
                    </div>
                    <Badge variant={p.badge} className="text-[10px]">
                      {p.badge}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* 29. Connection States */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                29. Connection Status Component
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Online State:
                  </div>
                  <ConnectionStatus status="online" />
                </div>
                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Degraded Latency:
                  </div>
                  <ConnectionStatus status="degraded" />
                </div>
                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Network Offline:
                  </div>
                  <ConnectionStatus status="offline" />
                </div>
              </div>
            </section>

            {/* 30. System Error States */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                30. System State Error Archetypes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <SystemState
                    code="404"
                    title="Vehicle Profile Not Found"
                    description="This QR code has either not been registered or the vehicle identification link is inactive."
                    actionHref="/"
                    actionText="Return to Portal"
                  />
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <SystemState
                    code="500"
                    title="Encrypted Lookup Failure"
                    description="An internal server condition occurred while accessing the Cloudflare D1 persistent partition."
                    correlationId="ERR/VS-9012-TX4"
                    actionHref="/"
                    actionText="Retry Resolver"
                  />
                </div>
              </div>
            </section>
          </TabsContent>

          {/* =========================================================================
              TAB 05: EMERGENCY SYSTEMS (Protected SOS, Vehicle Profile, Contrast)
             ========================================================================= */}
          <TabsContent value="emergency" className="space-y-10">
            {/* 31. Emergency Components */}
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C64545] animate-pulse" />
                  <span>
                    31. Protected Emergency Surface & Profile Components
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Emergency Red (#C64545) is protected and never decorative.
                  Emergency actions must have large touch targets (52px+), high
                  contrast, zero modal friction, and immediate phone dialers for
                  emergency bystanders.
                </p>
              </div>

              {/* Real Emergency Resolver Card Mockup */}
              <div className="max-w-xl mx-auto rounded-2xl border-2 border-[#DCE5E2] bg-white p-6 text-[#101817] shadow-md space-y-6">
                {/* Emergency Top Banner */}
                <div className="flex items-center justify-between border-b border-[#DCE5E2] pb-4">
                  <div className="flex items-center gap-2">
                    <VaahanIcon
                      name="shield"
                      size={24}
                      className="text-[#0D4844]"
                    />
                    <div>
                      <div className="font-bold text-sm text-[#0D4844]">
                        VAHANSAFE EMERGENCY RESOLVER
                      </div>
                      <div className="font-mono text-xs text-[#667B75]">
                        QR: VS-2026-DL-9821
                      </div>
                    </div>
                  </div>
                  <Badge variant="signature" className="text-xs">
                    VERIFIED VEHICLE
                  </Badge>
                </div>

                {/* Vehicle Quick Identity */}
                <div className="bg-[#EFF4F2] p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-semibold text-[#667B75] uppercase">
                        Registered Vehicle
                      </div>
                      <div className="text-lg font-bold text-[#101817]">
                        Tata Safari (Dark Edition)
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-white border border-[#DCE5E2] text-[#101817]">
                      DL 01 AB 9021
                    </span>
                  </div>
                  <div className="text-xs text-[#667B75]">
                    Fuel: Diesel • Color: Oberon Black • Parking Facility: Tower
                    B
                  </div>
                </div>

                {/* Critical SOS Actions */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#35413E]">
                    Immediate Emergency Contact Actions
                  </div>

                  {/* Primary 52px Touch Target Emergency Action */}
                  <Button
                    variant="emergency"
                    size="emergency"
                    className="w-full text-base font-bold shadow-md flex items-center justify-center gap-2"
                  >
                    <VaahanIcon name="phone" size={20} />
                    <span>Call Emergency Contact (Masked)</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full h-12 text-sm font-semibold border-[#DCE5E2] flex items-center justify-center gap-2 text-[#0D4844]"
                  >
                    <VaahanIcon name="mail" size={18} />
                    <span>Notify Owner: Vehicle Wrongly Parked / Issue</span>
                  </Button>
                </div>

                {/* Privacy & Safety Note */}
                <div className="p-3 rounded-lg bg-[#F7FAF9] border border-[#DCE5E2] text-[11px] text-[#667B75] flex items-start gap-2">
                  <VaahanIcon
                    name="lock"
                    size={14}
                    className="mt-0.5 text-[#0D4844] flex-shrink-0"
                  />
                  <span>
                    Phone numbers are protected through secure VaahanSafe relay.
                    Callers and owners never see each other&apos;s personal
                    mobile numbers.
                  </span>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
