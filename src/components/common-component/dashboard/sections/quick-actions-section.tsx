import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Zap } from 'lucide-react';
import { quickActions } from '@/lib/sample-data/dashboard-sample-data';
import { getIcon } from '@/lib/constants';

export function QuickActionsSection() {
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const Icon = getIcon(action.icon, Plus);
            return (
              <Button
                key={action.label}
                variant="outline"
                className={`h-20 flex flex-col items-center justify-center space-y-2 transition-all ${action.hoverClass}`}
              >
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
