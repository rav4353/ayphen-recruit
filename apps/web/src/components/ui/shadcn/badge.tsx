import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-primary-600 text-white shadow hover:bg-primary-700",
        default:
          "border-transparent bg-primary-600 text-white shadow hover:bg-primary-700",
        secondary:
          "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700",
        danger:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-700",
        error:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-700",
        destructive:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-700",
        outline: 
          "text-neutral-950 dark:text-neutral-50",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  customColor?: { bg: string; text: string }
}

function Badge({ className, variant, customColor, style, ...props }: BadgeProps) {
  const customStyles = customColor
    ? { backgroundColor: customColor.bg, color: customColor.text, ...style }
    : style

  return (
    <div 
      className={cn(badgeVariants({ variant: customColor ? undefined : variant }), className)} 
      style={customStyles}
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
