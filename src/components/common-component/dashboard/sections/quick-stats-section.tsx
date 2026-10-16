import { ArrowUpRight } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { quickStats } from '@/lib/sample-data/dashboard-sample-data';
import { getIcon } from '@/lib/constants';

export function QuickStatsSection() {
  return (
    <StatGrid>
      {quickStats.map((stat) => (
        <StatCard
          key={stat.label}
          icon={getIcon(stat.icon)}
          label={stat.label}
          value={stat.value}
          iconClassName={`${stat.bgColor} ${stat.color}`}
          hint={
            <span className="inline-flex items-center text-green-600">
              <ArrowUpRight className="mr-0.5 h-3 w-3" aria-hidden="true" />
              {stat.change}
            </span>
          }
        />
      ))}
    </StatGrid>
  );
}
