import { Link, useLocation } from 'react-router-dom';
import { House, LayoutGrid, Search, ShoppingBag } from 'lucide-react';
import { cn } from '@cp/ui';
import { useCart } from '../store';
import { useStoreHref, useWhatsAppLink, WhatsAppIcon } from './primitives';

/**
 * iOS-style translucent tab bar for phones, tinted with the store's colour.
 * Hidden on product pages, which have their own "Add to bag" bar.
 */
export function TabBar({ storeName, variant }: { storeName: string; variant: 'marketplace' | 'boutique' }) {
  const { pathname } = useLocation();
  const { count } = useCart();
  const href = useStoreHref();
  const wa = useWhatsAppLink(`Hello ${storeName}, I have a question.`);
  if (pathname.startsWith('/products/')) return null;

  const item = 'flex flex-col items-center justify-center gap-[3px] pt-0.5 text-[10px] font-medium leading-none transition-opacity active:opacity-60';
  const color = (active: boolean) => (active ? 'text-brand' : 'text-zinc-500');
  const icon = (active: boolean) => ({ className: 'h-6 w-6', strokeWidth: active ? 2.3 : 1.8 });
  const second = variant === 'marketplace'
    ? { to: '/categories', label: 'Categories', Icon: LayoutGrid }
    : { to: '/?search=1', label: 'Search', Icon: Search };
  const secondActive = pathname === '/categories';

  return (
    <nav aria-label="Store" className="fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-black/20 bg-card/85 pb-safe backdrop-blur-xl backdrop-saturate-150 md:hidden">
      <div className="grid h-[50px] grid-cols-4">
        <Link to={href('/')} aria-current={pathname === '/' ? 'page' : undefined} className={cn(item, color(pathname === '/'))}>
          <House {...icon(pathname === '/')} /> Home
        </Link>
        <Link to={href(second.to)} className={cn(item, color(secondActive))}>
          <second.Icon {...icon(secondActive)} /> {second.label}
        </Link>
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(item, 'text-zinc-500')}>
            <WhatsAppIcon className="h-6 w-6 text-[#25D366]" /> Chat
          </a>
        ) : <span />}
        <Link to={href('/cart')} aria-label={`Cart, ${count} item${count !== 1 ? 's' : ''}`} className={cn(item, 'relative', color(pathname === '/cart'))}>
          <ShoppingBag {...icon(pathname === '/cart')} /> Cart
          {count > 0 && (
            <span className="absolute left-1/2 top-0.5 ml-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-semibold text-white">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
