import React, { createContext, useContext } from "react";
import type { AttendanceStatus } from "@/services/apis/attendance/attendance-service";
import { useCheckIn, useCheckOut, useMyAttendanceToday } from "@/services/apis/attendance/use-attendance";

/*
 * Today's check-in state for the signed-in person, used by the dashboard and attendance widgets.
 * Backed by the attendance service, so checking in here shows on the manager's Attendance Monitoring,
 * the Attendance history and the dashboard at once (no per-browser copy).
 */

interface AttendanceContextType {
  isCheckedIn: boolean;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  // Today's status from the attendance rules (late after office start, WFH, on leave…)
  status: AttendanceStatus | null;
  checkIn: () => void;
  checkOut: () => void;
  busy: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
};

// 'HH:mm' today → Date
const atToday = (time: string | null) => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: today } = useMyAttendanceToday();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const checkInTime = atToday(today?.checkIn ?? null);
  const checkOutTime = atToday(today?.checkOut ?? null);

  const value: AttendanceContextType = {
    isCheckedIn: !!checkInTime && !checkOutTime,
    checkInTime,
    checkOutTime,
    status: today?.status ?? null,
    checkIn: () => checkIn.mutate(undefined),
    checkOut: () => checkOut.mutate(undefined),
    busy: checkIn.isPending || checkOut.isPending,
  };

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
};
