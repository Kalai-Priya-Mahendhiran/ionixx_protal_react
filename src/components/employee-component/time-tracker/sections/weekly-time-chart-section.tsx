import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export interface WeeklyTimeDistribution {
  project: string;
  hours: number;
  percentage: number;
  bgColor: string;
  dotColor: string;
}

interface WeeklyTimeChartSectionProps {
  distribution: WeeklyTimeDistribution[];
}

export function WeeklyTimeChartSection({ distribution }: WeeklyTimeChartSectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-[#464EB8]" />
          <span>Weekly Time Distribution</span>
        </CardTitle>
        <CardDescription>Time spent on different projects this week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distribution.map((item) => (
            <div key={item.project} className={`flex items-center justify-between p-3 ${item.bgColor} rounded-lg`}>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 ${item.dotColor} rounded`}></div>
                <span className="font-medium">{item.project}</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.hours.toFixed(1)}h</p>
                <p className="text-sm text-gray-600">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
