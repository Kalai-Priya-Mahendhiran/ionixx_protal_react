import { ATTENDANCE_STATUS_META } from "@/components/common-component/attendance/sections/attendance-meta";
import type { AttendanceStatus } from "@/services/apis/attendance/attendance-service";

export type StatusFilter = "all" | AttendanceStatus;

// Filter options: every status that can apply to a working day
export const FILTER_STATUSES = (Object.keys(ATTENDANCE_STATUS_META) as AttendanceStatus[]).filter((status) => status !== "holiday");
// Days a manager should look at
export const NEEDS_ATTENTION: AttendanceStatus[] = ["late", "absent", "half-day"];

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
