import { useState } from 'react';
import { DEFAULT_WORKLOAD_THRESHOLD } from './task-utils';

const STORAGE_KEY = 'employee-portal.tasks.workloadThreshold';

const read = (): number => {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    return stored > 0 ? stored : DEFAULT_WORKLOAD_THRESHOLD;
  } catch {
    return DEFAULT_WORKLOAD_THRESHOLD;
  }
};

/*
 * Hours of remaining open work above which a person counts as overloaded.
 * A per-manager preference kept in this browser; with the backend it becomes
 * PUT /api/users/me/preferences { workloadThresholdHours }.
 */
export function useWorkloadThreshold(): [number, (hours: number) => void] {
  const [threshold, setThreshold] = useState(read);
  const update = (hours: number) => {
    setThreshold(hours);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(hours));
    } catch {
      // Storage can be unavailable (private mode); the value still applies for this visit
    }
  };
  return [threshold, update];
}
