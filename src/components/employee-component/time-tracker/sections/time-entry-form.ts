import { todayAsDateInput } from '@/lib/utils';
import type { TimeEntryFormValues } from '@/lib/schemas';

export const emptyTimeEntry: TimeEntryFormValues = {
  project: '',
  module: '',
  task: '',
  description: '',
  date: todayAsDateInput(),
  startTime: '',
  endTime: '',
};

export const currentTimeOfDay = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export const hoursBetween = (startTime: string, endTime: string) => {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  return Math.round(((toMinutes(endTime) - toMinutes(startTime)) / 60) * 100) / 100;
};
