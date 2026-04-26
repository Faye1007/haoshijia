import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-[0_10px_28px_rgba(14,165,233,0.24)] hover:from-sky-700 hover:to-cyan-600",
        destructive: "bg-red-500 text-white shadow-[0_10px_24px_rgba(239,68,68,0.18)] hover:bg-red-600",
        outline: "border border-sky-200/80 bg-white/70 text-sky-900 shadow-sm backdrop-blur hover:bg-sky-50 hover:text-sky-950",
        secondary: "bg-cyan-50/90 text-cyan-900 hover:bg-cyan-100",
        ghost: "text-slate-700 hover:bg-sky-100/70 hover:text-sky-900",
        link: "text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline",
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
