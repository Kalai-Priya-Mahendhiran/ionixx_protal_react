import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar as CalendarIcon,
  Users,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { todayAsDateInput } from "@/lib/utils";
import type { AttendanceStatus, TeamAttendanceRow } from "@/services/apis/attendance/attendance-service";
import { useResolveAttendance, useTeamAttendance } from "@/services/apis/attendance/use-attendance";
import { ExceptionsSection, NoteDialog, TeamAttendanceSection } from "./sections";
import { NEEDS_ATTENTION, type StatusFilter } from "./sections/attendance-monitoring-meta";
import { ATTENDANCE_MONITORING_INFO } from "./sections/attendance-monitoring-info";

export default function AttendanceMonitoring() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  // The team's day from the attendance service: check-ins, approved leave and WFH show up as they happen
  const date = todayAsDateInput();
  const { data: rows = [], isLoading } = useTeamAttendance(date);
  const resolve = useResolveAttendance();
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const summary = useMemo(() => {
    const total = rows.length;
    const present = rows.filter((e) => e.status === "present" || e.status === "wfh").length;
    const late = rows.filter((e) => e.status === "late").length;
    const absent = rows.filter((e) => e.status === "absent").length;
    const onLeave = rows.filter((e) => e.status === "leave").length;
    return { total, present, late, absent, onLeave };
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((e) => {
      const matchSearch =
        !term ||
        e.name.toLowerCase().includes(term) ||
        e.employeeId.toLowerCase().includes(term);
      const matchFilter = filter === "all" || e.status === filter;
      return matchSearch && matchFilter;
    });
  }, [rows, search, filter]);

  const exceptions = useMemo(
    () =>
      rows.filter((e) => NEEDS_ATTENTION.includes(e.status) && !e.resolved),
    [rows]
  );

  // Stat cards share the status filter with the "All statuses" select; clicking the active card clears it
  const toggleCard = (status: AttendanceStatus) =>
    setFilter((prev) => (prev === status ? "all" : status));

  const openNote = (userId: string) => setActiveNote(userId);
  const activeRow: TeamAttendanceRow | undefined = rows.find((e) => e.userId === activeNote);

  const saveNote = (note: string) => {
    if (!activeNote) return;
    resolve.mutate({ userId: activeNote, date, note }, { onSuccess: () => setActiveNote(null) });
  };

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={ClipboardCheck}
          title="Attendance Monitoring"
          info={ATTENDANCE_MONITORING_INFO}
          description={dateLabel}
          actions={
            <>
              <div className="hidden md:block rounded-md border border-white/30 bg-white/15 px-3 py-1 text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/70">Attendance rate</p>
                <p className="text-lg font-bold leading-tight">
                  {summary.total === 0
                    ? "—"
                    : `${Math.round(((summary.present + summary.late) / summary.total) * 100)}%`}
                </p>
              </div>
            </>
          }
        />

        <StatGrid>
          <StatCard icon={Users} label="Total" value={summary.total} tone="indigo" loading={isLoading} active={filter === "all"} onClick={() => setFilter("all")} />
          <StatCard icon={CheckCircle2} label="Present" value={summary.present} tone="green" active={filter === "present"} onClick={() => toggleCard("present")} />
          <StatCard icon={AlertTriangle} label="Late" value={summary.late} tone="amber" active={filter === "late"} onClick={() => toggleCard("late")} />
          <StatCard icon={XCircle} label="Absent" value={summary.absent} tone="red" active={filter === "absent"} onClick={() => toggleCard("absent")} />
          <StatCard icon={CalendarIcon} label="On Leave" value={summary.onLeave} tone="blue" active={filter === "leave"} onClick={() => toggleCard("leave")} />
        </StatGrid>

        {exceptions.length > 0 && <ExceptionsSection exceptions={exceptions} onResolve={openNote} />}

        <TeamAttendanceSection
          rows={rows}
          filtered={filtered}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          onOpenNote={openNote}
        />
      </div>

      <NoteDialog
        open={!!activeNote}
        employeeName={activeRow?.name ?? ""}
        initialNote={activeRow?.note ?? ""}
        onOpenChange={(open) => !open && setActiveNote(null)}
        onSave={saveNote}
      />
    </MainLayout>
  );
}
