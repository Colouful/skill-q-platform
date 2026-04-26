import type React from "react";
import { Button } from "@/components/ui/button";

export function ConfirmAction({
  label,
  message,
  onConfirm,
  variant = "outline",
}: {
  label: string;
  message: string;
  onConfirm: () => void;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
    >
      {label}
    </Button>
  );
}
