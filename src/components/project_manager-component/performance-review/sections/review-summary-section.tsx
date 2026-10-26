import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PerformanceProfile } from "@/lib/team-data";
import { initials } from "@/lib/org-chart";
import { reviewStatusMeta } from "./performance-meta";

interface ReviewSummarySectionProps {
  selected: PerformanceProfile;
}

export function ReviewSummarySection({ selected }: ReviewSummarySectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold">
                {initials(selected.employeeName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{selected.employeeName}</CardTitle>
              <CardDescription>
                {selected.designation} · {selected.reviewCycle}
              </CardDescription>
            </div>
          </div>
          <Badge className={reviewStatusMeta[selected.status].badge}>
            {reviewStatusMeta[selected.status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat
            label="Self rating"
            value={selected.selfRating !== null ? `${selected.selfRating}/5` : "—"}
          />
          <MiniStat
            label="Manager rating"
            value={selected.overallRating !== null ? `${selected.overallRating}/5` : "Pending"}
          />
          <MiniStat
            label="Last review"
            value={selected.lastReview ? new Date(selected.lastReview).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) : "—"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
