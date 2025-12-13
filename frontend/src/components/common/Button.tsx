import * as React from "react";

import { Button as UiButton } from "@/components/ui/button";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className,
  ...props
}) => {
  const mappedVariant: React.ComponentProps<typeof UiButton>["variant"] =
    variant === "primary"
      ? "default"
      : variant === "secondary"
        ? "secondary"
        : "outline";
  const mappedSize: React.ComponentProps<typeof UiButton>["size"] =
    size === "md" ? "default" : size;

  return (
    <UiButton
      variant={mappedVariant}
      size={mappedSize}
      className={className}
      {...props}
    />
  );
};
