import { useNavigate } from 'react-router-dom';
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { getIcon, ROUTES } from '@/lib/constants';
import { hasModuleAccess } from '@/lib/modules';
import { useSidebarItems } from '@/services/apis/users/use-sidebar-items';

// Shortcuts to pages; each shows only if the person can open that page
const ACTIONS: { label: string; icon: string; path: string; color: string; hoverClass: string }[] = [
  { label: 'Add Task', icon: 'Plus', path: ROUTES.Tasks, color: 'text-blue-600', hoverClass: 'hover:bg-blue-50 hover:border-blue-300' },
  { label: 'Apply Leave', icon: 'Calendar', path: ROUTES.Leave, color: 'text-green-600', hoverClass: 'hover:bg-green-50 hover:border-green-300' },
  { label: 'Upload File', icon: 'Upload', path: ROUTES.Files, color: 'text-purple-600', hoverClass: 'hover:bg-purple-50 hover:border-purple-300' },
  { label: 'Log Time', icon: 'Timer', path: ROUTES.TimeTracker, color: 'text-sky-600', hoverClass: 'hover:bg-sky-50 hover:border-sky-300' },
  { label: 'Approvals', icon: 'CheckCheck', path: ROUTES.Approvals, color: 'text-amber-600', hoverClass: 'hover:bg-amber-50 hover:border-amber-300' },
  { label: 'View Team', icon: 'Users', path: ROUTES.Organization, color: 'text-orange-600', hoverClass: 'hover:bg-orange-50 hover:border-orange-300' },
  { label: 'Payslips', icon: 'Wallet', path: ROUTES.Pay, color: 'text-teal-600', hoverClass: 'hover:bg-teal-50 hover:border-teal-300' },
  { label: 'Reports', icon: 'TrendingUp', path: ROUTES.Reports, color: 'text-red-600', hoverClass: 'hover:bg-red-50 hover:border-red-300' },
];

export function QuickActionsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Subscribed so page access changes (e.g. becoming a team lead) update the shortcuts
  useSidebarItems(user);
  const actions = ACTIONS.filter((action) => hasModuleAccess(user, action.path)).slice(0, 6);

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          <span>Quick Actions</span>
        </CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {actions.map((action) => {
            const Icon = getIcon(action.icon, Plus);
            return (
              <Button key={action.label} variant="outline" onClick={() => navigate(action.path)} className={`flex h-20 flex-col items-center justify-center space-y-2 transition-all ${action.hoverClass}`}>
                <Icon className={`h-6 w-6 ${action.color}`} />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
