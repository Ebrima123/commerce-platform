import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@cp/shared';
import { Button, Card, Input, Label, Skeleton } from '@cp/ui';
import { PageHeader, useStoreProfile } from '../components/AdminLayout';
import { ImageInput } from '../design/FieldControls';
import { useAuth } from '../auth';

const FIELDS = [
  { key: 'store_name', label: 'Store name', placeholder: 'e.g. Banjul Fashion House' },
  { key: 'store_whatsapp', label: 'WhatsApp number', placeholder: '220 XXX XXXX' },
  { key: 'store_location', label: 'Location', placeholder: 'e.g. Serekunda' },
] as const;

type Form = Record<(typeof FIELDS)[number]['key'] | 'store_description' | 'avatar_url' | 'store_banner_url', string>;

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: store, isLoading } = useStoreProfile();
  const { user } = useAuth();
  // The backend only lets the owner change the logo (it is the owner's avatar).
  const isStaff = !!user?.seller_staff_of;
  const [form, setForm] = useState<Form>({ store_name: '', store_whatsapp: '', store_location: '', store_description: '', avatar_url: '', store_banner_url: '' });

  useEffect(() => {
    if (store) setForm({
      store_name: store.store_name, store_whatsapp: store.store_whatsapp,
      store_location: store.store_location, store_description: store.store_description,
      avatar_url: store.avatar_url, store_banner_url: store.store_banner_url,
    });
  }, [store]);

  const save = useMutation({
    mutationFn: () => {
      const { avatar_url, ...rest } = form;
      return api('/api/seller/profile/', { method: 'PATCH', body: isStaff ? rest : { ...rest, avatar_url }, auth: true });
    },
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['store-profile'] }); },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Could not save settings'),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };

  return (
    <>
      <PageHeader title="Settings" description="Basic details shown on your storefront." />
      <Card className="max-w-2xl p-6">
        {isLoading ? (
          <div className="space-y-4">{[0, 1, 2].map(i => <Skeleton key={i} className="h-14" />)}</div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
              <div className="space-y-1.5">
                <Label htmlFor="store-logo">Logo</Label>
                {isStaff
                  ? <p className="text-xs text-muted-foreground">Only the store owner can change the logo.</p>
                  : <ImageInput id="store-logo" value={form.avatar_url} onChange={v => setForm(s => ({ ...s, avatar_url: v }))} compact />}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="store-banner">Banner</Label>
                <ImageInput id="store-banner" value={form.store_banner_url} onChange={v => setForm(s => ({ ...s, store_banner_url: v }))} compact />
                <p className="text-xs text-muted-foreground">Used behind your hero when it has no image of its own. Wide images work best.</p>
              </div>
            </div>
            {FIELDS.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input id={f.key} value={form[f.key]} placeholder={f.placeholder}
                  onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))} required={f.key === 'store_name'} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="store_description">Description</Label>
              <textarea id="store_description" rows={4} maxLength={1000} value={form.store_description}
                onChange={e => setForm(s => ({ ...s, store_description: e.target.value }))}
                className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="What you sell and what makes you different" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Save</Button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
