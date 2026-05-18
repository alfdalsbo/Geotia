import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Geotia Riksprotokollen-knapper.
 *
 * Tre primær-varianter:
 *   - wax    — rød voks-segl-knapp (primær handling). Har en gull
 *              voks-dråpe foran teksten via ::before.
 *   - brass  — messing-knapp (sekundær gul).
 *   - quiet  — pergament-knapp (tertiær).
 *
 * To størrelser:
 *   - default
 *   - small  — mindre padding, mindre tekst.
 *
 * `buttonClass()` brukes for ikke-button-elementer (Link, a, form-knapper)
 * som trenger samme stil uten <button>-elementet.
 */
export type ButtonVariant = "wax" | "brass" | "quiet";
export type ButtonSize = "default" | "small";

export function buttonClass({
  variant = "wax",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn("btn", `btn-${variant}`, size === "small" && "btn-small", className);
}

export function Button({
  variant = "wax",
  size = "default",
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClass({ variant, size, className })} {...props} />;
}
