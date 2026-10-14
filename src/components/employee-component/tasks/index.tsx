import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { sampleTasks } from '@/lib/sample-data/tasks-sample-data';
import { TaskStatsSection, TaskListSection, QuickActionsSection } from './sections';

export default function Tasks() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-2">Manage and track your tasks and assignments</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        </div>

        {/* Task Stats */}
        <TaskStatsSection tasks={sampleTasks} />

        {/* Filters and Search + Tasks List */}
        <TaskListSection tasks={sampleTasks} />

        {/* Quick Actions */}
        <QuickActionsSection />
      </div>
    </MainLayout>
  );
}
