import type { PerformanceProfile, EmployeeGoal } from "@/lib/team-data";

export const goalStatusMeta: Record<
  EmployeeGoal["status"],
  { label: string; badge: string; tone: string }
> = {
  "on-track": { label: "On Track", badge: "bg-green-100 text-green-800", tone: "bg-green-500" },
  "at-risk": { label: "At Risk", badge: "bg-yellow-100 text-yellow-800", tone: "bg-yellow-500" },
  "off-track": { label: "Off Track", badge: "bg-red-100 text-red-800", tone: "bg-red-500" },
  completed: { label: "Completed", badge: "bg-blue-100 text-blue-800", tone: "bg-blue-500" },
};

export const reviewStatusMeta: Record<
  PerformanceProfile["status"],
  { label: string; badge: string }
> = {
  draft: { label: "Draft", badge: "bg-gray-100 text-gray-700" },
  "in-review": { label: "In Review", badge: "bg-amber-100 text-amber-800" },
  submitted: { label: "Submitted", badge: "bg-green-100 text-green-800" },
};
