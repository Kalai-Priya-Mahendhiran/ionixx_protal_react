import { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AppDialog, primaryButtonClass } from '@/components/ui/form-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/mock-users';
import { COMPANY_PUBLISHER_ROLES, MAX_UPLOAD_BYTES, type UploadAccess } from '@/services/apis/files/file-service';
import { useUploadFiles } from '@/services/apis/files/use-files';
import { UPLOAD_CATEGORIES, formatFileSize } from './file-utils';

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole;
  department: string;
}

export function UploadFileDialog({ open, onOpenChange, role, department }: UploadFileDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<globalThis.File[]>([]);
  const [category, setCategory] = useState('personal');
  const [access, setAccess] = useState<UploadAccess>('private');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const upload = useUploadFiles();

  // Sharing with the whole company is for HR, Admin and Leadership
  const accessOptions: { value: UploadAccess; label: string }[] = [
    { value: 'private', label: 'Only me' },
    { value: 'department', label: `My department (${department})` },
    ...(COMPANY_PUBLISHER_ROLES.includes(role) ? [{ value: 'public' as const, label: 'Everyone in the company' }] : []),
  ];

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((file) => file.size > MAX_UPLOAD_BYTES);
    setError(tooBig ? `${tooBig.name} is larger than 10 MB` : '');
    setSelected((current) => [...current, ...incoming.filter((file) => file.size <= MAX_UPLOAD_BYTES)]);
  };

  const close = (next: boolean) => {
    if (!next) {
      setSelected([]);
      setError('');
      setCategory('personal');
      setAccess('private');
    }
    onOpenChange(next);
  };

  const submit = () => {
    if (selected.length === 0) {
      setError('Choose at least one file');
      return;
    }
    upload.mutate(
      { files: selected, category, access },
      {
        onSuccess: () => {
          toast.success(selected.length === 1 ? `${selected[0].name} uploaded` : `${selected.length} files uploaded`);
          close(false);
        },
        onError: (uploadError) => setError(uploadError instanceof Error ? uploadError.message : 'Upload failed'),
      },
    );
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      busy={upload.isPending}
      title="Upload files"
      description="Up to 10 MB per file"
      footer={
        <>
          <Button variant="outline" onClick={() => close(false)} disabled={upload.isPending}>
            Cancel
          </Button>
          <Button className={primaryButtonClass} onClick={submit} disabled={upload.isPending}>
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
            dragging ? 'border-[#464EB8] bg-indigo-50' : 'border-gray-300 hover:border-[#464EB8] hover:bg-gray-50',
          )}
        >
          <UploadCloud className="h-8 w-8 text-[#464EB8]" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-900">Drop files here or click to choose</span>
          <span className="text-xs text-gray-500">PDF, Word, Excel, images…</span>
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />

        {selected.length > 0 && (
          <ul className="space-y-1.5">
            {selected.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-1.5 text-sm">
                <span className="truncate">{file.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                  {formatFileSize(file.size)}
                  <button type="button" onClick={() => setSelected((current) => current.filter((_, position) => position !== index))} aria-label={`Remove ${file.name}`} className="rounded p-0.5 hover:bg-gray-200">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="upload-category" className="text-sm font-medium text-gray-800">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="upload-category" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UPLOAD_CATEGORIES.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="upload-access" className="text-sm font-medium text-gray-800">
              Who can see it
            </label>
            <Select value={access} onValueChange={(value) => setAccess(value as UploadAccess)}>
              <SelectTrigger id="upload-access" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accessOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </AppDialog>
  );
}
