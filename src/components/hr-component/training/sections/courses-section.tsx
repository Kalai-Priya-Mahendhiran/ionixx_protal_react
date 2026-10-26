import { BookOpen, Clock, Plus, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COURSE_LEVEL_COLORS, COURSE_STATUS_COLORS } from "@/lib/constants";
import type { Course } from "./training-meta";

export function CoursesSection({
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
                      {c.completed}/{c.enrolled || 0} · {completionPct}%
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
