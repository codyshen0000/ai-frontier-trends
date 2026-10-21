import {
  createContext,
  useContext,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { resolveHref } from "./routes";

export function hrefOf(to: string | { pathname?: string; search?: string; hash?: string }, currentPath?: string): string {
  return resolveHref(to, currentPath).href;
}

export type Location = { pathname: string; search: string; hash: string; key: string; state: unknown };

const LocationCtx = createContext<Location>({ pathname: "/", search: "", hash: "", key: "static", state: null });

export function StaticLocation({ pathname, children }: { pathname: string; children: ReactNode }) {
  return (
    <LocationCtx.Provider value={{ pathname, search: "", hash: "", key: "static", state: null }}>
      {children}
    </LocationCtx.Provider>
  );
}

export function useLocation(): Location {
  return useContext(LocationCtx);
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams) => void] {
  return [new URLSearchParams(), () => {}];
}

export function useNavigation() {
  return { state: "idle" as const, location: undefined as Location | undefined };
}

export function useNavigationType() {
  return "POP" as const;
}

export function useNavigate() {
  return (_to: string) => {};
}

export function useRevalidator() {
  return { state: "idle" as const, revalidate: async () => {} };
}

export function useMatches() {
  const { pathname } = useLocation();
  const tab = pathname.startsWith("/hot")
    ? "hot"
    : pathname.startsWith("/daily") || pathname.startsWith("/weekly") || pathname.startsWith("/monthly")
      ? "daily"
      : pathname.startsWith("/more") || pathname.startsWith("/starred") || pathname.startsWith("/search") || pathname.startsWith("/topics")
        ? "me"
        : pathname.startsWith("/all")
          ? "featured"
          : "featured";
  const name = tab === "hot" ? "热点" : tab === "daily" ? "日报" : tab === "me" ? "我的" : pathname.startsWith("/all") ? "全部" : "精选";
  return [{ handle: { tab, name } }];
}

export function useHref(to: string) {
  return hrefOf(to);
}

export function useLoaderData() {
  return {};
}

export type LinkProps = {
  to: string;
  className?: string;
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  replace?: boolean;
  preventScrollReset?: boolean;
  viewTransition?: boolean;
  prefetch?: string;
  reloadDocument?: boolean;
  style?: CSSProperties;
  "aria-current"?: "page" | "true" | undefined;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  title?: string;
  target?: string;
  rel?: string;
  "data-ft-filter"?: string;
};

export function Link({ to, className, children, onClick, ...rest }: LinkProps) {
  const {
    replace, preventScrollReset, viewTransition, prefetch, reloadDocument, ...anchor
  } = rest as LinkProps & Record<string, unknown>;
  void replace; void preventScrollReset; void viewTransition; void prefetch; void reloadDocument;
  const { pathname } = useLocation();
  const resolved = resolveHref(to, pathname);
  if (resolved.kind === "unbuilt" || !resolved.href) {
    return <span className={className}>{children}</span>;
  }
  const external = resolved.kind === "external";
  return (
    <a
      href={resolved.href}
      className={className}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...anchor}
    >
      {children}
    </a>
  );
}

export function NavLink(props: LinkProps) {
  return <Link {...props} />;
}

export function Form({
  action, method, role, className, children, onSubmit,
}: {
  action?: string;
  method?: string;
  role?: string;
  className?: string;
  children?: ReactNode;
  onSubmit?: (event: FormEvent) => void;
}) {
  const { pathname } = useLocation();
  const dest = action ? hrefOf(action, pathname) : "";
  return (
    <form action={dest || undefined} method={method} role={role} className={className} onSubmit={onSubmit}>
      {children}
    </form>
  );
}

export function redirect(_to: string): never {
  throw new Error("redirect is not used in the static port");
}

export function PrefetchPageLinks() {
  return null;
}

export const UNSAFE_DataRouterContext = createContext(null);
export const UNSAFE_FrameworkContext = createContext(null);

export type MetaDescriptor = Record<string, unknown>;
export type ClientLoaderFunctionArgs = { request: Request; serverLoader: <T>() => Promise<T> };
export type ShouldRevalidateFunction = (args: unknown) => boolean;
