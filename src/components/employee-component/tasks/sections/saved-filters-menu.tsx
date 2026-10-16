import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bookmark, BookmarkPlus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormDialog } from '@/components/ui/form-dialog';
import { TextField } from '@/components/ui/form-fields';
import { saveFilterSchema, type SaveFilterFormValues } from '@/lib/form-schemas/tasks';
import { cn } from '@/lib/utils';
import { useDeleteSavedFilter, useSaveFilter, useSavedFilters } from '@/services/apis/tasks/use-saved-filters';
import type { SavedFilter } from '@/types';

interface SavedFiltersMenuProps {
  // The current filters as a stable query string, plus the search text
  query: string;
  search: string;
  onApply: (filter: SavedFilter) => void;
}

const isSame = (filter: SavedFilter, query: string, search: string) => filter.query === query && (filter.search ?? '') === search.trim();

export function SavedFiltersMenu({ query, search, onApply }: SavedFiltersMenuProps) {
  const { data: filters = [] } = useSavedFilters();
  const saveFilter = useSaveFilter();
  const deleteFilter = useDeleteSavedFilter();
  const [naming, setNaming] = useState(false);
  const form = useForm<SaveFilterFormValues>({ resolver: zodResolver(saveFilterSchema), defaultValues: { name: '' } });

  useEffect(() => {
    if (naming) form.reset({ name: '' });
  }, [naming, form]);

  const hasFilters = query !== '' || search.trim() !== '';
  const active = filters.find((filter) => isSame(filter, query, search));

  const save = ({ name }: SaveFilterFormValues) => saveFilter.mutate({ name, query, search }, { onSuccess: () => setNaming(false) });

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn('h-9 gap-1.5', active && 'border-[#464EB8]/40 bg-indigo-50 text-[#464EB8]')}>
            <Bookmark className="h-4 w-4" />
            <span className="max-w-[10rem] truncate">{active ? active.name : 'Saved'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-white">
          <DropdownMenuLabel className="text-xs text-gray-500">Your saved filters</DropdownMenuLabel>
          {filters.length === 0 ? (
            <p className="px-2 pb-2 text-xs text-gray-500">None yet. Set some filters, then save them here to reuse with one click.</p>
          ) : (
            filters.map((filter) => (
              <DropdownMenuItem key={filter.id} onSelect={() => onApply(filter)} className="group justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Check className={cn('h-4 w-4 shrink-0 text-[#464EB8]', !isSame(filter, query, search) && 'invisible')} />
                  <span className="truncate">{filter.name}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Delete saved filter ${filter.name}`}
                  onClick={(event) => {
                    // Delete without applying the filter or closing the menu
                    event.preventDefault();
                    event.stopPropagation();
                    deleteFilter.mutate(filter.id);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!hasFilters} onSelect={() => setNaming(true)}>
            <BookmarkPlus className="text-gray-500" />
            Save current filters…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog
        open={naming}
        onOpenChange={setNaming}
        form={form}
        onSubmit={save}
        title="Save filters"
        description="Only you can see your saved filters. Saving with an existing name replaces it."
        size="sm"
        pending={saveFilter.isPending}
      >
        <TextField control={form.control} name="name" label="Filter name" required placeholder="e.g. Urgent bugs this week" maxLength={40} autoFocus />
      </FormDialog>
    </>
  );
}
