import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TRAINING_ASSIGNMENT_STATUS_COLORS, TRAINING_ASSIGNMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate, initials, type Assignment } from "./training-meta";

export function AssignmentsSection({ assignments }: { assignments: Assignment[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
            <th className="py-3 px-2">Learner</th>
            <th className="py-3 px-2">Course</th>
            <th className="py-3 px-2">Assigned</th>
            <th className="py-3 px-2">Due</th>
            <th className="py-3 px-2">Progress</th>
            <th className="py-3 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                      {initials(a.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{a.employeeName}</p>
                    <p className="text-xs text-gray-500">{a.department}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2 text-gray-700">{a.courseTitle}</td>
              <td className="py-3 px-2 text-gray-600">{formatDate(a.assignedDate)}</td>
              <td className="py-3 px-2 text-gray-600">{formatDate(a.dueDate)}</td>
              <td className="py-3 px-2 w-40">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 h-1.5 rounded-full"
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-9 text-right">
                    {a.progress}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-2">
                <Badge className={TRAINING_ASSIGNMENT_STATUS_COLORS[a.status]}>
                  {TRAINING_ASSIGNMENT_STATUS_LABELS[a.status]}
                </Badge>
              </td>
            </tr>
          ))}
          {assignments.length === 0 && (
            <tr>
              <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                No assignments yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
