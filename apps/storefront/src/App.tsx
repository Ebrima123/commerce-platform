import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CartProvider, StoreProvider, useStore } from './store';
import { StoreShell } from './components/StoreShell';
import { ThemeRoot } from './components/ThemeRoot';
import HomePage from './pages/HomePage';
import MarketplaceHome from './pages/MarketplaceHome';
import CategoriesPage from './pages/CategoriesPage';
import { MarketplaceShell } from './components/marketplace/MarketplaceShell';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import { ComingSoonPage, StoreNotFoundPage } from './pages/StatusPages';
import LandingPage from './pages/LandingPage';
import { CanvasDropZone } from './sections/EditorFrame';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
});

function Storefront() {
  const { slug, basePath, store, isLoading, isError, preview } = useStore();
  // No store in the address → the platform's own landing page.
  if (!slug) return <LandingPage />;
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (isError || !store) return <StoreNotFoundPage slug={slug} />;
  // Marketplace style (SHEIN / Temu / Alfudi-like) vs. the boutique layouts.
  const marketplace = store.theme.template === 'marketplace';
  const Home = marketplace ? MarketplaceHome : HomePage;

  return (
    <ThemeRoot brand={store.theme.brand}>
      {!store.published && !preview ? (
        <ComingSoonPage name={store.name} />
      ) : (
        <CartProvider>
          <BrowserRouter basename={basePath || undefined}>
            <Routes>
              <Route element={marketplace ? <MarketplaceShell /> : <StoreShell />}>
                <Route index element={<Home />} />
                <Route path="categories" element={marketplace ? <CategoriesPage /> : <Home />} />
                <Route path="products/:id" element={<ProductPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="*" element={<Home />} />
              </Route>
            </Routes>
          </BrowserRouter>
          {preview && <CanvasDropZone />}
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
