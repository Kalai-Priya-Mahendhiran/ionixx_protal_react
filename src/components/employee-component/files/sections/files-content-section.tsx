import { useState, type ReactNode } from 'react';
import { Building2, Download, Eye, FileImage, FileSpreadsheet, FileText, Folder, Globe2, LayoutGrid, Lock, Presentation, Rows3, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { canDeleteFile } from '@/services/apis/files/file-service';
import { useDeleteFile } from '@/services/apis/files/use-files';
import type { File as PortalFile } from '@/types';
import { accessLabel, categoryLabel, downloadFile, formatFileDate, formatFileSize, viewFile } from './file-utils';

interface FilesContentSectionProps {
  files: PortalFile[];
  viewer: PermissionUser;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  // Shown beside the search box, e.g. "Storage used 0 B of 1 GB"
  toolbarNote?: ReactNode;
}

// File type → icon and tile colour (the portal's stat-card tones)
const typeStyle = (type: string) => {
  if (type.includes('pdf')) return { icon: FileText, className: 'bg-pink-100 text-pink-600' };
  if (type.includes('image')) return { icon: FileImage, className: 'bg-sky-100 text-sky-600' };
  if (type.includes('sheet') || type.includes('excel')) return { icon: FileSpreadsheet, className: 'bg-teal-100 text-teal-600' };
  if (type.includes('presentation') || type.includes('powerpoint')) return { icon: Presentation, className: 'bg-amber-100 text-amber-600' };
  if (type.includes('word') || type.includes('document')) return { icon: FileText, className: 'bg-indigo-100 text-indigo-600' };
  return { icon: FileText, className: 'bg-gray-100 text-gray-600' };
};

function AccessTag({ file, viewerId }: { file: PortalFile; viewerId: string }) {
  const Icon = file.accessLevel === 'private' ? Lock : file.accessLevel === 'department' ? Building2 : file.roles ? Users : Globe2;
  const tone = file.accessLevel === 'private' ? 'bg-purple-50 text-purple-700' : file.accessLevel === 'department' ? 'bg-sky-50 text-sky-700' : 'bg-indigo-50 text-indigo-700';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', tone)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {accessLabel(file, viewerId)}
    </span>
  );
}

export function FilesContentSection({ files, viewer, searchTerm, onSearchChange, toolbarNote }: FilesContentSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toDelete, setToDelete] = useState<PortalFile | null>(null);
  const deleteFile = useDeleteFile();

  const view = (file: PortalFile) => {
    if (!viewFile(file, viewer.id)) toast.error('Allow pop-ups for this site to open files');
  };

  // Icon buttons; the tooltip (title) and aria-label say what each one does
  const iconButtonClass = 'h-8 w-8 text-gray-500 hover:bg-indigo-50 hover:text-[#464EB8]';
  const actions = (file: PortalFile) => (
    <div className="flex shrink-0 items-center">
      <Button variant="ghost" size="icon" className={iconButtonClass} onClick={() => view(file)} aria-label={`View ${file.name}`} title="View">
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className={iconButtonClass} onClick={() => downloadFile(file, viewer.id)} aria-label={`Download ${file.name}`} title="Download">
        <Download className="h-4 w-4" />
      </Button>
      {canDeleteFile(viewer, file) && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-red-50 hover:text-red-600" onClick={() => setToDelete(file)} aria-label={`Delete ${file.name}`} title="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input value={searchTerm} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search files by name" aria-label="Search files" className="bg-white pl-9" />
          </div>
          {toolbarNote}
          <div role="radiogroup" aria-label="View" className="inline-flex self-start rounded-lg border border-gray-200 bg-white p-0.5">
            {(
              [
                ['grid', LayoutGrid, 'Cards'],
                ['list', Rows3, 'List'],
              ] as const
            ).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={viewMode === value}
                aria-label={label}
                title={label}
                onClick={() => setViewMode(value)}
                className={cn('rounded-md p-1.5', viewMode === value ? 'bg-[#464EB8] text-white' : 'text-gray-500 hover:bg-gray-100')}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {files.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Folder className="mx-auto mb-4 h-12 w-12 text-gray-300" aria-hidden="true" />
            <h3 className="mb-1 text-lg font-medium text-gray-900">No files found</h3>
            <p className="text-sm text-gray-600">{searchTerm ? 'Try a different search.' : 'Nothing in this category yet.'}</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        // Three per row from tablet width up
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => {
            const { icon: Icon, className } = typeStyle(file.type);
            return (
              <Card key={file.id} className="border-0 shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="flex h-full flex-col gap-2 p-3">
                  <div className="flex items-start gap-2.5">
                    <span className={cn('shrink-0 rounded-lg p-1.5', className)}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-gray-900" title={file.name}>
                        {file.name}
                      </h3>
                      <p className="truncate text-xs text-gray-500">
                        {categoryLabel(file.category)} · {formatFileSize(file.size)} · {formatFileDate(file.uploadedDate)}
                      </p>
                    </div>
                    {actions(file)}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <AccessTag file={file} viewerId={viewer.id} />
                    <span className="truncate text-xs text-gray-500">{file.uploadedById === viewer.id ? 'Uploaded by you' : file.uploadedBy}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-100">
              {files.map((file) => {
                const { icon: Icon, className } = typeStyle(file.type);
                return (
                  <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cn('shrink-0 rounded-lg p-2', className)}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {categoryLabel(file.category)} · {formatFileSize(file.size)} · {file.uploadedById === viewer.id ? 'you' : file.uploadedBy} · {formatFileDate(file.uploadedDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AccessTag file={file} viewerId={viewer.id} />
                      {actions(file)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete file?"
        description={toDelete ? `${toDelete.name} will be removed for everyone it was shared with.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteFile.isPending}
        onConfirm={() =>
          toDelete &&
          deleteFile.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success(`${toDelete.name} deleted`);
              setToDelete(null);
            },
            onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not delete the file'),
          })
        }
      />
    </div>
  );
}
