import type { ReactNode } from 'react';
import { CreditCard, Globe } from 'lucide-react';
import { Card, EmptyState } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';

// Placeholders for the roadmap phases that need new backend models first
// (Store/tenant, Subscription, Domain, Theme settings).

function ComingSoon({ title, description, icon, detail }: { title: string; description: string; icon: ReactNode; detail: string }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card><EmptyState icon={icon} title="Coming soon" description={detail} /></Card>
    </>
  );
}

export const DomainsPage = () => (
  <ComingSoon title="Domains" description="Where customers find your store." icon={<Globe className="h-5 w-5" />}
    detail="Your store already works on its subdomain. Connecting your own domain (e.g. mystore.gm) arrives in a later release." />
);

export const BillingPage = () => (
  <ComingSoon title="Billing" description="Your plan and invoices." icon={<CreditCard className="h-5 w-5" />}
    detail="Monthly plans paid with Wave or ModemPay, invoices and payment history. Needs the subscription model in the backend." />
);
