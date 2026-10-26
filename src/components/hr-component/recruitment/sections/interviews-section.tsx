import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { INTERVIEW_MODE_COLORS } from "@/lib/constants";
import { formatDate, initials, type Interview } from "./recruitment-meta";

export function InterviewsSection({ interviews }: { interviews: Interview[] }) {
  return (
    <div className="space-y-3">
      {interviews.map((i) => (
        <div
          key={i.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-[#464EB8]/40 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              <Avatar className="w-11 h-11">
                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold">
                  {initials(i.candidateName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-gray-900">{i.candidateName}</p>
                  <span className="text-xs text-gray-500">·</span>
                  <span className="text-xs text-gray-500">{i.id}</span>
                  <Badge className={INTERVIEW_MODE_COLORS[i.mode]}>{i.mode}</Badge>
                </div>
                <p className="text-sm text-gray-700">{i.role}</p>
                <p className="text-xs text-gray-500 mt-1">Panel: {i.panel}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CalendarClock className="h-4 w-4 text-[#464EB8]" />
                <span className="font-medium">
                  {formatDate(i.date)} · {i.time}
                </span>
              </div>
              <Badge
                className={
                  i.status === "scheduled"
                    ? "bg-blue-100 text-blue-800 mt-2"
                    : i.status === "completed"
                    ? "bg-green-100 text-green-800 mt-2"
                    : "bg-red-100 text-red-800 mt-2"
                }
              >
                {i.status}
              </Badge>
            </div>
          </div>
        </div>
      ))}
      {interviews.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-12">
          No interviews scheduled.
        </div>
      )}
    </div>
  );
}
