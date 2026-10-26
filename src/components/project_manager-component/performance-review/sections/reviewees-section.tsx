import { Star, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PerformanceProfile } from "@/lib/team-data";
import { initials } from "@/lib/org-chart";
import { reviewStatusMeta } from "./performance-meta";

interface RevieweesSectionProps {
  profiles: PerformanceProfile[];
  isLoading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function RevieweesSection({ profiles, isLoading, selectedId, onSelect }: RevieweesSectionProps) {
  return (
    <Card className="border-0 shadow-lg lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#464EB8]" />
          <span>Reviewees</span>
        </CardTitle>
        <CardDescription>Pick an employee to evaluate.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {!isLoading && profiles.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">Nobody reports to you yet. People appear here as they join your team.</p>
          )}
          {profiles.map((p) => {
            const isActive = p.employeeId === selectedId;
            return (
              <button
                key={p.employeeId}
                onClick={() => onSelect(p.employeeId)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isActive
                    ? "border-[#464EB8] bg-[#464EB8]/5 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                      {initials(p.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 truncate">{p.employeeName}</p>
                      <Badge className={reviewStatusMeta[p.status].badge}>
                        {reviewStatusMeta[p.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{p.designation}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{p.reviewCycle}</span>
                      <span className="flex items-center gap-1">
                        {p.overallRating !== null ? (
                          <>
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium text-gray-700">{p.overallRating}</span>
                          </>
                        ) : (
                          <span className="italic">Not rated</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
