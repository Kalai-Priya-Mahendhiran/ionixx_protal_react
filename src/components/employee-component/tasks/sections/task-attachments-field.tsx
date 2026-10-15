import { useRef, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';
import { generateId } from '@/lib/utils';
import type { TaskAttachment } from '@/types';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatSize(bytes?: number): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TaskAttachmentsFieldProps {
  value: TaskAttachment[];
  onChange: (attachments: TaskAttachment[]) => void;
}

/*
 * Mock attachment picker: records file names and sizes only.
 * With the backend, each file is uploaded via the Files module (POST /api/files/upload)
 * and the returned fileId is stored on the attachment.
 */
export function TaskAttachmentsField({ value, onChange }: TaskAttachmentsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const accepted = Array.from(files).filter((file) => file.size <= MAX_FILE_BYTES);
    setError(accepted.length < files.length ? 'Files larger than 10 MB were skipped.' : '');
    onChange([...value, ...accepted.map((file) => ({ id: generateId(), name: file.name, sizeBytes: file.size }))]);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <div
        role="button"
        tabIndex={0}
        aria-label="Add attachments"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
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
          addFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/40 ${
          isDragging ? 'border-[#464EB8] bg-indigo-50' : 'border-indigo-200 bg-white hover:border-[#464EB8]/60 hover:bg-indigo-50/40'
        }`}
      >
        <UploadCloud className="h-5 w-5 text-indigo-400" />
        <span className="text-gray-600">
          Drag files here or <span className="font-medium text-[#464EB8]">choose files</span>
        </span>
        <span className="text-xs text-gray-400">(max 10 MB each)</span>
      </div>

      {error && <p role="alert" className="text-sm text-amber-700">{error}</p>}

      {value.length > 0 && (
        <ul className="divide-y divide-indigo-50 rounded-lg border border-indigo-100">
          {value.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-indigo-500" />
              <span className="min-w-0 flex-1 truncate text-gray-800">{attachment.name}</span>
              <span className="text-xs text-gray-400">{formatSize(attachment.sizeBytes)}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item.id !== attachment.id))}
                aria-label={`Remove ${attachment.name}`}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
