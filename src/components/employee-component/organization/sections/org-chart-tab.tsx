import { useState } from 'react';
import { ChevronRight, Crosshair, Info, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { chainTo, directReports, teamSize, topLevel, type OrgPerson } from '@/lib/org-chart';
import { PersonAvatar, StatusPill, YouBadge } from './org-shared';

interface OrgChartTabProps {
  people: OrgPerson[];
  viewerId: string;
  // Selected chain, top of the company first; each selection opens that person's team in the next panel
  path: string[];
  onPathChange: (path: string[]) => void;
  onOpenPerson: (person: OrgPerson) => void;
}

export function OrgChartTab({ people, viewerId, path, onPathChange, onOpenPerson }: OrgChartTabProps) {
  const [query, setQuery] = useState('');
  const byId = (id: string) => people.find((person) => person.id === id);
  const chain = path.map(byId).filter((person): person is OrgPerson => !!person);

  // Panel 1 is the top of the company; every selected person with a team adds a panel
  const columns: { title: string; subtitle: string; members: OrgPerson[] }[] = [
    { title: 'Leadership', subtitle: 'Top of the organization', members: topLevel(people) },
    ...chain
      .filter((person) => directReports(people, person.id).length > 0)
      .map((person) => ({ title: `${person.name.split(' ')[0]}'s team`, subtitle: `Reports to ${person.name}`, members: directReports(people, person.id) })),
  ];

  const select = (columnIndex: number, person: OrgPerson) => onPathChange([...path.slice(0, columnIndex), person.id]);

  const matches = query.trim()
    ? people.filter((person) => `${person.name} ${person.designation} ${person.employeeId}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a person in the chart" aria-label="Find a person in the chart" className="bg-white pl-9" />
            {matches.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg" role="listbox" aria-label="Matching people">
                {matches.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        onPathChange(chainTo(people, person.id).map((entry) => entry.id));
                        setQuery('');
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-indigo-50"
                    >
                      <PersonAvatar person={person} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">{person.name}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {person.designation} · {person.department}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button variant="outline" onClick={() => onPathChange(chainTo(people, viewerId).map((person) => person.id))}>
            <Crosshair className="mr-2 h-4 w-4" />
            My position
          </Button>
        </CardContent>
      </Card>

      {/* Reporting chain, clickable */}
      <nav aria-label="Reporting chain" className="flex flex-wrap items-center gap-1 text-sm">
        {chain.length === 0 ? (
          <span className="text-gray-500">Pick a person to see their team</span>
        ) : (
          chain.map((person, index) => (
            <span key={person.id} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />}
              <button
                type="button"
                onClick={() => onPathChange(path.slice(0, index + 1))}
                className={cn('rounded-md px-2 py-1', index === chain.length - 1 ? 'bg-indigo-50 font-semibold text-[#464EB8]' : 'text-gray-600 hover:bg-gray-100')}
              >
                {person.name}
              </button>
            </span>
          ))
        )}
      </nav>

      <div className="ionixx-scrollbar flex gap-4 overflow-x-auto pb-3">
        {columns.map((column, columnIndex) => (
          <section key={`${column.title}-${columnIndex}`} aria-label={column.subtitle} className="w-72 shrink-0 rounded-xl bg-white shadow-lg">
            <header className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-gray-900">{column.title}</h3>
                <p className="truncate text-xs text-gray-500">{column.subtitle}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                <Users className="h-3 w-3" aria-hidden="true" />
                {column.members.length}
              </span>
            </header>
            <ul className="space-y-1.5 p-2">
              {column.members.map((person) => {
                const selected = path[columnIndex] === person.id;
                const direct = directReports(people, person.id).length;
                const total = teamSize(people, person.id);
                return (
                  <li key={person.id} className="relative">
                    <button
                      type="button"
                      onClick={() => select(columnIndex, person)}
                      aria-pressed={selected}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-2.5 pr-10 text-left transition-colors',
                        selected ? 'border-[#464EB8] bg-indigo-50 shadow-sm' : 'border-transparent hover:border-gray-200 hover:bg-gray-50',
                      )}
                    >
                      <PersonAvatar person={person} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-gray-900">{person.name}</span>
                          {person.id === viewerId && <YouBadge />}
                        </span>
                        <span className="block truncate text-xs text-gray-500">{person.designation}</span>
                        {direct > 0 && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#464EB8]" title={`${direct} direct, ${total} in the whole team`}>
                            {direct} direct {direct === 1 ? 'report' : 'reports'}
                            {total > direct && <span className="text-gray-500">· {total} in team</span>}
                            <ChevronRight className="h-3 w-3" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPerson(person)}
                      aria-label={`View ${person.name}'s profile`}
                      title="View profile"
                      className="absolute right-2 top-2.5 rounded-md p-1 text-gray-400 hover:bg-white hover:text-[#464EB8]"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {columnIndex === columns.length - 1 && chain.at(-1) && directReports(people, chain.at(-1)!.id).length === 0 && path.length === columnIndex + 1 && (
              <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">{chain.at(-1)!.name} has no direct reports.</p>
            )}
          </section>
        ))}
      </div>

      {chain.at(-1) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>Selected:</span>
          <span className="font-medium text-gray-800">{chain.at(-1)!.name}</span>
          <StatusPill status={chain.at(-1)!.status} />
        </div>
      )}
    </div>
  );
}
