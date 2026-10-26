import { AlertTriangle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TeamAttendanceRow } from "@/services/apis/attendance/attendance-service";
import { initials } from "./attendance-monitoring-meta";

interface ExceptionsSectionProps {
  exceptions: TeamAttendanceRow[];
  onResolve: (userId: string) => void;
}

export function ExceptionsSection({ exceptions, onResolve }: ExceptionsSectionProps) {
  return (
    <Card className="border-0 shadow-lg border-l-4 border-l-amber-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
          <span>Exceptions to handle ({exceptions.length})</span>
        </CardTitle>
        <CardDescription>
          Late arrivals, absences and half days without a note. Resolve with a note to clear them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exceptions.map((e) => (
            <div
              key={e.userId}
              className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50/40 rounded-lg"
            >
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-amber-200 text-amber-900 text-xs font-semibold">
                  {initials(e.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                <p className="text-xs text-gray-600">{e.exception}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResolve(e.userId)}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Resolve
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
