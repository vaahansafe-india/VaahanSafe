"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { VaahanIcon } from "@vaahansafe/icons";
import { cn } from "../lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-lg border-2 border-border bg-background shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#cc785c]/60 data-[state=checked]:border-[#cc785c] data-[state=checked]:bg-[#cc785c] data-[state=checked]:text-white data-[state=checked]:shadow-sm data-[state=checked]:shadow-[#cc785c]/25",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current animate-in zoom-in-75 duration-150")}
    >
      <VaahanIcon name="check" size={13} className="text-white stroke-[2.5]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
