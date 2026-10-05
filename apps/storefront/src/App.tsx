import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CartProvider, StoreProvider, useStore } from './store';
import { StoreShell } from './components/StoreShell';
import { ThemeRoot } from './components/ThemeRoot';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import { ComingSoonPage, NoStorePage, StoreNotFoundPage } from './pages/StatusPages';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
});

function Storefront() {
  const { slug, basePath, store, isLoading, isError, preview } = useStore();
  if (!slug) return <NoStorePage />;
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (isError || !store) return <StoreNotFoundPage slug={slug} />;

  return (
    <ThemeRoot brand={store.theme.brand}>
      {!store.published && !preview ? (
        <ComingSoonPage name={store.name} />
      ) : (
        <CartProvider>
          <BrowserRouter basename={basePath || undefined}>
            <Routes>
              <Route element={<StoreShell />}>
                <Route index element={<HomePage />} />
                <Route path="products/:id" element={<ProductPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="*" element={<HomePage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      )}
    </ThemeRoot>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <Storefront />
      </StoreProvider>
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}
