import { AlertTriangle, Ban, Gauge, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import type { Task } from '@/types';
import { getWorkload } from './task-utils';
import { useWorkloadThreshold } from './use-workload-threshold';

interface WorkloadSectionProps {
  tasks: Task[];
  // The manager's team (or everyone, for admins); people with no open work still appear
  userIds: string[];
  onSelectPerson: (userId: string) => void;
}

export function WorkloadSection({ tasks, userIds, onSelectPerson }: WorkloadSectionProps) {
  const [threshold, setThreshold] = useWorkloadThreshold();
  const rows = getWorkload(tasks, userIds).sort((a, b) => b.remainingHours - a.remainingHours);
  const overloaded = rows.filter((row) => row.remainingHours > threshold);
  const totalRemaining = rows.reduce((sum, row) => sum + row.remainingHours, 0);
  // Bars are drawn against whichever is larger: the threshold or the busiest person
  const scale = Math.max(threshold, ...rows.map((row) => row.remainingHours), 1);

  const summary = [
    { label: 'People', value: rows.length, icon: Users, iconClass: 'bg-indigo-100 text-indigo-600' },
    { label: 'Overloaded', value: overloaded.length, icon: AlertTriangle, iconClass: 'bg-red-100 text-red-600' },
    { label: 'Hours remaining', value: `${Math.round(totalRemaining)}h`, icon: Gauge, iconClass: 'bg-blue-100 text-blue-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map(({ label, value, icon: Icon, iconClass }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn('rounded-lg p-2', iconClass)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team workload</h2>
              <p className="text-sm text-gray-500">Remaining hours = estimate minus logged time on open tasks. Click a person to see their board.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              Overloaded above
              <Input
                type="number"
                min={1}
                max={200}
                value={threshold}
                onChange={(event) => {
                  const hours = Number(event.target.value);
                  if (hours >= 1 && hours <= 200) setThreshold(hours);
                }}
                className="h-9 w-20"
                aria-label="Workload threshold in hours"
              />
              hours
            </label>
          </div>

          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-500">No one on your team yet.</p>
          ) : (
            <div className="ionixx-scrollbar relative overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-5 py-2.5">Person</th>
                    <th className="px-3 py-2.5 text-right">Open tasks</th>
                    <th className="px-3 py-2.5 text-right">Estimated</th>
                    <th className="px-3 py-2.5 text-right">Logged</th>
                    <th className="w-[30%] px-3 py-2.5">Remaining</th>
                    <th className="px-3 py-2.5">Attention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => {
                    const person = getUserById(row.userId);
                    const isOver = row.remainingHours > threshold;
                    return (
                      <tr
                        key={row.userId}
                        onClick={() => onSelectPerson(row.userId)}
                        className={cn('cursor-pointer hover:bg-indigo-50/40', isOver && 'bg-red-50/40')}
                      >
                        <td className="px-5 py-3">
                          <button type="button" className="flex items-center gap-3 text-left" aria-label={`Show ${person?.name}'s board`}>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                              {getInitials(person?.name ?? '?')}
                            </span>
                            <span>
                              <span className="block font-medium text-gray-900">{person?.name ?? 'Unknown user'}</span>
                              <span className="block text-xs text-gray-500">{person?.designation}</span>
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-gray-900">{row.openTasks}</td>
                        <td className="px-3 py-3 text-right text-gray-700">{row.estimateHours}h</td>
                        <td className="px-3 py-3 text-right text-gray-700">{row.loggedHours}h</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={cn('h-full rounded-full', isOver ? 'bg-red-500' : row.remainingHours > threshold * 0.8 ? 'bg-amber-400' : 'bg-[#464EB8]')}
                                style={{ width: `${(row.remainingHours / scale) * 100}%` }}
                              />
                              {/* Threshold marker */}
                              <div className="absolute inset-y-0 w-0.5 bg-gray-500" style={{ left: `${(threshold / scale) * 100}%` }} title={`${threshold}h threshold`} />
                            </div>
                            <span className={cn('w-14 text-right font-semibold', isOver ? 'text-red-700' : 'text-gray-900')}>{row.remainingHours}h</span>
                          </div>
                          {isOver && <p className="mt-1 text-xs font-medium text-red-700">Overloaded by {Math.round((row.remainingHours - threshold) * 10) / 10}h</p>}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {row.overdue > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                <AlertTriangle className="h-3 w-3" />
                                {row.overdue} overdue
                              </span>
                            )}
                            {row.blocked > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                <Ban className="h-3 w-3" />
                                {row.blocked} blocked
                              </span>
                            )}
                            {row.overdue === 0 && row.blocked === 0 && <span className="text-xs text-gray-400">—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
