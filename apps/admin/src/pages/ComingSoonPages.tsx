import type { ReactNode } from 'react';
import { CreditCard } from 'lucide-react';
import { EmptyState } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';

// Placeholders for the roadmap phases that need new backend models first
// (Subscription).

function ComingSoon({ title, description, icon, detail }: { title: string; description: string; icon: ReactNode; detail: string }) {
  return (
    <>
      <PageHeader title={title} description={description} back={{ to: '/more', label: 'More' }} />
      <div className="rounded-2xl bg-card"><EmptyState icon={icon} title="Coming soon" description={detail} /></div>
    </>
  );
}

export const BillingPage = () => (
  <ComingSoon title="Billing" description="Your plan and invoices." icon={<CreditCard className="h-6 w-6" />}
    detail="Monthly plans with local payment options, invoices and payment history. You'll see the price before anything is charged." />
);
