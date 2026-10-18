import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TargetButtonProps extends ButtonProps {
  cursorLabel?: string;
}

export const TargetButton = React.forwardRef<HTMLButtonElement, TargetButtonProps>(
  ({ className, cursorLabel, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("cursor-target", className)}
        data-cursor-label={cursorLabel}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

TargetButton.displayName = "TargetButton";
