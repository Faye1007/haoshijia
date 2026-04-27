import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-zinc-950 text-white shadow-[0_10px_26px_rgba(24,24,27,0.22)] hover:-translate-y-0.5 hover:bg-zinc-800",
        destructive: "bg-red-500 text-white shadow-[0_10px_24px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 hover:bg-red-600",
        outline: "border border-zinc-300 bg-white text-zinc-950 shadow-sm hover:-translate-y-0.5 hover:border-zinc-950 hover:bg-lime-50",
        secondary: "bg-lime-100 text-lime-950 hover:bg-lime-200",
        ghost: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
        link: "text-zinc-950 underline-offset-4 hover:text-red-600 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
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
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
