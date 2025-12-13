import * as React from "react";

import { Card as UiCard } from "@/components/ui/card";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return <UiCard className={className} {...props} />;
};
