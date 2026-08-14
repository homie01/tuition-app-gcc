"use client";
/* eslint-disable react-hooks/rules-of-hooks */

import * as React from "react";
import {
  Link as RouterLink,
  useNavigate as useReactNavigate,
  useLocation as useReactLocation,
  useParams as useReactParams,
  useSearchParams as useReactSearchParams,
} from "react-router-dom";
import {
  useRouter as useNextRouter,
  usePathname as useNextPathname,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import NextLink from "next/link";

export function useRouter() {
  let nextRouter: ReturnType<typeof useNextRouter> | null = null;
  let nextPathname: string | null = null;
  let reactNavigate: ReturnType<typeof useReactNavigate> | null = null;
  let reactLocation: ReturnType<typeof useReactLocation> | null = null;

  try {
    nextRouter = useNextRouter();
    nextPathname = useNextPathname();
  } catch {
    // Not in Next router context
  }

  try {
    reactNavigate = useReactNavigate();
    reactLocation = useReactLocation();
  } catch {
    // Not in React Router context
  }

  return React.useMemo(() => {
    if (nextRouter) {
      return {
        push: (path: string) => nextRouter.push(path),
        replace: (path: string) => nextRouter.replace(path),
        back: () => nextRouter.back(),
        forward: () => nextRouter.forward(),
        refresh: () => nextRouter.refresh(),
        pathname: nextPathname ?? "",
      };
    }
    if (reactNavigate && reactLocation) {
      return {
        push: (path: string) => reactNavigate(path),
        replace: (path: string) => reactNavigate(path, { replace: true }),
        back: () => reactNavigate(-1),
        forward: () => reactNavigate(1),
        refresh: () => {},
        pathname: reactLocation.pathname,
      };
    }
    return {
      push: (path: string) => {
        if (typeof window !== "undefined") window.location.href = path;
      },
      replace: (path: string) => {
        if (typeof window !== "undefined") window.location.replace(path);
      },
      back: () => {
        if (typeof window !== "undefined") window.history.back();
      },
      forward: () => {
        if (typeof window !== "undefined") window.history.forward();
      },
      refresh: () => {
        if (typeof window !== "undefined") window.location.reload();
      },
      pathname: typeof window !== "undefined" ? window.location.pathname : "",
    };
  }, [nextRouter, nextPathname, reactNavigate, reactLocation]);
}

export function usePathname() {
  try {
    const pathname = useNextPathname();
    if (pathname !== null && pathname !== undefined) return pathname;
  } catch {
    // Fallback
  }
  try {
    const location = useReactLocation();
    if (location?.pathname) return location.pathname;
  } catch {
    // Fallback
  }
  if (typeof window !== "undefined") {
    return window.location.pathname;
  }
  return "";
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  try {
    const params = useNextParams();
    if (params) return params as T;
  } catch {
    // Fallback
  }
  try {
    const params = useReactParams();
    if (params) return params as T;
  } catch {
    // Fallback
  }
  return {} as T;
}

export function useSearchParams() {
  try {
    const searchParams = useNextSearchParams();
    if (searchParams) return searchParams;
  } catch {
    // Fallback
  }
  try {
    const [searchParams] = useReactSearchParams();
    if (searchParams) return searchParams;
  } catch {
    // Fallback
  }
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
}

export function Link({ href, to, children, className, title, onClick, ...rest }: any) {
  const target = to || href || "#";
  let inReactRouter = false;
  try {
    useReactLocation();
    inReactRouter = true;
  } catch {
    inReactRouter = false;
  }

  if (inReactRouter) {
    return (
      <RouterLink to={target} className={className} title={title} onClick={onClick} {...rest}>
        {children}
      </RouterLink>
    );
  }

  return (
    <NextLink href={target} className={className} title={title} onClick={onClick} {...rest}>
      {children}
    </NextLink>
  );
}

export default Link;
