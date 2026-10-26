export type Tab = "courses" | "assignments";

export interface Course {
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

export interface Assignment {
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

// What the Create Course dialog hands back; the page fills in the rest
export type NewCourse = Omit<Course, "id" | "enrolled" | "completed" | "status">;

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
