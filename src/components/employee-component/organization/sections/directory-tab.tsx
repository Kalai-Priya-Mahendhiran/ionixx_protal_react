import { useState } from 'react';
import { Building2, GitBranch, Mail, MapPin, Phone, Search, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OrgDepartment, OrgPerson } from '@/lib/org-chart';
import type { WorkStatus } from '@/lib/sample-data/organization-sample-data';
import { PersonAvatar, StatusPill, YouBadge } from './org-shared';

interface DirectoryTabProps {
  people: OrgPerson[];
  departments: OrgDepartment[];
  viewerId: string;
  onOpenPerson: (person: OrgPerson) => void;
  onShowInChart: (person: OrgPerson) => void;
}

const ALL = 'all';
const STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: 'in-office', label: 'In office' },
  { value: 'remote', label: 'Remote' },
  { value: 'on-leave', label: 'On leave' },
];

export function DirectoryTab({ people, departments, viewerId, onOpenPerson, onShowInChart }: DirectoryTabProps) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState(ALL);
  const [status, setStatus] = useState<WorkStatus | typeof ALL>(ALL);

  const term = query.trim().toLowerCase();
  const shown = people
    .filter((person) => !term || `${person.name} ${person.employeeId} ${person.email} ${person.designation}`.toLowerCase().includes(term))
    .filter((person) => department === ALL || person.department === department)
    .filter((person) => status === ALL || person.status === status)
    .sort((a, b) => a.name.localeCompare(b.name));
  const filtered = !!term || department !== ALL || status !== ALL;
  const managerName = (person: OrgPerson) => people.find((entry) => entry.id === person.managerId)?.name;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, employee ID, email or role" aria-label="Search people" className="bg-white pl-9" />
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="bg-white lg:w-52" aria-label="Department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All departments</SelectItem>
              {departments.map((entry) => (
                <SelectItem key={entry.name} value={entry.name}>
                  {entry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => setStatus(value as WorkStatus | typeof ALL)}>
            <SelectTrigger className="bg-white lg:w-40" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span>
          Showing <strong className="text-gray-900">{shown.length}</strong> of {people.length} people
        </span>
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[#464EB8]"
            onClick={() => {
              setQuery('');
              setDepartment(ALL);
              setStatus(ALL);
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {shown.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center text-sm text-gray-600">
            <UserRound className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
            No one matches these filters.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((person) => (
            <li key={person.id}>
              <Card className="h-full border-0 shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <PersonAvatar person={person} size="lg" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="flex flex-wrap items-center gap-1.5">
                        <button type="button" onClick={() => onOpenPerson(person)} className="truncate text-left font-semibold text-gray-900 hover:text-[#464EB8] hover:underline">
                          {person.name}
                        </button>
                        {person.id === viewerId && <YouBadge />}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {person.employeeId} · {person.designation}
                      </p>
                      <StatusPill status={person.status} />
                    </div>
                  </div>
                  <dl className="space-y-1.5 border-t border-gray-100 pt-3 text-xs">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                      <dt className="sr-only">Department</dt>
                      <dd className="truncate">{person.department}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                      <dt className="sr-only">Email</dt>
                      <dd className="truncate">
                        <a href={`mailto:${person.email}`} className="text-[#464EB8] hover:underline">
                          {person.email}
                        </a>
                      </dd>
                    </div>
                    {person.phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                        <dt className="sr-only">Phone</dt>
                        <dd className="truncate">{person.phone}</dd>
                      </div>
                    )}
                    {person.location && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                        <dt className="sr-only">Location</dt>
                        <dd className="truncate">{person.location}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <span className="truncate text-xs text-gray-500">{managerName(person) ? `Reports to ${managerName(person)}` : 'Leadership'}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-gray-500 hover:bg-indigo-50 hover:text-[#464EB8]" onClick={() => onShowInChart(person)} aria-label={`Show ${person.name} in the org chart`} title="Show in org chart">
                      <GitBranch className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
