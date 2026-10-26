import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { CheckCircle2, FileText, Hourglass } from 'lucide-react';

export function LeaveReportSection() {
  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard icon={FileText} label="Total Requests" value={5} tone="blue" />
        <StatCard icon={CheckCircle2} label="Approved" value={4} tone="green" />
        <StatCard icon={Hourglass} label="Pending" value={1} tone="amber" />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-lg font-bold text-blue-600">12</p>
              <p className="text-sm text-gray-600">Casual Leave</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-lg font-bold text-red-600">7</p>
              <p className="text-sm text-gray-600">Sick Leave</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-lg font-bold text-green-600">15</p>
              <p className="text-sm text-gray-600">Earned Leave</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-lg font-bold text-purple-600">90</p>
              <p className="text-sm text-gray-600">Maternity Leave</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
