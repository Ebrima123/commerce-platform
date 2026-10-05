import { Store } from 'lucide-react';
import { EmptyState } from '@cp/ui';

/** No store in the address — e.g. the bare platform domain or plain localhost. */
export function NoStorePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <EmptyState icon={<Store className="h-5 w-5" />} title="No store selected"
        description="Stores live at their own link, like this-site/@storename. Check the link you were given." />
    </div>
  );
}

export function StoreNotFoundPage({ slug }: { slug: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <EmptyState icon={<Store className="h-5 w-5" />} title="Store not found"
        description={`There's no store called "${slug}". Check the address and try again.`} />
    </div>
  );
}

/** Store exists but the merchant hasn't published it yet. */
export function ComingSoonPage({ name }: { name: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Coming soon</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">{name}</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">We're putting the finishing touches on our store. Check back soon.</p>
    </div>
  );
}
