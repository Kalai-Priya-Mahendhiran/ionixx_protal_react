import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { categoryConfig, kpis, type Category } from "./kpi-meta";

interface HealthDistributionSectionProps {
  counts: { total: number; onTrack: number; atRisk: number; offTrack: number };
}

export function HealthDistributionSection({ counts }: HealthDistributionSectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#464EB8]" />
          <span>Health Distribution</span>
        </CardTitle>
        <CardDescription>KPI status across portfolio</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <HealthBar
            label="On track"
            count={counts.onTrack}
            total={counts.total}
            color="bg-green-500"
          />
          <HealthBar
            label="At risk"
            count={counts.atRisk}
            total={counts.total}
            color="bg-amber-500"
          />
          <HealthBar
            label="Off track"
            count={counts.offTrack}
            total={counts.total}
            color="bg-red-500"
          />
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">By Category</p>
          <ul className="space-y-2">
            {(Object.keys(categoryConfig) as Exclude<Category, "all">[]).map((cat) => {
              const items = kpis.filter((k) => k.category === cat);
              return (
                <li key={cat} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded ${categoryConfig[cat].tone}`}>
                      {categoryConfig[cat].icon}
                    </span>
                    <span className="text-gray-700">{categoryConfig[cat].label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{items.length} KPIs</span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">
          {count}/{total} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
