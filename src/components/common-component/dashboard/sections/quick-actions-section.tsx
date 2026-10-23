import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { quickActionLink, quickActionsFor } from '@/lib/quick-actions';
import { useSidebarItems } from '@/services/apis/users/use-sidebar-items';

// Same shortcuts as Quick Add (lib/quick-actions), plus a few pages; each shows only if the person can use it

export function QuickActionsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Subscribed so page access changes (e.g. becoming a team lead) update the shortcuts
  useSidebarItems(user);
  const actions = quickActionsFor(user).slice(0, 6);

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
            const Icon = action.icon;
            return (
              <Button key={action.id} variant="outline" onClick={() => navigate(quickActionLink(action))} className="flex h-20 flex-col items-center justify-center space-y-2 transition-all hover:border-[#464EB8]/40 hover:bg-gray-50">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
