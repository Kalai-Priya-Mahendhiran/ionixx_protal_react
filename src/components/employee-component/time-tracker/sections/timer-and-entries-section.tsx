import { useEffect, useState, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, Play, Pause, Square, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { PROJECTS, MODULES, TASK_TYPES } from '@/lib/sample-data/time-tracker-sample-data';
import type { TimeEntry } from '@/types';
import { todayAsDateInput } from '@/lib/utils';
import { currentTimeOfDay } from './time-entry-form';

export type NewTimeEntry = Omit<TimeEntry, 'id' | 'userId' | 'status'>;

interface TimerAndEntriesSectionProps {
  entries: TimeEntry[];
  onRecordEntry: (entry: NewTimeEntry) => void;
  onAddEntry: () => void;
  onEditEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

const emptyTimerDetails = { project: '', module: '', task: '', description: '' };

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function TimerAndEntriesSection({ entries, onRecordEntry, onAddEntry, onEditEntry, onDeleteEntry }: TimerAndEntriesSectionProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [details, setDetails] = useState(emptyTimerDetails);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => setCurrentTime((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  const isTimerActive = isRunning || currentTime > 0;
  const missing = {
    project: !details.project,
    module: !details.module,
    task: !details.task,
    description: !details.description.trim(),
  };
  const detailsComplete = !Object.values(missing).some(Boolean);

  const updateDetail = (field: keyof typeof emptyTimerDetails) =>
    (event: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) =>
      setDetails((current) => ({ ...current, [field]: event.target.value }));

  const handleStart = () => {
    if (!detailsComplete) {
      setShowErrors(true);
      return;
    }
    if (!startedAt) setStartedAt(currentTimeOfDay());
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (currentTime > 0 && startedAt) {
      onRecordEntry({
        ...details,
        description: details.description.trim(),
        date: todayAsDateInput(),
        startTime: startedAt,
        endTime: currentTimeOfDay(),
        totalHours: Math.round(currentTime / 36) / 100,
      });
      setDetails(emptyTimerDetails);
    }
    setCurrentTime(0);
    setStartedAt(null);
    setShowErrors(false);
  };

  const fieldClass = 'w-full p-2 border border-gray-300 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30 disabled:bg-gray-100 disabled:text-gray-500';
  const errorText = (show: boolean, message: string) =>
    showErrors && show && <span className="mt-1 block text-xs text-red-600">{message}</span>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Timer */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Timer className="h-5 w-5 text-[#464EB8]" />
            <span>Time Tracker</span>
          </CardTitle>
          <CardDescription>Track time for current task</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-[#464EB8] mb-4 rounded-xl bg-indigo-50 py-4">
              {formatTime(currentTime)}
            </div>

            <div className="space-y-3 text-left">
              <label className="block text-sm font-medium text-gray-700">
                Project <span className="text-red-500">*</span>
                <select value={details.project} onChange={updateDetail('project')} disabled={isTimerActive} className={fieldClass}>
                  <option value="">Select project</option>
                  {PROJECTS.map((project) => <option key={project} value={project}>{project}</option>)}
                </select>
                {errorText(missing.project, 'Select a project')}
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Epic / Module <span className="text-red-500">*</span>
                <select value={details.module} onChange={updateDetail('module')} disabled={isTimerActive} className={fieldClass}>
                  <option value="">Select epic or module</option>
                  {MODULES.map((module) => <option key={module} value={module}>{module}</option>)}
                </select>
                {errorText(missing.module, 'Select an epic or module')}
              </label>

              <label className="block text-sm font-medium text-gray-700">
                User story / task <span className="text-red-500">*</span>
                <select value={details.task} onChange={updateDetail('task')} disabled={isTimerActive} className={fieldClass}>
                  <option value="">Select task type</option>
                  {TASK_TYPES.map((taskType) => <option key={taskType} value={taskType}>{taskType}</option>)}
                </select>
                {errorText(missing.task, 'Select a user story or task')}
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
                <textarea
                  value={details.description}
                  onChange={updateDetail('description')}
                  disabled={isTimerActive}
                  rows={2}
                  placeholder="What are you working on?"
                  className={fieldClass}
                />
                {errorText(missing.description, 'Enter a description')}
              </label>
            </div>

            <div className="flex space-x-2 mt-6">
              {!isRunning ? (
                <Button onClick={handleStart} className="flex-1 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                  <Play className="h-4 w-4 mr-2" />
                  {currentTime > 0 ? 'Resume' : 'Start'}
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline" className="flex-1 border-[#464EB8]/30 text-[#464EB8] hover:bg-[#464EB8]/5 hover:text-[#464EB8]">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={handleStop} variant="outline" disabled={!isTimerActive} aria-label="Stop and save entry" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                <Square className="h-4 w-4" />
              </Button>
            </div>
            {isTimerActive && (
              <p className="mt-2 text-xs text-gray-500">Press stop to save this time to Today's Time Entries.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Entries */}
      <Card className="lg:col-span-2 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-[#464EB8]" />
              <span>Today's Time Entries</span>
            </div>
            <Button size="sm" onClick={onAddEntry} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </CardTitle>
          <CardDescription>Your time entries for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg transition-colors hover:border-[#464EB8]/40 hover:bg-indigo-50/40">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{entry.project}</h4>
                    {entry.module && <Badge variant="outline" className="border-[#464EB8]/30 text-[#464EB8]">{entry.module}</Badge>}
                    <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">{entry.task}</Badge>
                    <Badge className={
                      entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                      entry.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {entry.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{entry.startTime} - {entry.endTime}</span>
                    <span>{entry.totalHours}h logged</span>
                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEditEntry(entry)} className="border-[#464EB8]/30 text-[#464EB8] hover:bg-[#464EB8]/5 hover:text-[#464EB8]">
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {entries.length === 0 && (
              <div className="text-center py-8">
                <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries today</h3>
                <p className="text-gray-600">Start tracking your time to see entries here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
