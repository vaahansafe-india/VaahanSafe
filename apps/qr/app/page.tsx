import React from "react";
import type { Metadata } from "next";
import { LandingExperience } from "../components/landing/LandingExperience";

export const metadata: Metadata = {
  title: "VaahanSafe QR — Premium Camera Scanner & Vehicle Safety Identity",
  description:
    "Scan a VaahanSafe vehicle QR with your camera or resolve safety passes securely without exposing private account data.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function QrLandingPage() {
  return <LandingExperience />;
}
