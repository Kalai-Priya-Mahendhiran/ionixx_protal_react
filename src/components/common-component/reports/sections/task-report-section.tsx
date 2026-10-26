import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { AlertTriangle, CheckCircle2, ListChecks, Loader } from 'lucide-react';

export function TaskReportSection() {
  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard icon={ListChecks} label="Total Tasks" value={20} tone="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={15} tone="green" />
        <StatCard icon={Loader} label="In Progress" value={3} tone="amber" />
        <StatCard icon={AlertTriangle} label="Overdue" value={2} tone="red" />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Task Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm text-gray-600">75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">On-time Delivery</span>
              <span className="text-sm text-gray-600">80%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quality Score</span>
              <span className="text-sm text-gray-600">90%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
