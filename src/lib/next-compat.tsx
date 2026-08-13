import * as React from "react";
import {
  Link as RouterLink,
  useNavigate as useReactNavigate,
  useLocation as useReactLocation,
  useParams as useReactParams,
  useSearchParams as useReactSearchParams,
  LinkProps as RouterLinkProps,
} from "react-router-dom";

export function Link({ href, to, children, className, title, onClick, ...rest }: any) {
  const target = to || href || "#";
  return (
    <RouterLink to={target} className={className} title={title} onClick={onClick} {...rest}>
      {children}
    </RouterLink>
  );
}

export function useRouter() {
  const navigate = useReactNavigate();
  const location = useReactLocation();

  return React.useMemo(
    () => ({
      push: (path: string) => navigate(path),
      replace: (path: string) => navigate(path, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => {},
      pathname: location.pathname,
    }),
    [navigate, location],
  );
}

export function usePathname() {
  const location = useReactLocation();
  return location.pathname;
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  const params = useReactParams();
  return params as T;
}

export function useSearchParams() {
  const [searchParams] = useReactSearchParams();
  return searchParams;
}

export default Link;
