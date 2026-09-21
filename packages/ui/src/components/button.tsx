import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-brand-800 active:bg-brand-950",
        secondary:
          "bg-card text-foreground border border-border shadow-xs hover:bg-muted/60",
        outline:
          "border border-border bg-transparent shadow-xs hover:bg-muted/50 hover:text-foreground",
        ghost: "hover:bg-muted/60 hover:text-foreground active:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        emergency:
          "bg-emergency text-on-emergency font-semibold shadow-sm hover:bg-emergency-hover active:bg-emergency-hover min-h-[48px]",
        success:
          "bg-[#16A36A] text-white shadow-sm hover:bg-[#118153] active:bg-[#0D623F]",
        warning:
          "bg-[#D98B16] text-white shadow-sm hover:bg-[#B4700E] active:bg-[#8F5708]",
        signature:
          "bg-signature text-foreground font-semibold shadow-sm hover:bg-brand-800",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2", // 44px height per design-context
        sm: "h-9 rounded-md px-3.5 text-xs",
        lg: "h-12 rounded-md px-6 text-base",
        emergency: "min-h-[48px] px-6 text-base font-semibold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
