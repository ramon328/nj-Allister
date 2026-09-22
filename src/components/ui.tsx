import type { HTMLAttributes, ReactNode } from "react";
import { useMagnetic } from "../hooks/useMotion";

export const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

type ButtonProps = {
  href?: string;
  variant: "light" | "dark";
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
};

/** Island button: pill with a nested circular trailing icon, magnetic on hover. */
export function Button({ href, variant, children, className = "", type = "button" }: ButtonProps) {
  const ref = useMagnetic<HTMLAnchorElement & HTMLButtonElement>();
  const cls = `btn btn--${variant} ${className}`.trim();
  const inner = (
    <>
      <span>{children}</span>
      <i className="btn__icon"><ArrowIcon /></i>
    </>
  );
  if (href) {
    return <a ref={ref} href={href} className={cls}>{inner}</a>;
  }
  return <button ref={ref} type={type} className={cls}>{inner}</button>;
}

type EyebrowProps = HTMLAttributes<HTMLParagraphElement> & { light?: boolean; children: ReactNode };

export function Eyebrow({ children, light = false, className = "", ...rest }: EyebrowProps) {
  return (
    <p className={`eyebrow ${light ? "eyebrow--light" : ""} ${className}`.trim()} {...rest}>
      <span className="eyebrow__dot" />{children}
    </p>
  );
}

export function LinkUnderline({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} className={`link-underline ${className}`.trim()}>{children}</a>;
}
