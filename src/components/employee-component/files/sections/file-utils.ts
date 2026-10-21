import { Building2, FileText, GraduationCap, Paperclip, ShieldCheck, UserRound, Wallet, type LucideIcon } from 'lucide-react';
import type { StatTone } from '@/components/ui/stat-card';
import { ROLE_LABELS } from '@/lib/mock-users';
import { TASK_ATTACHMENT_CATEGORY } from '@/services/apis/files/file-service';
import type { File as PortalFile } from '@/types';

// Categories in display order, each with its card icon and colour
export const FILE_CATEGORIES: { id: string; label: string; icon: LucideIcon; tone: StatTone }[] = [
  { id: 'personal', label: 'My Documents', icon: UserRound, tone: 'purple' },
  { id: 'salary', label: 'Salary & Tax', icon: Wallet, tone: 'teal' },
  { id: 'department', label: 'My Department', icon: Building2, tone: 'sky' },
  { id: 'hr-policies', label: 'HR Policies', icon: ShieldCheck, tone: 'blue' },
  { id: 'training', label: 'Training', icon: GraduationCap, tone: 'amber' },
  { id: 'general', label: 'General', icon: FileText, tone: 'gray' },
  { id: TASK_ATTACHMENT_CATEGORY, label: 'Task Attachments', icon: Paperclip, tone: 'pink' },
];

// Categories people can upload into (task attachments are added from a task)
export const UPLOAD_CATEGORIES = FILE_CATEGORIES.filter((category) => category.id !== TASK_ATTACHMENT_CATEGORY);

export const categoryLabel = (id: string) => FILE_CATEGORIES.find((category) => category.id === id)?.label ?? id;

// Who can see the file, in words
export function accessLabel(file: PortalFile, viewerId: string): string {
  if (file.accessLevel === 'private') return file.uploadedById === viewerId || file.ownerId === viewerId ? 'Only you' : 'Private';
  if (file.accessLevel === 'department') return `${file.department ?? 'Department'} team`;
  if (file.roles) return file.roles.map((role) => ROLE_LABELS[role]).join(', ');
  return 'Everyone';
}

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0))} ${units[index]}`;
};

export const formatFileDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const isSample = (file: PortalFile) => file.url.startsWith('sample://');

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);

// Sample files have no stored content, so View shows a short summary page instead
const previewHtml = (file: PortalFile, viewerId: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(file.name)}</title>
<style>body{font-family:system-ui,sans-serif;margin:40px;color:#111827}h1{font-size:20px}dl{display:grid;grid-template-columns:140px 1fr;gap:6px 12px}dt{color:#6b7280}.note{margin-top:28px;padding:12px 14px;background:#eef2ff;border-radius:8px;color:#3730a3}</style></head>
<body><h1>${escapeHtml(file.name)}</h1><dl>
<dt>Category</dt><dd>${escapeHtml(categoryLabel(file.category))}</dd>
<dt>Shared with</dt><dd>${escapeHtml(accessLabel(file, viewerId))}</dd>
<dt>Uploaded by</dt><dd>${escapeHtml(file.uploadedBy)}</dd>
<dt>Uploaded on</dt><dd>${formatFileDate(file.uploadedDate)}</dd>
<dt>Size</dt><dd>${formatFileSize(file.size)}</dd></dl>
<p class="note">This is a sample document in the demo portal. Files you upload yourself open with their real content.</p></body></html>`;

// Opens the file in a new tab; returns false when the browser blocked the pop-up
export function viewFile(file: PortalFile, viewerId: string): boolean {
  if (!isSample(file)) return !!window.open(file.url, '_blank', 'noopener');
  const preview = window.open('', '_blank');
  if (!preview) return false;
  preview.document.write(previewHtml(file, viewerId));
  preview.document.close();
  return true;
}

export function downloadFile(file: PortalFile, viewerId: string) {
  const link = document.createElement('a');
  if (isSample(file)) {
    const url = URL.createObjectURL(new Blob([previewHtml(file, viewerId)], { type: 'text/html' }));
    link.href = url;
    link.download = `${file.name.replace(/\.[^.]+$/, '')}.html`;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  link.href = file.url;
  link.download = file.name;
  link.click();
}
