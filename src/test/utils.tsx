import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../theme/ThemeProvider";

/** Renders with a fresh QueryClient per test (no caching/retries) so tests
 * don't leak state or wait out retry backoff into each other, plus a real
 * ThemeProvider — added when DeveloperToolsPage's tests were the first to
 * render a full page (TopBar -> ThemeToggle -> useTheme()) rather than a
 * standalone presentational component like BucketList/QueueList/TableList,
 * which don't touch theme context at all. */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
