import { useMatch } from "react-router";

export function useRouteActive(to: string): boolean {
  const pathname = to.split("?")[0] ?? to;
  return useMatch({ path: pathname, end: true }) !== null;
}
