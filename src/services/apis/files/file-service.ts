import type { PermissionUser } from '@/lib/permissions/task-permissions';
import type { UserRole } from '@/lib/mock-users';
import { sampleFiles } from '@/lib/sample-data/file-sample-data';
import { getUserById } from '@/lib/user-directory';
import { generateId, todayAsDateInput } from '@/lib/utils';
import type { File as PortalFile } from '@/types';

/*
 * Files module storage, shared by the Files page and task attachments.
 * In-memory mock (lasts until refresh). With the backend, `upload` becomes a multipart
 * POST /api/files/upload and `url` points at the stored file instead of a browser blob.
 *
 * What a person sees depends on who they are: company files (optionally only for some roles),
 * their department's files, their own private documents and whatever they uploaded.
 */

export const TASK_ATTACHMENT_CATEGORY = 'task-attachments';
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
// Personal storage allowance shown on the Files page
export const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024;

// Only these roles may publish a file to the whole company
export const COMPANY_PUBLISHER_ROLES: UserRole[] = ['hr', 'admin', 'system_admin', 'executive'];

const MOCK_LATENCY_MS = 300;

let files: PortalFile[] = sampleFiles.map((file) => ({ ...file }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

// Blob URLs let the uploaded file be opened during the session (unavailable in tests)
const toObjectUrl = (file: Blob) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '#');

const departmentOf = (userId: string) => getUserById(userId)?.department;

export function canSeeFile(actor: PermissionUser, file: PortalFile): boolean {
  if (file.uploadedById === actor.id || file.ownerId === actor.id) return true;
  if (file.accessLevel === 'private') return false;
  if (file.roles && !file.roles.includes(actor.role)) return false;
  if (file.accessLevel === 'department') return !!file.department && file.department === departmentOf(actor.id);
  return true;
}

// People can delete what they uploaded; System Admin can tidy up anything that isn't someone's private document
export const canDeleteFile = (actor: PermissionUser, file: PortalFile) =>
  file.uploadedById === actor.id || (actor.role === 'system_admin' && file.accessLevel !== 'private');

export type UploadAccess = 'private' | 'department' | 'public';

export const fileService = {
  // GET /api/files — everything the caller is allowed to see
  async list(actor: PermissionUser): Promise<PortalFile[]> {
    await delay();
    return files.filter((file) => canSeeFile(actor, file));
  },

  // POST /api/files/upload
  async upload(actor: PermissionUser, file: globalThis.File, options: { category: string; taskId?: string; access?: UploadAccess }): Promise<PortalFile> {
    await delay();
    if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is larger than 10 MB`);
    const access = options.access ?? 'private';
    if (access === 'public' && !COMPANY_PUBLISHER_ROLES.includes(actor.role)) throw new Error('Only HR, Admin and Leadership can share a file with the whole company');
    const stored: PortalFile = {
      id: generateId(),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      uploadedBy: getUserById(actor.id)?.name ?? 'Unknown user',
      uploadedById: actor.id,
      uploadedDate: todayAsDateInput(),
      category: options.category,
      accessLevel: access,
      department: access === 'department' ? departmentOf(actor.id) : undefined,
      url: toObjectUrl(file),
      taskId: options.taskId,
    };
    files = [stored, ...files];
    return stored;
  },

  // DELETE /api/files/:id
  async remove(actor: PermissionUser, fileId: string): Promise<void> {
    await delay();
    const file = files.find((entry) => entry.id === fileId);
    if (!file) return;
    if (!canDeleteFile(actor, file)) throw new Error('You can only delete files you uploaded');
    files = files.filter((entry) => entry.id !== fileId);
  },

  // PATCH /api/files/link — attach files uploaded before their task existed (e.g. in Create task)
  async linkToTask(fileIds: string[], taskId: string): Promise<void> {
    files = files.map((file) => (fileIds.includes(file.id) ? { ...file, taskId } : file));
  },
};
