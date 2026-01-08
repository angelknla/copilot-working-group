import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: ReactNode,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  }: { queryClient?: QueryClient } & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
