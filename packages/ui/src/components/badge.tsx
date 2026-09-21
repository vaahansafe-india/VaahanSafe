import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-[#FDECEF] text-[#DC3F4F] dark:bg-[#DC3F4F]/20 dark:text-[#F05A68]",
        emergency:
          "border-transparent bg-emergency-soft text-emergency dark:text-[#efb8b8] font-bold",
        outline: "border-border text-foreground",
        success:
          "border-transparent bg-[#E8F8F0] text-[#16A36A] dark:bg-[#16A36A]/20 dark:text-[#34D6AE]",
        warning:
          "border-transparent bg-[#FFF4DE] text-[#D98B16] dark:bg-[#D98B16]/20 dark:text-[#F2B84B]",
        info: "border-transparent bg-[#EAF3FF] text-[#2684FF] dark:bg-[#2684FF]/20 dark:text-[#70B1FF]",
        signature:
          "border-transparent bg-[#D1FAED] text-[#0D4844] dark:bg-[#16B98F]/20 dark:text-[#34D6AE]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
