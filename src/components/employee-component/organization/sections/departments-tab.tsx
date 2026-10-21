import { Crown, Mail, Users } from 'lucide-react';
import { STAT_TONE_CLASS } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import { initials, type OrgDepartment, type OrgPerson } from '@/lib/org-chart';
import { PersonAvatar, StatusPill, YouBadge } from './org-shared';

interface DepartmentsTabProps {
  departments: OrgDepartment[];
  people: OrgPerson[];
  viewerId: string;
  selected: string;
  onSelect: (name: string) => void;
  onOpenPerson: (person: OrgPerson) => void;
}

export function DepartmentsTab({ departments, people, viewerId, selected, onSelect, onOpenPerson }: DepartmentsTabProps) {
  const department = departments.find((entry) => entry.name === selected) ?? departments[0];
  const managerName = (person: OrgPerson) => people.find((entry) => entry.id === person.managerId)?.name;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
      <nav aria-label="Departments" className="space-y-2">
        {departments.map((entry) => {
          const active = entry.name === department?.name;
          return (
            <button
              key={entry.name}
              type="button"
              onClick={() => onSelect(entry.name)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-colors',
                active ? 'border-[#464EB8] ring-1 ring-[#464EB8]' : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/40',
              )}
            >
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold', STAT_TONE_CLASS[entry.tone])} aria-hidden="true">
                {initials(entry.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900">{entry.name}</span>
                <span className="block truncate text-xs text-gray-500">{entry.email || entry.about}</span>
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', active ? 'bg-[#464EB8] text-white' : 'bg-gray-100 text-gray-600')}>{entry.people.length}</span>
            </button>
          );
        })}
      </nav>

      {department && (
        <section aria-label={department.name} className="rounded-xl bg-white shadow-lg">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold', STAT_TONE_CLASS[department.tone])} aria-hidden="true">
                {initials(department.name)}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{department.name}</h2>
                {department.about && <p className="text-sm text-gray-500">{department.about}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {department.people.length} {department.people.length === 1 ? 'person' : 'people'}
              </span>
              {department.email && (
                <a href={`mailto:${department.email}`} className="flex items-center gap-1.5 text-[#464EB8] hover:underline">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {department.email}
                </a>
              )}
            </div>
          </header>

          <ul className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {department.people.map((person) => {
              const isHead = person.id === department.head?.id;
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => onOpenPerson(person)}
                    className={cn('flex h-full w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40', isHead ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200')}
                  >
                    <PersonAvatar person={person} />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-gray-900">{person.name}</span>
                        {person.id === viewerId && <YouBadge />}
                      </span>
                      <span className="block truncate text-xs text-gray-500">{person.designation}</span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        {isHead && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                            <Crown className="h-3 w-3" aria-hidden="true" />
                            Head
                          </span>
                        )}
                        <StatusPill status={person.status} />
                      </span>
                      {!isHead && managerName(person) && <span className="block truncate text-[11px] text-gray-500">Reports to {managerName(person)}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
