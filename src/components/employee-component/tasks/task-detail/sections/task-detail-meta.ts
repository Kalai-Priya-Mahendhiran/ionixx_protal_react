import type { TaskUpdateInput } from '@/services/apis/tasks/task-service';

// Saves one field of the task, checked like the Edit dialog would
export type SaveField = (label: string, patch: Partial<TaskUpdateInput>) => void;
