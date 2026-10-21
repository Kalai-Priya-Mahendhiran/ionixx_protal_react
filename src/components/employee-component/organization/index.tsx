import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building, Building2, Contact, GitBranch, UserPlus, Users, UsersRound, type LucideIcon } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { chainTo, directReports, getDepartments, getOrgPeople, type OrgPerson } from '@/lib/org-chart';
import { DepartmentsTab, DirectoryTab, OrgChartTab, PersonSheet } from './sections';

type OrgTab = 'chart' | 'departments' | 'directory';

const TABS: { id: OrgTab; label: string; icon: LucideIcon }[] = [
  { id: 'chart', label: 'Org Chart', icon: GitBranch },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'directory', label: 'Directory', icon: Contact },
];

const isOrgTab = (value: string | null): value is OrgTab => TABS.some((tab) => tab.id === value);

export default function Organization() {
  const { user } = useAuth();
  // The tab lives in the URL (?tab=directory) so it can be linked
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: OrgTab = isOrgTab(tabParam) ? tabParam : 'chart';
  const openTab = (next: OrgTab) => setParams(next === 'chart' ? {} : { tab: next });

  const people = useMemo(() => getOrgPeople(), []);
  const departments = useMemo(() => getDepartments(people), [people]);
  const viewerId = user?.id ?? '';
  const viewer = people.find((person) => person.id === viewerId);

  // The chart opens on the signed-in person's place in the organization
  const [path, setPath] = useState<string[]>(() => chainTo(people, viewerId).map((person) => person.id));
  const [department, setDepartment] = useState(viewer?.department ?? departments[0]?.name ?? '');
  const [profile, setProfile] = useState<OrgPerson | null>(null);

  const showInChart = (person: OrgPerson) => {
    setPath(chainTo(people, person.id).map((entry) => entry.id));
    openTab('chart');
  };

  const thisYear = String(new Date().getFullYear());
  const managers = people.filter((person) => directReports(people, person.id).length > 0).length;
  const newJoiners = people.filter((person) => person.joiningDate?.startsWith(thisYear)).length;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader icon={Building} title="Organization" description="Who reports to whom, departments and everyone's contact details" />

        <StatGrid>
          <StatCard icon={Users} label="People" value={people.length} tone="indigo" onClick={() => openTab('directory')} />
          <StatCard icon={Building2} label="Departments" value={departments.length} tone="sky" onClick={() => openTab('departments')} />
          <StatCard icon={UsersRound} label="Managers" value={managers} tone="purple" onClick={() => openTab('chart')} />
          <StatCard icon={UserPlus} label={`Joined in ${thisYear}`} value={newJoiners} tone="teal" />
        </StatGrid>

        <div role="tablist" aria-label="Organization" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => openTab(id)}
              className={cn(
                '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                tab === id ? 'border-[#464EB8] text-[#464EB8]' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'chart' && <OrgChartTab people={people} viewerId={viewerId} path={path} onPathChange={setPath} onOpenPerson={setProfile} />}
        {tab === 'departments' && <DepartmentsTab departments={departments} people={people} viewerId={viewerId} selected={department} onSelect={setDepartment} onOpenPerson={setProfile} />}
        {tab === 'directory' && <DirectoryTab people={people} departments={departments} viewerId={viewerId} onOpenPerson={setProfile} onShowInChart={showInChart} />}
      </div>

      <PersonSheet person={profile} people={people} viewerId={viewerId} onClose={() => setProfile(null)} onOpenPerson={setProfile} onShowInChart={showInChart} />
    </MainLayout>
  );
}
