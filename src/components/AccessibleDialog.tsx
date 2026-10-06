"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

const dialogs: HTMLElement[] = [];
let originalOverflow = "";

export default function AccessibleDialog({ onClose, returnFocus, ...props }: HTMLAttributes<HTMLDivElement> & { onClose: () => void; returnFocus?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialogs.length) originalOverflow = document.body.style.overflow;
    dialogs.push(element);
    document.body.style.overflow = "hidden";
    const controls = () => Array.from(element.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    )).filter(control => control.getClientRects().length && !control.closest('[hidden],[inert],[aria-hidden="true"]'));
    (controls()[0] || element).focus();
    const keydown = (event: KeyboardEvent) => {
      if (dialogs.at(-1) !== element) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      } else if (event.key === "Tab") {
        const targets = controls();
        const first = targets[0] || element;
        const last = targets.at(-1) || element;
        if (!targets.length || !element.contains(document.activeElement) ||
          (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", keydown, true);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      const index = dialogs.indexOf(element);
      if (index >= 0) dialogs.splice(index, 1);
      if (!dialogs.length) document.body.style.overflow = originalOverflow;
      if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
      else if (returnFocus) document.querySelector<HTMLElement>(returnFocus)?.focus();
    };
  }, [returnFocus]);
  return <div {...props} ref={root} role="dialog" aria-modal="true" tabIndex={-1} />;
}
