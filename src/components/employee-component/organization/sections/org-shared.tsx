import { Building2, CalendarDays, GitBranch, IdCard, Mail, MapPin, Phone, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppSheet } from '@/components/ui/sheet';
import { STAT_TONE_CLASS } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import { directReports, initials, teamSize, type OrgPerson } from '@/lib/org-chart';
import { DEPARTMENTS, type WorkStatus } from '@/lib/sample-data/organization-sample-data';

// Avatar tile in the person's department colour (the portal's stat-card tones)
const toneOf = (department: string) => DEPARTMENTS.find((info) => info.name === department)?.tone ?? 'gray';

export function PersonAvatar({ person, size = 'md' }: { person: Pick<OrgPerson, 'name' | 'department'>; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-xl font-semibold', sizes[size], STAT_TONE_CLASS[toneOf(person.department)])} aria-hidden="true">
      {initials(person.name)}
    </span>
  );
}

const STATUS: Record<WorkStatus, { label: string; className: string }> = {
  'in-office': { label: 'In office', className: 'bg-teal-50 text-teal-700 ring-teal-600/20' },
  remote: { label: 'Remote', className: 'bg-sky-50 text-sky-700 ring-sky-600/20' },
  'on-leave': { label: 'On leave', className: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  invited: { label: 'Yet to join', className: 'bg-gray-50 text-gray-600 ring-gray-500/20' },
};

export function StatusPill({ status }: { status: WorkStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset', STATUS[status].className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS[status].label}
    </span>
  );
}

export const YouBadge = () => <span className="rounded-full bg-[#464EB8] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">You</span>;

const formatJoined = (date?: string) => (date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

interface PersonSheetProps {
  person: OrgPerson | null;
  people: OrgPerson[];
  viewerId: string;
  onClose: () => void;
  onOpenPerson: (person: OrgPerson) => void;
  onShowInChart: (person: OrgPerson) => void;
}

// Profile side panel, opened from any tab
export function PersonSheet({ person, people, viewerId, onClose, onOpenPerson, onShowInChart }: PersonSheetProps) {
  const manager = person?.managerId ? people.find((entry) => entry.id === person.managerId) : undefined;
  const reports = person ? directReports(people, person.id) : [];

  const details: { icon: typeof Mail; label: string; value: string; href?: string }[] = person
    ? [
        { icon: IdCard, label: 'Employee ID', value: person.employeeId },
        { icon: Building2, label: 'Department', value: person.department },
        { icon: Mail, label: 'Email', value: person.email, href: `mailto:${person.email}` },
        ...(person.phone ? [{ icon: Phone, label: 'Phone', value: person.phone, href: `tel:${person.phone.replace(/\s/g, '')}` }] : []),
        ...(person.location ? [{ icon: MapPin, label: 'Location', value: person.location }] : []),
        { icon: CalendarDays, label: 'Joined', value: formatJoined(person.joiningDate) },
      ]
    : [];

  return (
    <AppSheet
      open={!!person}
      onOpenChange={(open) => !open && onClose()}
      title={person?.name ?? 'Profile'}
      description={person?.designation}
      footer={
        person && (
          <Button
            className="w-full bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
            onClick={() => {
              onShowInChart(person);
              onClose();
            }}
          >
            <GitBranch className="mr-2 h-4 w-4" />
            Show in org chart
          </Button>
        )
      }
    >
      {person && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <PersonAvatar person={person} size="lg" />
            <div className="min-w-0 space-y-1">
              <p className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                {person.name}
                {person.id === viewerId && <YouBadge />}
              </p>
              <p className="text-sm text-gray-600">{person.designation}</p>
              <StatusPill status={person.status} />
            </div>
          </div>

          <dl className="space-y-2.5 text-sm">
            {details.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                <dt className="w-24 shrink-0 text-gray-500">{label}</dt>
                <dd className="min-w-0 break-words font-medium text-gray-900">
                  {href ? (
                    <a href={href} className="text-[#464EB8] hover:underline">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              Reports to
            </h3>
            {manager ? <PersonLink person={manager} onClick={() => onOpenPerson(manager)} /> : <p className="text-sm text-gray-500">Top of the organization</p>}
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Direct reports · {reports.length}
              {reports.length > 0 && teamSize(people, person.id) > reports.length && <span className="font-normal normal-case">({teamSize(people, person.id)} in the wider team)</span>}
            </h3>
            {reports.length === 0 ? (
              <p className="text-sm text-gray-500">No one reports to {person.name.split(' ')[0]}.</p>
            ) : (
              <div className="space-y-1.5">
                {reports.map((report) => (
                  <PersonLink key={report.id} person={report} onClick={() => onOpenPerson(report)} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppSheet>
  );
}

function PersonLink({ person, onClick }: { person: OrgPerson; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-2 text-left hover:border-indigo-200 hover:bg-indigo-50/50">
      <PersonAvatar person={person} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-gray-900">{person.name}</span>
        <span className="block truncate text-xs text-gray-500">{person.designation}</span>
      </span>
    </button>
  );
}
