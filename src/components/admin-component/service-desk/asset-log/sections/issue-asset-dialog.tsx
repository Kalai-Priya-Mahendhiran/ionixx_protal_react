import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog } from '@/components/ui/form-dialog';
import { SelectField, TextField } from '@/components/ui/form-fields';
import { issueAssetSchema, type IssueAssetFormValues } from '@/lib/form-schemas/desk';
import { getActiveUsers } from '@/lib/user-directory';
import { useIssueAsset } from '@/services/apis/service-desk/use-service-desk';
import type { Asset } from '@/types';

const EMPTY_ISSUE: IssueAssetFormValues = { userId: '', requestKey: '' };

export function IssueAssetDialog({ asset, onOpenChange }: { asset: Asset | null; onOpenChange: (open: boolean) => void }) {
  const issue = useIssueAsset();
  const form = useForm<IssueAssetFormValues>({ resolver: zodResolver(issueAssetSchema), defaultValues: EMPTY_ISSUE });
  useEffect(() => {
    if (asset) form.reset(EMPTY_ISSUE);
  }, [asset, form]);
  const people = getActiveUsers()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((member) => ({ value: member.id, label: `${member.name} · ${member.designation}` }));

  const onSubmit = (values: IssueAssetFormValues) =>
    asset && issue.mutate({ id: asset.id, userId: values.userId, requestKey: values.requestKey.toUpperCase() || undefined }, { onSuccess: () => onOpenChange(false) });

  return (
    <FormDialog
      open={!!asset}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={`Issue ${asset?.tag ?? 'asset'}`}
      description={asset?.model}
      size="sm"
      submitLabel="Issue"
      pendingLabel="Issuing…"
      pending={issue.isPending}
    >
      <SelectField control={form.control} name="userId" label="Issue to" options={people} placeholder="Choose a person…" />
      <TextField control={form.control} name="requestKey" label="Request key" placeholder="e.g. ADM-107" />
    </FormDialog>
  );
}
