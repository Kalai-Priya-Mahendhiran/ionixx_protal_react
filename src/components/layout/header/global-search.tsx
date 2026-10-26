import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, FileText, LayoutGrid, LifeBuoy, Search, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants';
import { MODULE_CATALOG } from '@/lib/constants';
import { hasModuleAccess } from '@/lib/modules';
import { cn, getInitials } from '@/lib/utils';
import { useTasks } from '@/services/apis/tasks/use-tasks';
import { useFiles } from '@/services/apis/files/use-files';
import { useRequests } from '@/services/apis/service-desk/use-service-desk';
import { useOrgPeople } from '@/services/apis/users/use-org-chart';

/*
 * The header search: people, tasks, files, service desk requests and pages the signed-in person can open, as they type.
 * Each source only holds what that person may already see, so search never reveals anything new.
 * Enter opens the highlighted result (the first one by default); Ctrl/⌘ + K focuses the box from anywhere.
 */

const PER_GROUP = 5;

const GROUPS = ['People', 'Tasks', 'Requests', 'Files', 'Pages'] as const;
type Group = (typeof GROUPS)[number];

interface Result {
  id: string;
  group: Group;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  to: string;
}

const matches = (term: string, ...fields: (string | undefined)[]) => fields.some((field) => field?.toLowerCase().includes(term));

export function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const { data: people } = useOrgPeople();
  const { data: tasks = [] } = useTasks();
  const { data: files = [] } = useFiles();
  const { data: requests = [] } = useRequests();
  const canSeeTasks = hasModuleAccess(user, ROUTES.Tasks);
  const canSeePeople = hasModuleAccess(user, ROUTES.Organization);
  const canSeeFiles = hasModuleAccess(user, ROUTES.Files);
  const canSeeRequests = hasModuleAccess(user, ROUTES.ServiceDesk);

  const term = query.trim().toLowerCase();
  const results = useMemo<Result[]>(() => {
    if (!term) return [];
    const found: Result[] = [];
    if (canSeePeople) {
      people
        .filter((person) => matches(term, person.name, person.designation, person.department, person.employeeId, person.email))
        .slice(0, PER_GROUP)
        .forEach((person) =>
          found.push({
            id: `person:${person.id}`,
            group: 'People',
            title: person.name,
            subtitle: `${person.designation} · ${person.department}`,
            icon: <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">{getInitials(person.name)}</span>,
            to: `${ROUTES.Organization}?tab=directory&person=${encodeURIComponent(person.id)}`,
          }),
        );
    }
    if (canSeeTasks) {
      tasks
        .filter((task) => matches(term, task.key, task.title, ...task.labels))
        .slice(0, PER_GROUP)
        .forEach((task) =>
          found.push({ id: `task:${task.id}`, group: 'Tasks', title: task.title, subtitle: task.key, icon: <CheckSquare className="h-4 w-4 text-[#464EB8]" />, to: `${ROUTES.Tasks}/${task.key}` }),
        );
    }
    if (canSeeRequests) {
      requests
        .filter((request) => matches(term, request.key, request.title))
        .slice(0, PER_GROUP)
        .forEach((request) =>
          found.push({ id: `request:${request.id}`, group: 'Requests', title: request.title, subtitle: `${request.key} · ${request.status.replace(/-/g, ' ')}`, icon: <LifeBuoy className="h-4 w-4 text-amber-600" />, to: `${ROUTES.ServiceDesk}/${request.key}` }),
        );
    }
    if (canSeeFiles) {
      files
        .filter((file) => matches(term, file.name, file.category))
        .slice(0, PER_GROUP)
        .forEach((file) =>
          found.push({ id: `file:${file.id}`, group: 'Files', title: file.name, subtitle: file.category, icon: <FileText className="h-4 w-4 text-sky-600" />, to: `${ROUTES.Files}?q=${encodeURIComponent(file.name)}` }),
        );
    }
    MODULE_CATALOG.filter((module) => hasModuleAccess(user, module.path) && matches(term, module.label, module.group))
      .slice(0, PER_GROUP)
      .forEach((module) => found.push({ id: `page:${module.path}`, group: 'Pages', title: module.label, subtitle: module.group, icon: <LayoutGrid className="h-4 w-4 text-gray-500" />, to: module.path }));
    return found;
  }, [term, people, tasks, requests, files, canSeePeople, canSeeTasks, canSeeRequests, canSeeFiles, user]);

  // Ctrl/⌘ + K focuses the search; clicking outside closes the results
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const go = (result: Result) => {
    navigate(result.to);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (results.length) setHighlighted((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (!term) return;
      const result = results[highlighted] ?? results[0];
      if (result) go(result);
      else toast.info(`Nothing matches "${query.trim()}"`);
    } else if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showPanel = open && !!term;

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" aria-hidden="true" />
      <Input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlighted(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder="Search employees, tasks, or anything..."
        aria-label="Search people, tasks, requests, files and pages"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        aria-keyshortcuts="Control+K"
        role="combobox"
        autoComplete="off"
        className="pl-10 pr-4"
      />
      {showPanel && (
        <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
          {results.length === 0 ? (
            <p className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500">
              <UserRound className="h-4 w-4 text-gray-300" aria-hidden="true" />
              No people, tasks, requests, files or pages match “{query.trim()}”.
            </p>
          ) : (
            GROUPS.map((group) => {
              const inGroup = results.filter((result) => result.group === group);
              if (inGroup.length === 0) return null;
              return (
                <div key={group} className="py-1">
                  <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group}</p>
                  {inGroup.map((result) => {
                    const index = results.indexOf(result);
                    return (
                      <button
                        key={result.id}
                        type="button"
                        role="option"
                        aria-selected={index === highlighted}
                        onMouseEnter={() => setHighlighted(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => go(result)}
                        className={cn('flex w-full items-center gap-3 px-3 py-2 text-left', index === highlighted ? 'bg-indigo-50' : 'hover:bg-gray-50')}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center">{result.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-900">{result.title}</span>
                          {result.subtitle && <span className="block truncate text-xs text-gray-500">{result.subtitle}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
          <p className="border-t border-gray-100 px-3 pt-1.5 text-[11px] text-gray-400">↑ ↓ to move · Enter to open · Esc to close</p>
        </div>
      )}
    </div>
  );
}
