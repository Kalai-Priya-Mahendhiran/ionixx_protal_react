import { Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmployeeGoal } from "@/lib/team-data";
import { goalStatusMeta } from "./performance-meta";

interface GoalsSectionProps {
  goals: EmployeeGoal[];
}

export function GoalsSection({ goals }: GoalsSectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#464EB8]" />
          <span>Goals</span>
        </CardTitle>
        <CardDescription>Track progress on each weighted goal.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.length === 0 && <p className="text-sm text-gray-500">No goals set for this cycle yet.</p>}
          {goals.map((g) => {
            const meta = goalStatusMeta[g.status];
            return (
              <div key={g.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{g.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{g.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={meta.badge}>{meta.label}</Badge>
                    <p className="text-xs text-gray-500 mt-1">Weight {g.weight}%</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span className="font-medium">{g.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${meta.tone} transition-all`}
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
