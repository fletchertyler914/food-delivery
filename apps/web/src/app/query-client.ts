import { QueryClient } from "@tanstack/react-query";

// Hoisted out of React so route loaders can prefetch into the same
// cache the components consume via useQuery. Using `ensureQueryData`
// from a loader means the page's data is fetched in parallel with the
// route's code (lazy chunk), instead of after the component mounts.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
