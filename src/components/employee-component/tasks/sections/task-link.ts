import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants';

// Every task has its own page, e.g. /tasks/IXP-102, so a link can be shared with the team
export const taskPath = (key: string) => `${ROUTES.Tasks}/${key}`;

export async function copyTaskLink(task: { key: string }) {
  const url = `${window.location.origin}${taskPath(task.key)}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success(`Link to ${task.key} copied`, { description: url });
  } catch {
    toast.error("Couldn't copy the link", { description: url });
  }
}
