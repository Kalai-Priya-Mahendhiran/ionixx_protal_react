import { Cake, HeartHandshake, UserPlus, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildCelebrations, type CelebrationItem, type Celebrations } from '@/lib/dashboard-feeds';
import { initials } from '@/lib/org-chart';
import { getActiveUsers } from '@/lib/user-directory';
import { cn, todayAsDateInput } from '@/lib/utils';
import { useOrgPeople } from '@/services/apis/users/use-org-chart';
import { DASHBOARD_LIST_CLASS } from './dashboard-list';

// One card per kind of celebration; a new kind is one entry here plus its list in buildCelebrations
const CARDS: { key: keyof Celebrations; title: string; description: string; empty: string; icon: LucideIcon; tone: string }[] = [
  { key: 'birthdays', title: 'Birthdays', description: 'In the next 30 days', empty: 'No birthdays coming up.', icon: Cake, tone: 'bg-pink-100 text-pink-600' },
  { key: 'anniversaries', title: 'Work Anniversaries', description: 'Milestones in the next 30 days', empty: 'No anniversaries coming up.', icon: HeartHandshake, tone: 'bg-purple-100 text-purple-600' },
  { key: 'newJoiners', title: 'New Joiners', description: 'Welcome them to the team', empty: 'No one has joined recently.', icon: UserPlus, tone: 'bg-teal-100 text-teal-600' },
];

export function CelebrationCardsSection() {
  // Subscribed so people added or removed in User Management / HR update the cards
  useOrgPeople();
  const celebrations = buildCelebrations(getActiveUsers(), todayAsDateInput());

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {CARDS.map(({ key, title, description, empty, icon: Icon, tone }) => (
        <Card key={key} className="border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={cn('rounded-lg p-1.5', tone)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>{title}</span>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {celebrations[key].length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">{empty}</p>
            ) : (
              <ul className={DASHBOARD_LIST_CLASS}>
                {celebrations[key].map((item: CelebrationItem) => (
                  <li key={item.person.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold', tone)}>{initials(item.person.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{item.person.name}</span>
                      <span className="block truncate text-xs text-gray-500">{item.note}</span>
                    </span>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', item.when === 'Today' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600')}>{item.when}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
