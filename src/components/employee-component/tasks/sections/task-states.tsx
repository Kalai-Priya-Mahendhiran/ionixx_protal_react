import type { ReactNode } from 'react';
import { AlertCircle, CheckSquare, Plus, SearchX, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getBoardColumns } from './task-config';

export type TaskLayout = 'board' | 'list';

function StateCard({ icon: Icon, title, message, action }: { icon: LucideIcon; title: string; message: string; action?: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Icon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-gray-600">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}

function LoadingState({ layout }: { layout: TaskLayout }) {
  if (layout === 'board') {
    return (
      <div className="flex gap-4 overflow-hidden" aria-busy="true" aria-label="Loading tasks">
        {getBoardColumns().map((column) => (
          <div key={column.status} className="w-72 shrink-0 space-y-3 rounded-xl bg-indigo-50/50 p-3 xl:w-auto xl:flex-1">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            {[0, 1].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-lg bg-white shadow-sm" />
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading tasks">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardContent className="space-y-3 p-5">
            <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface TaskStatesProps {
  layout: TaskLayout;
  isLoading: boolean;
  isError: boolean;
  // True when the view has tasks but the search / status filter hides them all
  isFiltered: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onCreate?: () => void;
}

// Loading, error and empty states shared by the list and board layouts
export function TaskStates({ layout, isLoading, isError, isFiltered, onRetry, onClearFilters, onCreate }: TaskStatesProps) {
  if (isLoading) return <LoadingState layout={layout} />;

  if (isError) {
    return (
      <StateCard
        icon={AlertCircle}
        title="Couldn't load tasks"
        message="Something went wrong while fetching your tasks."
        action={<Button variant="outline" onClick={onRetry}>Try again</Button>}
      />
    );
  }

  if (isFiltered) {
    return (
      <StateCard
        icon={SearchX}
        title="No tasks match your filters"
        message="Try a different search term or status."
        action={<Button variant="outline" onClick={onClearFilters}>Clear filters</Button>}
      />
    );
  }

  return (
    <StateCard
      icon={CheckSquare}
      title="No tasks yet"
      message={onCreate ? 'Create your first task to get started.' : 'There are no tasks to show here.'}
      action={
        onCreate && (
          <Button onClick={onCreate} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        )
      }
    />
  );
}
