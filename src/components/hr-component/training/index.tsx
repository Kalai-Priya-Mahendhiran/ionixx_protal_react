import { useMemo, useState } from "react";
import {
  GraduationCap,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  PlayCircle,
  X,
  BookOpen,
  Award,
  Search,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { COURSE_LEVEL_COLORS, COURSE_STATUS_COLORS, TRAINING_ASSIGNMENT_STATUS_COLORS, TRAINING_ASSIGNMENT_STATUS_LABELS } from "@/lib/constants";

type Tab = "courses" | "assignments";

interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  enrolled: number;
  completed: number;
  status: "active" | "draft" | "archived";
  description: string;
  modules: number;
}

interface Assignment {
  id: string;
  courseId: string;
  courseTitle: string;
  employeeName: string;
  employeeId: string;
  department: string;
  assignedDate: string;
  dueDate: string;
  progress: number;
  status: "not-started" | "in-progress" | "completed" | "overdue";
}

const seedCourses: Course[] = [
  {
    id: "CRS-501",
    title: "Workplace Code of Conduct",
    category: "Compliance",
    instructor: "Anita Rajan",
    duration: "1h 15m",
    level: "Beginner",
    enrolled: 78,
    completed: 64,
    status: "active",
    description:
      "Mandatory annual training on workplace conduct, harassment prevention, and ethics.",
    modules: 5,
  },
  {
    id: "CRS-502",
    title: "Advanced React Patterns",
    category: "Engineering",
    instructor: "Arjun Rao",
    duration: "6h 30m",
    level: "Advanced",
    enrolled: 22,
    completed: 11,
    status: "active",
    description:
      "Deep dive into React performance, hooks, suspense, and design patterns.",
    modules: 12,
  },
  {
    id: "CRS-503",
    title: "Effective Communication",
    category: "Soft Skills",
    instructor: "Priya Kumar",
    duration: "2h 0m",
    level: "Beginner",
    enrolled: 45,
    completed: 30,
    status: "active",
    description:
      "Build clarity in writing, presentations, and cross-functional collaboration.",
    modules: 6,
  },
  {
    id: "CRS-504",
    title: "Cloud Security Fundamentals",
    category: "Security",
    instructor: "Divya Menon",
    duration: "4h 0m",
    level: "Intermediate",
    enrolled: 18,
    completed: 7,
    status: "active",
    description:
      "Understand IAM, key management, and cloud security best practices on AWS.",
    modules: 8,
  },
  {
    id: "CRS-505",
    title: "Leadership 101",
    category: "Soft Skills",
    instructor: "Mike Johnson",
    duration: "3h 0m",
    level: "Intermediate",
    enrolled: 9,
    completed: 2,
    status: "active",
    description: "Foundations of leading teams and giving feedback.",
    modules: 7,
  },
  {
    id: "CRS-506",
    title: "Design Thinking Workshop",
    category: "Design",
    instructor: "Rohit Deshmukh",
    duration: "5h 0m",
    level: "Intermediate",
    enrolled: 0,
    completed: 0,
    status: "draft",
    description: "Hands-on workshop on user research and ideation.",
    modules: 4,
  },
];

const seedAssignments: Assignment[] = [
  {
    id: "ASN-9001",
    courseId: "CRS-501",
    courseTitle: "Workplace Code of Conduct",
    employeeName: "Kalai Priya",
    employeeId: "EMP00101",
    department: "Engineering",
    assignedDate: "2026-04-01",
    dueDate: "2026-05-15",
    progress: 100,
    status: "completed",
  },
  {
    id: "ASN-9002",
    courseId: "CRS-501",
    courseTitle: "Workplace Code of Conduct",
    employeeName: "Karthik Subramanian",
    employeeId: "EMP00106",
    department: "Engineering",
    assignedDate: "2026-04-01",
    dueDate: "2026-05-15",
    progress: 60,
    status: "in-progress",
  },
  {
    id: "ASN-9003",
    courseId: "CRS-502",
    courseTitle: "Advanced React Patterns",
    employeeName: "Kalai Priya",
    employeeId: "EMP00101",
    department: "Engineering",
    assignedDate: "2026-04-15",
    dueDate: "2026-06-01",
    progress: 45,
    status: "in-progress",
  },
  {
    id: "ASN-9004",
    courseId: "CRS-504",
    courseTitle: "Cloud Security Fundamentals",
    employeeName: "Divya Menon",
    employeeId: "EMP00105",
    department: "Infrastructure",
    assignedDate: "2026-04-10",
    dueDate: "2026-05-30",
    progress: 80,
    status: "in-progress",
  },
  {
    id: "ASN-9005",
    courseId: "CRS-503",
    courseTitle: "Effective Communication",
    employeeName: "Meera Sundar",
    employeeId: "EMP00103",
    department: "Quality",
    assignedDate: "2026-03-20",
    dueDate: "2026-04-30",
    progress: 30,
    status: "overdue",
  },
  {
    id: "ASN-9006",
    courseId: "CRS-503",
    courseTitle: "Effective Communication",
    employeeName: "Sneha Iyer",
    employeeId: "EMP00107",
    department: "Human Resources",
    assignedDate: "2026-04-25",
    dueDate: "2026-05-25",
    progress: 0,
    status: "not-started",
  },
  {
    id: "ASN-9007",
    courseId: "CRS-501",
    courseTitle: "Workplace Code of Conduct",
    employeeName: "Arjun Rao",
    employeeId: "EMP00102",
    department: "Engineering",
    assignedDate: "2026-04-01",
    dueDate: "2026-05-15",
    progress: 100,
    status: "completed",
  },
];

export default function Training() {
  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [assignments, setAssignments] = useState<Assignment[]>(seedAssignments);
  const [activeTab, setActiveTab] = useState<Tab>("courses");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Course | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c.status === "active").length;
    const totalLearners = assignments.length;
    const completed = assignments.filter((a) => a.status === "completed").length;
    const completionRate =
      totalLearners > 0 ? Math.round((completed / totalLearners) * 100) : 0;
    return { totalCourses, activeCourses, totalLearners, completionRate };
  }, [courses, assignments]);

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term) ||
        c.instructor.toLowerCase().includes(term)
    );
  }, [courses, search]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleCreateCourse = (
    data: Omit<Course, "id" | "enrolled" | "completed" | "status">
  ) => {
    const newCourse: Course = {
      ...data,
      id: `CRS-${500 + courses.length + 1}`,
      enrolled: 0,
      completed: 0,
      status: "active",
    };
    setCourses((prev) => [newCourse, ...prev]);
    setShowCreateModal(false);
    showToast(`"${newCourse.title}" published.`);
  };

  const handleAssignLearners = (course: Course, names: string[]) => {
    const newAssignments: Assignment[] = names.map((name, idx) => ({
      id: `ASN-${9000 + assignments.length + idx + 1}`,
      courseId: course.id,
      courseTitle: course.title,
      employeeName: name,
      employeeId: `EMP-${idx + 1}`,
      department: "â€”",
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
    showToast(`Assigned ${names.length} learner${names.length > 1 ? "s" : ""} to "${course.title}".`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Training</h1>
                <p className="text-white/90 mt-1">
                  {stats.activeCourses} active courses Â· {stats.totalLearners} learners Â· {stats.completionRate}% completion
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-[#464EB8] hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Courses"
            count={stats.totalCourses}
            icon={<BookOpen className="h-6 w-6 text-indigo-600" />}
            tone="bg-indigo-50"
          />
          <SummaryCard
            label="Active"
            count={stats.activeCourses}
            icon={<PlayCircle className="h-6 w-6 text-blue-600" />}
            tone="bg-blue-50"
          />
          <SummaryCard
            label="Learners"
            count={stats.totalLearners}
            icon={<Users className="h-6 w-6 text-purple-600" />}
            tone="bg-purple-50"
          />
          <SummaryCard
            label="Completion"
            count={stats.completionRate}
            suffix="%"
            icon={<Award className="h-6 w-6 text-green-600" />}
            tone="bg-green-50"
          />
        </div>

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
            <div className="flex border-b border-gray-200 mb-4">
              <TabButton
                tab="courses"
                activeTab={activeTab}
                onClick={setActiveTab}
                count={courses.length}
              />
              <TabButton
                tab="assignments"
                activeTab={activeTab}
                onClick={setActiveTab}
                count={assignments.length}
              />
            </div>

            {activeTab === "courses" && (
              <CoursesView
                courses={filteredCourses}
                search={search}
                onSearchChange={setSearch}
                onAssign={(c) => setAssignTarget(c)}
              />
            )}

            {activeTab === "assignments" && (
              <AssignmentsView assignments={assignments} />
            )}
          </CardContent>
        </Card>
      </div>

      {showCreateModal && (
        <CreateCourseModal
          onCancel={() => setShowCreateModal(false)}
          onSubmit={handleCreateCourse}
        />
      )}

      {assignTarget && (
        <AssignLearnersModal
          course={assignTarget}
          onCancel={() => setAssignTarget(null)}
          onSubmit={(names) => handleAssignLearners(assignTarget, names)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm">
          <span>{toast}</span>
        </div>
      )}
    </MainLayout>
  );
}

function CoursesView({
  courses,
  search,
  onSearchChange,
  onAssign,
}: {
  courses: Course[];
  search: string;
  onSearchChange: (v: string) => void;
  onAssign: (c: Course) => void;
}) {
  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, category, or instructor"
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => {
          const completionPct =
            c.enrolled > 0 ? Math.round((c.completed / c.enrolled) * 100) : 0;
          return (
            <div
              key={c.id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#464EB8]/40 hover:shadow-md transition-all bg-white flex flex-col"
            >
              <div className="bg-gradient-to-br from-indigo-600/10 to-violet-600/10 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge className="bg-white text-gray-700 border border-gray-200">
                    {c.category}
                  </Badge>
                  <Badge className={COURSE_STATUS_COLORS[c.status]}>
                    {c.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 leading-tight">
                  {c.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{c.id}</p>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {c.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {c.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {c.modules} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {c.enrolled} enrolled
                  </span>
                  <Badge className={`${COURSE_LEVEL_COLORS[c.level]} w-fit`}>
                    {c.level}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Instructor: <span className="text-gray-800 font-medium">{c.instructor}</span>
                </p>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-medium text-gray-900">
                      {c.completed}/{c.enrolled || 0} Â· {completionPct}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-auto"
                  onClick={() => onAssign(c)}
                  disabled={c.status !== "active"}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Assign learners
                </Button>
              </div>
            </div>
          );
        })}
        {courses.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-500 py-12">
            No courses match your search.
          </div>
        )}
      </div>
    </>
  );
}

function AssignmentsView({ assignments }: { assignments: Assignment[] }) {
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

function CreateCourseModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (
    data: Omit<Course, "id" | "enrolled" | "completed" | "status">
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Engineering");
  const [instructor, setInstructor] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState<Course["level"]>("Beginner");
  const [modules, setModules] = useState(1);
  const [description, setDescription] = useState("");

  const canSubmit = title.trim() && instructor.trim() && duration.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Create Course</h2>
            <p className="text-xs text-white/80">Author a new training course.</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          <FormField label="Course title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option>Engineering</option>
                <option>Compliance</option>
                <option>Soft Skills</option>
                <option>Security</option>
                <option>Design</option>
                <option>Leadership</option>
              </select>
            </FormField>
            <FormField label="Level">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Course["level"])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Instructor">
              <input
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
            <FormField label="Duration">
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="2h 30m"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
          </div>
          <FormField label="Modules">
            <input
              type="number"
              min={1}
              value={modules}
              onChange={(e) => setModules(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </FormField>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                title,
                category,
                instructor,
                duration,
                level,
                modules,
                description,
              })
            }
            className="bg-[#464EB8] hover:bg-[#3a3f9a]"
          >
            Publish course
          </Button>
        </div>
      </div>
    </div>
  );
}

const candidateLearners = [
  "Kalai Priya",
  "Arjun Rao",
  "Meera Sundar",
  "Rohit Deshmukh",
  "Divya Menon",
  "Karthik Subramanian",
  "Sneha Iyer",
];

function AssignLearnersModal({
  course,
  onCancel,
  onSubmit,
}: {
  course: Course;
  onCancel: () => void;
  onSubmit: (names: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Assign Learners</h2>
            <p className="text-xs text-white/80 truncate">{course.title}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
          {candidateLearners.map((name) => {
            const isSelected = selected.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                className={`w-full text-left flex items-center justify-between p-3 border rounded-lg transition-all ${
                  isSelected
                    ? "border-[#464EB8] bg-[#464EB8]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900">{name}</span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-4 w-4 text-[#464EB8]" />
                )}
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={() => onSubmit(selected)}
            className="bg-[#464EB8] hover:bg-[#3a3f9a]"
          >
            Assign {selected.length || ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  tab,
  activeTab,
  onClick,
  count,
}: {
  tab: Tab;
  activeTab: Tab;
  onClick: (t: Tab) => void;
  count: number;
}) {
  const isActive = tab === activeTab;
  const labels: Record<Tab, string> = {
    courses: "Courses",
    assignments: "Assignments",
  };
  return (
    <button
      onClick={() => onClick(tab)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2 ${
        isActive
          ? "border-[#464EB8] text-[#464EB8]"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <span>{labels[tab]}</span>
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full ${
          isActive ? "bg-[#464EB8] text-white" : "bg-gray-100 text-gray-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function SummaryCard({
  label,
  count,
  icon,
  tone,
  suffix,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: string;
  suffix?: string;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {count}
            {suffix && (
              <span className="text-base font-semibold text-gray-500">
                {suffix}
              </span>
            )}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${tone}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
