import { useRef, useState } from 'react';
import { FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { MAX_UPLOAD_BYTES, TASK_ATTACHMENT_CATEGORY } from '@/services/apis/files/file-service';
import { useUploadFiles } from '@/services/apis/files/use-files';
import { getUserById } from '@/lib/user-directory';
import type { TaskAttachment } from '@/types';

function formatSize(bytes?: number): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- Drop zone: uploads to the Files module and hands back attachments ---------- */

interface AttachmentDropzoneProps {
  // Set when the task already exists, so the file is linked to it in the Files module
  taskId?: string;
  compact?: boolean;
  onUploaded: (attachments: TaskAttachment[]) => void;
}

export function AttachmentDropzone({ taskId, compact = false, onUploaded }: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadFiles = useUploadFiles();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || uploadFiles.isPending) return;
    const files = Array.from(fileList);
    const accepted = files.filter((file) => file.size <= MAX_UPLOAD_BYTES);
    setError(accepted.length < files.length ? 'Files larger than 10 MB were skipped.' : '');
    if (accepted.length === 0) return;

    try {
      const uploaded = await uploadFiles.mutateAsync({ files: accepted, category: TASK_ATTACHMENT_CATEGORY, taskId });
      onUploaded(
        uploaded.map((file) => ({
          id: file.id,
          fileId: file.id,
          name: file.name,
          url: file.url,
          sizeBytes: file.size,
          uploadedById: file.uploadedById,
          uploadedAt: new Date().toISOString(),
        })),
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed. Please try again.');
    }
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          void addFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <div
        role="button"
        tabIndex={0}
        aria-label="Add attachments"
        aria-busy={uploadFiles.isPending}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void addFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/40 ${
          compact ? 'py-2.5' : 'py-4'
        } ${isDragging ? 'border-[#464EB8] bg-indigo-50' : 'border-indigo-200 bg-white hover:border-[#464EB8]/60 hover:bg-indigo-50/40'}`}
      >
        {uploadFiles.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-gray-600">Uploading…</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-5 w-5 text-indigo-400" />
            <span className="text-gray-600">
              Drag files here or <span className="font-medium text-[#464EB8]">choose files</span>
            </span>
            <span className="text-xs text-gray-400">(max 10 MB each)</span>
          </>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-amber-700">{error}</p>}
    </div>
  );
}

/* ---------- List ---------- */

export function AttachmentList({ attachments, onRemove }: { attachments: TaskAttachment[]; onRemove?: (attachment: TaskAttachment) => void }) {
  if (attachments.length === 0) return null;
  return (
    <ul className="divide-y divide-indigo-50 rounded-lg border border-indigo-100">
      {attachments.map((attachment) => (
        <li key={attachment.id} className="flex items-center gap-3 px-3 py-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-indigo-500" />
          <span className="min-w-0 flex-1">
            {attachment.url && attachment.url !== '#' ? (
              <a href={attachment.url} target="_blank" rel="noreferrer" className="block truncate text-gray-800 hover:text-[#464EB8] hover:underline">
                {attachment.name}
              </a>
            ) : (
              <span className="block truncate text-gray-800">{attachment.name}</span>
            )}
            {attachment.uploadedById && (
              <span className="block text-xs text-gray-400">
                {getUserById(attachment.uploadedById)?.name}
                {attachment.uploadedAt && ` · ${formatRelativeTime(attachment.uploadedAt)}`}
              </span>
            )}
          </span>
          <span className="text-xs text-gray-400">{formatSize(attachment.sizeBytes)}</span>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(attachment)}
              aria-label={`Remove ${attachment.name}`}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Form field (Create / Edit dialog) ---------- */

interface TaskAttachmentsFieldProps {
  value: TaskAttachment[];
  onChange: (attachments: TaskAttachment[]) => void;
  taskId?: string;
}

export function TaskAttachmentsField({ value, onChange, taskId }: TaskAttachmentsFieldProps) {
  return (
    <div className="space-y-2">
      <AttachmentDropzone taskId={taskId} onUploaded={(uploaded) => onChange([...value, ...uploaded])} />
      <AttachmentList attachments={value} onRemove={(attachment) => onChange(value.filter((item) => item.id !== attachment.id))} />
    </div>
  );
}
