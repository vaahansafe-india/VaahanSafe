import React from "react";
import type { Metadata } from "next";
import { LandingExperience } from "../components/landing/LandingExperience";

export const metadata: Metadata = {
  title: "VaahanSafe QR — Vehicle Safety Identity",
  description:
    "Scan a VaahanSafe vehicle QR with your camera or resolve safety passes securely without exposing private account data.",
  keywords: [
    "VaahanSafe QR",
    "vehicle safety QR",
    "emergency vehicle QR",
    "car QR sticker India",
    "bike emergency QR",
    "smart vehicle identity",
    "scan vehicle QR",
    "privacy vehicle contact",
  ],
  alternates: {
    canonical: "https://qr.vaahansafe.com",
  },
  openGraph: {
    title: "VaahanSafe QR — Vehicle Safety Identity Platform",
    description:
      "A physical QR connects your vehicle to an owner-controlled safety view and available contact options.",
    url: "https://qr.vaahansafe.com",
    siteName: "VaahanSafe QR",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/qr-sticker-anatomy.webp",
        width: 896,
        height: 1200,
        alt: "VaahanSafe Physical QR Vehicle Safety Sticker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VaahanSafe QR — Vehicle Safety Identity Platform",
    description:
      "A physical QR connects your vehicle to an owner-controlled safety view and available contact options.",
    images: ["/images/qr-sticker-anatomy.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function QrLandingPage() {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do I need an account to scan a QR?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. You can open an enabled public safety view in your phone browser. An account and verified mobile are required to activate or manage your own sticker.",
        },
      },
      {
        "@type": "Question",
        name: "What if my camera cannot scan the sticker?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Enter the VaahanSafe ID printed on the sticker in the field above. You can also choose a photo in the scanner if your browser supports image decoding.",
        },
      },
      {
        "@type": "Question",
        name: "Which details are visible to a passerby?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Only the safety details the owner has approved for sharing, such as vehicle information, enabled emergency contacts and optional safety notes. Private account and billing details are excluded.",
        },
      },
      {
        "@type": "Question",
        name: "Does a scan activate my sticker?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Activation requires a verified owner, valid activation proof and a connection to an eligible vehicle. A public QR link is separate from the private activation proof.",
        },
      },
      {
        "@type": "Question",
        name: "Why might a QR be unavailable?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It may need activation, have been replaced, or have its service disabled. Follow the next step shown on the QR page. If the service cannot be reached, try again.",
        },
      },
      {
        "@type": "Question",
        name: "Does VaahanSafe replace emergency services?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. VaahanSafe helps people find approved safety information and contacts. For an immediate emergency in India, contact the official emergency services on 112 / 108.",
        },
      },
    ],
  };

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "VaahanSafe QR Safety Resolver",
    url: "https://qr.vaahansafe.com",
    applicationCategory: "UtilityApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript and HTML5 camera support",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    publisher: {
      "@type": "Organization",
      name: "VaahanSafe",
      url: "https://vaahansafe.com",
      logo: "https://vaahansafe.com/icon.svg",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData),
        }}
      />
      <LandingExperience />
    </>
  );
}
