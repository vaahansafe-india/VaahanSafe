"use client";
import { forwardRef } from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const VaultIconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "children"> & {
    icon: VaahanIconName;
    label: string;
    portalContainer?: HTMLElement | null;
  }
>(({ icon, label, className = "", portalContainer, ...props }, ref) => (
  <TooltipProvider delayDuration={250}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          size="icon"
          {...props}
          aria-label={label}
          className={`size-11 shrink-0 ${className}`}
        >
          <VaahanIcon name={icon} size={18} aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipPortal container={portalContainer}>
        <TooltipContent>{label}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  </TooltipProvider>
));
VaultIconButton.displayName = "VaultIconButton";
