// Auth links append ?from=<path> so sign-in / sign-up can return the
// user to where they were browsing. Skip auth routes and home to avoid
// loops or stranding users on a login screen after they meant to browse.
const SKIP_FROM_PATHS = new Set(["/", "/login", "/signup", "/checkout"]);

export function authPathWithFrom(basePath: string, pathname: string, search: string): string {
  if (SKIP_FROM_PATHS.has(pathname)) {
    return basePath;
  }
  const from = `${pathname}${search}`;
  return `${basePath}?from=${encodeURIComponent(from)}`;
}

export function siblingAuthPathWithFrom(targetBase: string, searchParams: URLSearchParams): string {
  const from = searchParams.get("from");
  if (from?.startsWith("/")) {
    return `${targetBase}?from=${encodeURIComponent(from)}`;
  }
  const role = searchParams.get("role");
  if (role === "OWNER") {
    return `${targetBase}?role=OWNER`;
  }
  return targetBase;
}

export function resolvePostAuthRedirect(from: string | null, fallback: string): string {
  return from?.startsWith("/") ? from : fallback;
}
