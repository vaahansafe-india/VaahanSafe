import type * as React from "react";

export type IdentityAvatarSize = "xs" | "sm" | "md" | "lg" | "profile";

export interface GlyphSeed {
  hash: number;
  fingerprint: string;       // e.g. "VS-7C21" for technical safety badge
  family: number;            // 0 - 7 safety geometry families
  rotation: 0 | 90 | 180 | 270;
  mirrorX: boolean;
  mirrorY: boolean;
  segmentMask: number;       // bitmask for active sub-rails
  nodePosition: number;      // 0 - 3 (which terminal has the verification node)
  hasAuxRail: boolean;       // secondary structural construction segment
  isVerified?: boolean;
}

export interface IdentityGlyphProps extends React.SVGProps<SVGSVGElement> {
  seed: string;
  name?: string;
  size?: IdentityAvatarSize;
  isVerified?: boolean;
  className?: string;
  showFingerprint?: boolean;
}

export interface IdentityAvatarProps {
  seed: string;
  name?: string;
  src?: string | null;
  size?: IdentityAvatarSize;
  isVerified?: boolean;
  className?: string;
  showFingerprint?: boolean;
}
