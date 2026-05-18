"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type GeotingAccordionProps = HTMLAttributes<HTMLDivElement>;

export function GeotingAccordion({ children, className, ...props }: GeotingAccordionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const detailsItems = Array.from(container.querySelectorAll<HTMLDetailsElement>("details[data-geoting-accordion-item]"));

    const closeOtherItems = (activeItem: HTMLDetailsElement) => {
      for (const item of detailsItems) {
        if (item !== activeItem) item.open = false;
      }
    };

    const handleToggle = (event: Event) => {
      const target = event.currentTarget;
      if (!(target instanceof HTMLDetailsElement) || !target.open) return;
      closeOtherItems(target);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const closeControl = target.closest("[data-geoting-close]");
      if (!closeControl || !container.contains(closeControl)) return;

      const activeItem = closeControl.closest("details[data-geoting-accordion-item]");
      if (!(activeItem instanceof HTMLDetailsElement)) return;

      activeItem.open = false;
      activeItem.querySelector("summary")?.focus();
    };

    for (const item of detailsItems) {
      item.addEventListener("toggle", handleToggle);
    }
    container.addEventListener("click", handleClick);

    return () => {
      for (const item of detailsItems) {
        item.removeEventListener("toggle", handleToggle);
      }
      container.removeEventListener("click", handleClick);
    };
  }, [children]);

  return (
    <div ref={containerRef} className={cn(className)} {...props}>
      {children}
    </div>
  );
}
