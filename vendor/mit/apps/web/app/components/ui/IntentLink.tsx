import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router";

/** Static port: prefetch stripped; still a real link so the three pages stay clickable. */
export function IntentLink({
  to, className, children, onClick, viewTransition, resetScroll, prefetchOnPress, ...rest
}: {
  to: string;
  className?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  viewTransition?: boolean;
  resetScroll?: boolean;
  prefetchOnPress?: boolean;
  style?: CSSProperties;
  "aria-current"?: "page" | "true" | undefined;
  "aria-label"?: string;
  title?: string;
  "data-ft-filter"?: string;
}) {
  void viewTransition; void resetScroll; void prefetchOnPress;
  return (
    <Link to={to} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
