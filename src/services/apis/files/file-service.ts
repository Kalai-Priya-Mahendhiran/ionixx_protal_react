import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleFiles } from '@/lib/sample-data/file-sample-data';
import { getUserById } from '@/lib/user-directory';
import { generateId, todayAsDateInput } from '@/lib/utils';
import type { File as PortalFile } from '@/types';

/*
 * Files module storage, shared by the Files page and task attachments.
 * In-memory mock (lasts until refresh). With the backend, `upload` becomes a multipart
 * POST /api/files/upload and `url` points at the stored file instead of a browser blob.
 */

export const TASK_ATTACHMENT_CATEGORY = 'task-attachments';
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const MOCK_LATENCY_MS = 300;

let files: PortalFile[] = sampleFiles.map((file) => ({ ...file }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

// Blob URLs let the uploaded file be opened during the session (unavailable in tests)
const toObjectUrl = (file: Blob) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '#');

export const fileService = {
  // GET /api/files — shared documents plus the caller's own uploads
  async list(actor: PermissionUser): Promise<PortalFile[]> {
    await delay();
    return files.filter((file) => !file.uploadedById || file.uploadedById === actor.id);
  },

  // POST /api/files/upload
  async upload(actor: PermissionUser, file: globalThis.File, options: { category: string; taskId?: string }): Promise<PortalFile> {
    await delay();
    if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is larger than 10 MB`);
    const stored: PortalFile = {
      id: generateId(),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      uploadedBy: getUserById(actor.id)?.name ?? 'Unknown user',
      uploadedById: actor.id,
      uploadedDate: todayAsDateInput(),
      category: options.category,
      accessLevel: 'private',
      url: toObjectUrl(file),
      taskId: options.taskId,
    };
    files = [stored, ...files];
    return stored;
  },

  // PATCH /api/files/link — attach files uploaded before their task existed (e.g. in Create task)
  async linkToTask(fileIds: string[], taskId: string): Promise<void> {
    files = files.map((file) => (fileIds.includes(file.id) ? { ...file, taskId } : file));
  },
};
