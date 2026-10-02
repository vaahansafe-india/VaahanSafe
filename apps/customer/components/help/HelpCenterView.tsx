"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Package,
  QrCode,
  CreditCard,
  RefreshCw,
  ShieldAlert,
  PhoneCall,
  Mail,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Truck,
  CheckCircle2,
  FileText,
  Sparkles,
} from "@/components/ui/icons";
import { VaahanIcon } from "@vaahansafe/icons";

interface FaqItem {
  id: string;
  category: "orders" | "qr" | "payments" | "replacement" | "privacy";
  question: string;
  answer: string;
  actionLabel?: string;
  actionHref?: string;
}

const FAQ_DATABASE: FaqItem[] = [
  {
    id: "order-timeline",
    category: "orders",
    question: "When will my physical QR sticker kit be delivered?",
    answer:
      "All online orders are manufactured and dispatched within 24 hours from our security facility. We partner with Tier-1 logistics couriers (Blue Dart & Delhivery) with tracked pan-India delivery arriving in 2 to 4 business days. You can track real-time transit milestones under your Orders hub.",
    actionLabel: "Track My Order",
    actionHref: "/orders",
  },
  {
    id: "order-digital-access",
    category: "orders",
    question: "Can I use my Digital QR Pass while waiting for the physical sticker?",
    answer:
      "Yes! Your vehicle's cryptographic identity and Digital QR Pass are activated immediately upon payment confirmation. You can access your scannable pass, download an A4 vector placard for your dashboard, or add it to your digital wallet right now.",
    actionLabel: "View Digital Pass",
    actionHref: "/qr/digital",
  },
  {
    id: "qr-placement",
    category: "qr",
    question: "Where should I stick the physical VaahanSafe QR code on my vehicle?",
    answer:
      "For four-wheelers, apply the UV-laminated sticker on the bottom-left or bottom-right corner of the front windshield (passenger side is recommended so it does not obstruct the driver's view). For two-wheelers, place it on the front cowl or visor. Ensure the surface is wiped clean and dry before applying.",
  },
  {
    id: "qr-weatherproof",
    category: "qr",
    question: "Are the physical stickers resistant to rain, car washes, and harsh sun?",
    answer:
      "Yes, absolutely. VaahanSafe hardware stickers are printed on industrial-grade 3M vinyl with high-micron UV-cured matte lamination. They are 100% weatherproof, fade-resistant, pressure-wash safe, and designed to endure temperatures up to 85°C.",
  },
  {
    id: "privacy-number-shield",
    category: "privacy",
    question: "Will scanning my vehicle QR expose my personal mobile number?",
    answer:
      "Never. Privacy is the core tenet of VaahanSafe. When a passerby or first responder scans your QR code, they only see your verified vehicle identity and safety card. Phone calls and WhatsApp emergency relays route through our private cloud proxy without ever revealing your personal phone number.",
    actionLabel: "Configure Safety Profile",
    actionHref: "/emergency-contacts",
  },
  {
    id: "privacy-golden-hour",
    category: "privacy",
    question: "How does the Golden Hour emergency alert system work?",
    answer:
      "When someone taps 'Emergency / Accident' on your vehicle's public scan view, our automated notification pipeline instantly dispatches critical SMS & WhatsApp alerts to all your configured priority contacts with the vehicle plate and incident location timestamp.",
    actionLabel: "Manage Emergency Contacts",
    actionHref: "/emergency-contacts",
  },
  {
    id: "payment-pending",
    category: "payments",
    question: "Money was debited from my bank, but my order shows pending. What should I do?",
    answer:
      "Razorpay webhook reconciliation typically settles within 15 to 30 seconds. If your network dropped during the redirect, open your order in the Orders tab and our system will authoritatively verify the transaction with the payment gateway.",
    actionLabel: "Check Order Status",
    actionHref: "/orders",
  },
  {
    id: "payment-invoice",
    category: "payments",
    question: "Can I get a tax invoice with GST breakdown for my purchase?",
    answer:
      "Yes. Once an order is paid, open the order details in your Orders tab and click 'Receipt' to view or download your official digital receipt with complete GST breakdown and transaction reference numbers.",
    actionLabel: "View Order Receipts",
    actionHref: "/orders",
  },
  {
    id: "replacement-damaged",
    category: "replacement",
    question: "My windshield cracked or my QR sticker got damaged. How do I get a new one?",
    answer:
      "You can request a replacement hardware kit under our Warranty Continuity Protection program. Submit a replacement request from your QR hub, and our team will dispatch a new sticker paired directly to your vehicle profile while safely retiring the old QR identifier.",
    actionLabel: "Request Replacement Sticker",
    actionHref: "/qr/replace",
  },
];

interface HelpCenterViewProps {
  userEmail?: string;
  userName?: string;
}

export function HelpCenterView({ userEmail, userName }: HelpCenterViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [openFaqId, setOpenFaqId] = React.useState<string | null>("order-timeline");

  const categories = [
    { id: "all", label: "All Topics", icon: HelpCircle },
    { id: "orders", label: "Orders & Shipping", icon: Package },
    { id: "qr", label: "QR Hardware & Scans", icon: QrCode },
    { id: "privacy", label: "Privacy & Emergency", icon: ShieldAlert },
    { id: "payments", label: "Payments & Invoices", icon: CreditCard },
    { id: "replacement", label: "Sticker Replacement", icon: RefreshCw },
  ];

  const filteredFaqs = FAQ_DATABASE.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 space-y-8 pb-16">
      {/* Top Breadcrumb */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
      >
        <VaahanIcon name="arrow-left" size={13} aria-hidden="true" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-b from-card to-background p-6 sm:p-10 shadow-sm">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-[#cc785c]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#cc785c]/30 bg-[#cc785c]/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#cc785c]">
            <Sparkles className="size-3 text-[#cc785c]" />
            <span>Customer Assistance &amp; Help Center</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground">
            How can we assist you today{userName ? `, ${userName}` : ""}?
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Find answers regarding order fulfillment, courier delivery, QR sticker application, privacy calling shields, and hardware warranty replacements.
          </p>

          {/* Interactive Search Bar */}
          <div className="pt-3">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, shipping, sticker placement, payments..."
                className="h-12 w-full rounded-2xl border border-border bg-background/80 backdrop-blur-md pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#cc785c] focus:outline-hidden focus:ring-2 focus:ring-[#cc785c]/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/orders"
          className="group rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-[#cc785c]/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#cc785c]">
              <Truck className="size-5" />
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#cc785c]" />
          </div>
          <div className="mt-4 font-serif text-base font-medium text-foreground">
            Track Orders
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Courier tracking, shipping address, and delivery milestones.
          </p>
        </Link>

        <Link
          href="/qr/digital"
          className="group rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-[#cc785c]/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <QrCode className="size-5" />
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#cc785c]" />
          </div>
          <div className="mt-4 font-serif text-base font-medium text-foreground">
            Digital QR Pass
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Instant wallet pass and printable emergency placard.
          </p>
        </Link>

        <Link
          href="/qr/replace"
          className="group rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-[#cc785c]/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <RefreshCw className="size-5" />
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#cc785c]" />
          </div>
          <div className="mt-4 font-serif text-base font-medium text-foreground">
            Replace Hardware
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Request a replacement for lost or damaged windshield stickers.
          </p>
        </Link>

        <Link
          href="/emergency-contacts"
          className="group rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-[#cc785c]/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <ShieldAlert className="size-5" />
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#cc785c]" />
          </div>
          <div className="mt-4 font-serif text-base font-medium text-foreground">
            Emergency Network
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure priority contacts for instant SMS & WhatsApp alerts.
          </p>
        </Link>
      </div>

      {/* Main Support Knowledgebase & FAQs */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#cc785c]">
              KNOWLEDGE BASE &bull; FAQ
            </div>
            <h2 className="mt-1 font-serif text-2xl font-medium text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select a category or browse verified answers curated by the VaahanSafe operations team.
            </p>
          </div>

          <div className="font-mono text-xs text-muted-foreground">
            Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? "article" : "articles"}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 font-mono text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-[#cc785c] text-white shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="divide-y divide-border/80">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="flex w-full items-center justify-between gap-4 text-left transition-colors group"
                  >
                    <span className="font-serif text-base sm:text-lg font-medium text-foreground group-hover:text-[#cc785c] transition-colors">
                      {faq.question}
                    </span>
                    <div
                      className={`flex size-7 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[#cc785c] border-[#cc785c]/40" : ""
                      }`}
                    >
                      <ChevronDown className="size-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-3 space-y-3 pr-6 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in-50 duration-200">
                      <p>{faq.answer}</p>
                      {faq.actionHref && faq.actionLabel && (
                        <div>
                          <Link
                            href={faq.actionHref}
                            className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#cc785c] hover:underline"
                          >
                            <span>{faq.actionLabel}</span>
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center space-y-3">
              <HelpCircle className="size-8 text-muted-foreground/60 mx-auto" />
              <div className="font-serif text-base text-foreground">
                No matching answers found
              </div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                We couldn&apos;t find an article matching &quot;{searchQuery}&quot;. Please try a different search or contact our support desk directly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="font-mono text-xs font-semibold text-[#cc785c] hover:underline"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Direct Contact Support Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email Support Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#cc785c]/10 text-[#cc785c]">
              <Mail className="size-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-foreground">
                Email Support Team
              </h3>
              <p className="text-xs text-muted-foreground">
                Dedicated help with order tracking, billing, and sticker activation.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Send an email directly from your registered account ({userEmail || "your email"}). Our operations desk replies within 2 hours on business days.
          </p>

          <a
            href="mailto:support@vaahansafe.com?subject=VaahanSafe%20Customer%20Support%20Request"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#cc785c] hover:bg-[#b5654b] px-4 font-mono text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <Mail className="size-3.5" />
            <span>support@vaahansafe.com</span>
          </a>
        </div>

        {/* WhatsApp & Live System Health */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <PhoneCall className="size-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-foreground">
                Emergency &amp; WhatsApp Desk
              </h3>
              <p className="text-xs text-muted-foreground">
                Critical safety issues, scan anomalies, and urgent assistance.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Need urgent assistance regarding a vehicle incident or emergency relay failure? Connect directly to our automated WhatsApp priority dispatch desk.
          </p>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/919999999999?text=Hello%20VaahanSafe%20Support"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted px-4 font-mono text-xs font-semibold text-foreground transition-colors shadow-xs"
            >
              <span>Connect on WhatsApp</span>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </a>

            <Link
              href="http://localhost:3002"
              target="_blank"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted px-3.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="View Real-Time System Status"
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>System Status</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
