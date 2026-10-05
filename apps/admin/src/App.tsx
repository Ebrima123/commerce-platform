import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth';
import { AdminLayout, RequireAuth, RequireStore } from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import StartPage from './pages/StartPage';
import DesignPage from './pages/DesignPage';
import OverviewPage from './pages/OverviewPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import StoresPage from './pages/StoresPage';
import { BillingPage, DomainsPage } from './pages/ComingSoonPages';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Store wizard — open to visitors (account is the last step) and signed-in users without a store. */}
            <Route path="/start" element={<StartPage />} />
            <Route path="/design" element={<RequireAuth><RequireStore><DesignPage /></RequireStore></RequireAuth>} />
            <Route element={<RequireAuth><RequireStore><AdminLayout /></RequireStore></RequireAuth>}>
              <Route index element={<OverviewPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="domains" element={<DomainsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="stores" element={<StoresPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
