"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingChildren?: ReactNode;
};

export function PendingSubmitButton({
  children,
  pendingChildren,
  disabled,
  type = "submit",
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {pending ? (
        pendingChildren ?? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Lagrer...
          </>
        )
      ) : (
        children
      )}
    </button>
  );
}
