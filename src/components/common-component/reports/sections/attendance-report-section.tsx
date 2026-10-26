import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { AlarmClock, CheckCircle2, Clock, UserX } from 'lucide-react';

export function AttendanceReportSection() {
  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard icon={CheckCircle2} label="Attendance Rate" value="95%" tone="green" />
        <StatCard icon={Clock} label="Total Hours" value="168h" tone="blue" />
        <StatCard icon={AlarmClock} label="Late Arrivals" value={3} tone="amber" />
        <StatCard icon={UserX} label="Absent Days" value={1} tone="red" />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Week {i + 1}</p>
                  <p className="text-sm text-gray-600">Jan {i * 7 + 1} - Jan {(i + 1) * 7}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-green-100 text-green-800">Present: 5 days</Badge>
                  <Badge className="bg-yellow-100 text-yellow-800">Late: 1 day</Badge>
                  <Badge className="bg-red-100 text-red-800">Absent: 0 days</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
