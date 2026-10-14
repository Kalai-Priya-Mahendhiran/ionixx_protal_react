import React, { createContext, useContext, useEffect, useState } from "react";

interface AttendanceContextType {
  isCheckedIn: boolean;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  checkIn: () => void;
  checkOut: () => void;
}

const STORAGE_KEY = "attendance-today";

interface StoredAttendance {
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
}

const todayKey = () => new Date().toISOString().split("T")[0];

const loadToday = (): StoredAttendance | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredAttendance = JSON.parse(raw);
    return parsed.date === todayKey() ? parsed : null;
  } catch {
    return null;
  }
};

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const stored = loadToday();
  const [checkInTime, setCheckInTime] = useState<Date | null>(
    stored?.checkInTime ? new Date(stored.checkInTime) : null
  );
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(
    stored?.checkOutTime ? new Date(stored.checkOutTime) : null
  );

  useEffect(() => {
    try {
      const data: StoredAttendance = {
        date: todayKey(),
        checkInTime: checkInTime ? checkInTime.toISOString() : null,
        checkOutTime: checkOutTime ? checkOutTime.toISOString() : null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }, [checkInTime, checkOutTime]);

  const checkIn = () => {
    setCheckInTime(new Date());
    setCheckOutTime(null);
  };

  const checkOut = () => {
    setCheckOutTime(new Date());
  };

  const value: AttendanceContextType = {
    isCheckedIn: !!checkInTime && !checkOutTime,
    checkInTime,
    checkOutTime,
    checkIn,
    checkOut,
  };

  return (
    <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>
  );
};
