import type { TaskSettings } from '@/types';
import { createDefaultTaskSettings } from './task-settings-defaults';

/*
 * The settings currently in force. Permission and workflow helpers read them synchronously;
 * the settings service is the only writer. In-memory for the mock (resets on refresh);
 * with the backend this is loaded from GET /api/task-settings when the app starts.
 */

let current: TaskSettings = createDefaultTaskSettings();

export function getTaskSettings(): TaskSettings {
  return current;
}

export function replaceTaskSettings(next: TaskSettings): void {
  current = next;
}
