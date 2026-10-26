import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  GraduationCap,
  Plus,
  Users,
  PlayCircle,
  BookOpen,
  Award,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageTabs } from "@/components/common-component/tabs";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { AssignLearnersDialog, AssignmentsSection, CoursesSection, CreateCourseDialog } from "./sections";
import { seedAssignments, seedCourses } from "./sections/training-data";
import type { Assignment, Course, NewCourse, Tab } from "./sections/training-meta";

export default function Training() {
  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [assignments, setAssignments] = useState<Assignment[]>(seedAssignments);
  const [activeTab, setActiveTab] = useState<Tab>("courses");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Course | null>(null);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c.status === "active").length;
    const totalLearners = assignments.length;
    const completed = assignments.filter((a) => a.status === "completed").length;
    const completionRate =
      totalLearners > 0 ? Math.round((completed / totalLearners) * 100) : 0;
    return { totalCourses, activeCourses, totalLearners, completionRate };
  }, [courses, assignments]);

  // The Total / Active cards filter the course list (and switch to the Courses tab)
  const [courseFilter, setCourseFilter] = useState<"all" | "active">("all");

  const selectCourseCard = (filter: "all" | "active") => {
    setActiveTab("courses");
    setCourseFilter((prev) => (prev === filter ? "all" : filter));
  };

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = courseFilter === "active" ? courses.filter((c) => c.status === "active") : courses;
    if (!term) return base;
    return base.filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term) ||
        c.instructor.toLowerCase().includes(term)
    );
  }, [courses, search, courseFilter]);

  const handleCreateCourse = (data: NewCourse) => {
    const newCourse: Course = {
      ...data,
      id: `CRS-${500 + courses.length + 1}`,
      enrolled: 0,
      completed: 0,
      status: "active",
    };
    setCourses((prev) => [newCourse, ...prev]);
    setShowCreateModal(false);
    toast.success(`"${newCourse.title}" published.`);
  };

  const handleAssignLearners = (course: Course, names: string[]) => {
    const newAssignments: Assignment[] = names.map((name, idx) => ({
      id: `ASN-${9000 + assignments.length + idx + 1}`,
      courseId: course.id,
      courseTitle: course.title,
      employeeName: name,
      employeeId: `EMP-${idx + 1}`,
      department: "—",
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400 * 1000).toISOString().slice(0, 10),
      progress: 0,
      status: "not-started",
    }));
    setAssignments((prev) => [...newAssignments, ...prev]);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === course.id ? { ...c, enrolled: c.enrolled + names.length } : c
      )
    );
    setAssignTarget(null);
    toast.success(`Assigned ${names.length} learner${names.length > 1 ? "s" : ""} to "${course.title}".`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={GraduationCap}
          title="Training"
          description={`${stats.activeCourses} active courses · ${stats.totalLearners} learners · ${stats.completionRate}% completion`}
          actions={
            <>
              <Button onClick={() => setShowCreateModal(true)} className={headerPrimaryButtonClass}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </>
          }
        />

        <StatGrid>
          <StatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses} tone="indigo" active={activeTab === "courses" && courseFilter === "all"} onClick={() => selectCourseCard("all")} />
          <StatCard icon={PlayCircle} label="Active" value={stats.activeCourses} tone="blue" active={activeTab === "courses" && courseFilter === "active"} onClick={() => selectCourseCard("active")} />
          <StatCard icon={Users} label="Learners" value={stats.totalLearners} tone="purple" />
          <StatCard icon={Award} label="Completion" value={`${stats.completionRate}%`} tone="green" />
        </StatGrid>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#464EB8]" />
              <span>Learning & Development</span>
            </CardTitle>
            <CardDescription>
              Author courses, assign learners, and track completion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PageTabs
              className="mb-4"
              label="Training"
              tabs={[
                { id: "courses", label: "Courses", count: courses.length },
                { id: "assignments", label: "Assignments", count: assignments.length },
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />

            {activeTab === "courses" && (
              <CoursesSection
                courses={filteredCourses}
                search={search}
                onSearchChange={setSearch}
                onAssign={(c) => setAssignTarget(c)}
              />
            )}

            {activeTab === "assignments" && (
              <AssignmentsSection assignments={assignments} />
            )}
          </CardContent>
        </Card>
      </div>

      <CreateCourseDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateCourse}
      />

      {assignTarget && (
        <AssignLearnersDialog
          course={assignTarget}
          onCancel={() => setAssignTarget(null)}
          onSubmit={(names) => handleAssignLearners(assignTarget, names)}
        />
      )}
    </MainLayout>
  );
}
