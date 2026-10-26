import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog } from '@/components/ui/form-dialog';
import { SelectField, TextField } from '@/components/ui/form-fields';
import { ASSET_TAG_PREFIX, ASSET_TYPE_LABELS } from '@/lib/desk-config';
import { ASSET_TYPE_VALUES, assetSchema, type AssetFormValues } from '@/lib/schemas';
import { useCreateAsset } from '@/services/apis/service-desk/use-service-desk';
import type { AssetType } from '@/types';

const EMPTY_ASSET: AssetFormValues = { type: 'laptop', model: '', serialNumber: '', tag: '' };

export function AddAssetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateAsset();
  const form = useForm<AssetFormValues>({ resolver: zodResolver(assetSchema), defaultValues: EMPTY_ASSET });
  const type = form.watch('type');
  useEffect(() => {
    if (open) form.reset(EMPTY_ASSET);
  }, [open, form]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={(values) => create.mutate(values, { onSuccess: () => onOpenChange(false) })}
      title="Add an asset"
      description="New assets start in stock, ready to issue."
      submitLabel="Add asset"
      pendingLabel="Adding…"
      pending={create.isPending}
    >
      <SelectField control={form.control} name="type" label="Type" options={ASSET_TYPE_VALUES.map((value) => ({ value, label: ASSET_TYPE_LABELS[value] }))} />
      <TextField control={form.control} name="model" label="Make and model" placeholder="e.g. Dell Latitude 5440" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="serialNumber" label="Serial number" />
        <TextField control={form.control} name="tag" label="Asset tag" placeholder={`Auto, e.g. ${ASSET_TAG_PREFIX[type as AssetType]}-0012`} />
      </div>
    </FormDialog>
  );
}
