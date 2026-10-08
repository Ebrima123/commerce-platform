import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@cp/shared';
import { Button, Skeleton } from '@cp/ui';
import { PageHeader, useStoreProfile } from '../components/AdminLayout';
import { BarButton, FieldRow, ListSection, plainInput } from '../components/ios';
import { ImageInput } from '../design/FieldControls';
import { useAuth } from '../auth';

const FIELDS = [
  { key: 'store_name', label: 'Store name', placeholder: 'e.g. Banjul Fashion House', inputMode: 'text' },
  { key: 'store_whatsapp', label: 'WhatsApp number', placeholder: '220 XXX XXXX', inputMode: 'tel' },
  { key: 'store_location', label: 'Location', placeholder: 'e.g. Serekunda', inputMode: 'text' },
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
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['store-profile'] }); },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Could not save'),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };

  return (
    <>
      <PageHeader title="Store details" description="Shown to customers on your store." back={{ to: '/more', label: 'More' }}
        actions={<BarButton bold type="submit" form="settings-form" disabled={save.isPending || isLoading}>{save.isPending ? 'Saving…' : 'Save'}</BarButton>} />

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : (
        <form id="settings-form" onSubmit={submit} className="max-w-2xl">
          <ListSection header="Logo and banner" footer="Wide photos work best for the banner. It's used behind your top section when that has no photo of its own.">
            <div className="grid gap-4 p-4 sm:grid-cols-[160px_1fr]">
              <div>
                <p className="mb-1.5 text-[13px] font-medium text-muted-foreground">Logo</p>
                {isStaff
                  ? <p className="text-[15px] text-muted-foreground">Only the store owner can change the logo.</p>
                  : <ImageInput id="store-logo" value={form.avatar_url} onChange={v => setForm(s => ({ ...s, avatar_url: v }))} compact />}
              </div>
              <div>
                <p className="mb-1.5 text-[13px] font-medium text-muted-foreground">Banner</p>
                <ImageInput id="store-banner" value={form.store_banner_url} onChange={v => setForm(s => ({ ...s, store_banner_url: v }))} compact />
              </div>
            </div>
          </ListSection>

          <ListSection header="About your store">
            {FIELDS.map(f => (
              <FieldRow key={f.key} label={f.label} htmlFor={f.key}>
                <input id={f.key} value={form[f.key]} placeholder={f.placeholder} inputMode={f.inputMode} className={plainInput}
                  onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))} required={f.key === 'store_name'} />
              </FieldRow>
            ))}
            <FieldRow label="Description" htmlFor="store_description">
              <textarea id="store_description" rows={4} maxLength={1000} value={form.store_description}
                onChange={e => setForm(s => ({ ...s, store_description: e.target.value }))}
                className={`${plainInput} h-auto resize-none py-1 leading-snug`}
                placeholder="What you sell and what makes you different" />
            </FieldRow>
          </ListSection>

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />} Save changes
          </Button>
        </form>
      )}
    </>
  );
}
