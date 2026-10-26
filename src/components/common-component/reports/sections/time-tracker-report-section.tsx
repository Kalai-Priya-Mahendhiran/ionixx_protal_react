import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { Clock, FolderKanban, TrendingUp } from 'lucide-react';

export function TimeTrackerReportSection() {
  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard icon={Clock} label="Total Time" value="168h" tone="blue" />
        <StatCard icon={TrendingUp} label="Productivity" value="85%" tone="green" />
        <StatCard icon={FolderKanban} label="Active Projects" value={3} tone="purple" />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Project Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="font-medium">Employee Portal</span>
              </div>
              <div className="text-right">
                <p className="font-medium">120h</p>
                <p className="text-sm text-gray-600">71%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="font-medium">Mobile App</span>
              </div>
              <div className="text-right">
                <p className="font-medium">32h</p>
                <p className="text-sm text-gray-600">19%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="font-medium">API Development</span>
              </div>
              <div className="text-right">
                <p className="font-medium">16h</p>
                <p className="text-sm text-gray-600">10%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
