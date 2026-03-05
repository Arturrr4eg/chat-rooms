import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils.ts";
import { buttonVariants } from "@/shared/ui/ButtonVariants.ts";

type ButtonBaseProps = React.ComponentPropsWithoutRef<"button">;

export interface ButtonProps
  extends ButtonBaseProps,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button(props: ButtonProps) {
  const { className, variant, size, asChild = false, ...rest } = props;

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...rest}
    />
  );
}