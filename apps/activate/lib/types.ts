import type { QrLifecycleState, Vehicle } from "@vaahansafe/types";

export type ActivationStage =
  | "RECOGNIZE"
  | "VERIFY"
  | "IDENTITY"
  | "VEHICLE"
  | "REVIEW"
  | "ACTIVE";

export type QrEligibilityStatus =
  | "ELIGIBLE"
  | "ALREADY_ACTIVATED"
  | "ALREADY_ACTIVATED_BY_YOU"
  | "REPLACED"
  | "UNAVAILABLE"
  | "EXPIRED"
  | "INVALID";

export interface RecognizeResultDto {
  status: QrEligibilityStatus;
  publicId?: string;
  visibleCode?: string;
  message?: string;
  vehicleDisplay?: string;
}

export interface VerifyProofResultDto {
  success: boolean;
  error?: string;
  isLocked?: boolean;
  lockedUntil?: string;
  expiresAt?: string;
}

export interface ActivationSessionUserDto {
  id: string;
  name: string | null;
  phone: string | null;
  phoneVerified: boolean;
  email: string | null;
  maskedPhone: string | null;
  displayName?: string | null;
}

export interface ActivationSessionChallengeDto {
  valid: boolean;
  publicId: string;
  visibleCode: string;
  expiresAt: string;
}

export interface ActivationSessionDto {
  stage: ActivationStage;
  challenge: ActivationSessionChallengeDto | null;
  user: ActivationSessionUserDto | null;
  selectedVehicleId?: string | null;
  eligibleVehiclesCount: number;
}

export interface EligibleVehicleDto {
  id: string;
  registrationNumber: string;
  maskedRegistration: string;
  make: string;
  model: string;
  vehicleType: Vehicle["type"];
  primaryColor?: string;
  hasActiveQr: boolean;
}

export interface ActivationCommitResultDto {
  success: boolean;
  publicId?: string;
  visibleCode?: string;
  vehicleReference?: string;
  activatedAt?: string;
  error?: string;
}
