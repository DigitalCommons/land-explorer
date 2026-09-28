import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const switchVariants = cva(
  "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-disabled:cursor-not-allowed data-disabled:opacity-50",
  {
    // `size` is declared first so `variant` wins where the two set the same utility
    variants: {
      size: {
        default: "h-[18.4px] w-[32px]",
        sm: "h-[14px] w-[24px]",
      },
      variant: {
        default:
          "data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80",
        // Mirrors the legacy ToggleSwitch: grey track that never changes, thumb goes green
        legacy: "box-border h-[14px] w-[25px] bg-muted-foreground px-[2px]",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full ring-0 transition-transform data-unchecked:translate-x-0",
  {
    variants: {
      size: {
        default: "size-4",
        sm: "size-3",
      },
      variant: {
        default:
          "bg-background data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground",
        // $buttonGreen (#2ecc71) is not --primary (#27ae60), so it stays a literal here
        legacy:
          "size-[10px] bg-white duration-[400ms] data-checked:translate-x-[9px] data-checked:bg-[#2ecc71]",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

function Switch({
  className,
  size = "default",
  variant = "default",
  ...props
}: SwitchPrimitive.Root.Props & VariantProps<typeof switchVariants>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-variant={variant}
      className={cn(switchVariants({ size, variant }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(switchThumbVariants({ size, variant }))}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
