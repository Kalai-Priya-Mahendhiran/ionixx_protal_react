import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import { quickStats } from '@/lib/sample-data/dashboard-sample-data';
import { getIcon } from '@/lib/constants';

export function QuickStatsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {quickStats.map((stat, index) => {
        const Icon = getIcon(stat.icon);
        return (
          <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardContent className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <span className="flex items-center text-xs text-green-600 font-medium">
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-0.5" />
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
