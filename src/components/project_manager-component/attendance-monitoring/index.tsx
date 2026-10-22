import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar as CalendarIcon,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FormDialog } from "@/components/ui/form-dialog";
import { TextareaField } from "@/components/ui/form-fields";
import { ATTENDANCE_STATUS_META } from "@/components/employee-component/attendance/sections/attendance-meta";
import { AttendanceIcon } from "@/components/employee-component/attendance/sections/attendance-status";
import { todayAsDateInput } from "@/lib/utils";
import type { AttendanceStatus, TeamAttendanceRow } from "@/services/apis/attendance/attendance-service";
import { useResolveAttendance, useTeamAttendance } from "@/services/apis/attendance/use-attendance";
import { resolveNoteSchema, type ResolveNoteFormValues } from "@/lib/form-schemas/system";

type StatusFilter = "all" | AttendanceStatus;

// Filter options: every status that can apply to a working day
const FILTER_STATUSES = (Object.keys(ATTENDANCE_STATUS_META) as AttendanceStatus[]).filter((status) => status !== "holiday");
// Days a manager should look at
const NEEDS_ATTENTION: AttendanceStatus[] = ["late", "absent", "half-day"];

const statusMeta = (status: AttendanceStatus) => ({
  label: ATTENDANCE_STATUS_META[status].label,
  badge: ATTENDANCE_STATUS_META[status].badge,
  icon: <AttendanceIcon status={status} />,
});

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

        {exceptions.length > 0 && (
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
                      onClick={() => openNote(e.userId)}
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
        )}

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#464EB8]" />
              <span>Team Attendance</span>
            </CardTitle>
            <CardDescription>Real-time view of today's check-ins.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or employee ID"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-56 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option value="all">All statuses</option>
                {FILTER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ATTENDANCE_STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
                    <th className="py-3 pr-4">Employee</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Check-in</th>
                    <th className="py-3 px-2">Check-out</th>
                    <th className="py-3 px-2">Note</th>
                    <th className="py-3 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => {
                    const meta = statusMeta(e.status);
                    const note = e.note;
                    return (
                      <tr key={e.userId} className="border-b border-gray-100 hover:bg-gray-50/60">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                                {initials(e.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{e.name}</p>
                              <p className="text-xs text-gray-500">{e.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center gap-1.5">
                            {meta.icon}
                            <Badge className={meta.badge}>{meta.label}</Badge>
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-700">{e.checkIn ?? "—"}</td>
                        <td className="py-3 px-2 text-gray-700">{e.checkOut ?? "—"}</td>
                        <td className="py-3 px-2 max-w-[18ch]">
                          {note ? (
                            <span className="text-xs text-gray-600 line-clamp-2" title={note}>
                              {note}
                            </span>
                          ) : e.exception ? (
                            <span className="text-xs text-amber-700">{e.exception}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pl-2 text-right">
                          {NEEDS_ATTENTION.includes(e.status) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openNote(e.userId)}
                              className="text-[#464EB8] border-[#464EB8]/30"
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              {note ? "Edit note" : "Add note"}
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">No action needed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                        {rows.length === 0 ? "No one reports to you yet." : "No matching attendance records."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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

function NoteDialog({
  open,
  employeeName,
  initialNote,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  employeeName: string;
  initialNote: string;
  onOpenChange: (open: boolean) => void;
  onSave: (note: string) => void;
}) {
  const form = useForm<ResolveNoteFormValues>({
    resolver: zodResolver(resolveNoteSchema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    if (open) form.reset({ note: initialNote });
  }, [open, initialNote, form]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={(values) => onSave(values.note.trim())}
      title={
        <span className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#464EB8]" />
          Resolve exception
        </span>
      }
      description={`Add a note for ${employeeName}.`}
      submitLabel="Save note"
    >
      <TextareaField
        control={form.control}
        name="note"
        label="Note"
        rows={4}
        placeholder="e.g. Approved late entry — informed via Slack."
        required
      />
    </FormDialog>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
