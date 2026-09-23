import type * as React from "react";

export type IdentityAvatarSize = "xs" | "sm" | "md" | "lg" | "profile";
export type IdentityAvatarVariant = "aura" | "marble" | "shield";

export interface ColorBlob {
  cx: number;
  cy: number;
  r: number;
  color: string;
}

export interface AvatarSeedData {
  hash: number;
  fingerprint: string;
  initials: string;
  palette: [string, string, string, string]; // [base, accent1, accent2, accent3]
  blobs: ColorBlob[];
  isVerified: boolean;
}

export interface IdentityAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  seed: string;
  name?: string;
  src?: string | null;
  size?: IdentityAvatarSize;
  variant?: IdentityAvatarVariant;
  isVerified?: boolean;
  className?: string;
  showFingerprint?: boolean;
}
