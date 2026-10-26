import { ChevronRight, Clock, MapPin, Search, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JOB_POSTING_STATUS_COLORS } from "@/lib/constants";
import { formatDate, type JobPosting } from "./recruitment-meta";

export function PostingsSection({
  postings,
  search,
  onSearchChange,
}: {
  postings: JobPosting[];
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, department, or location"
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {postings.map((p) => (
          <div
            key={p.id}
            className="border border-gray-200 rounded-xl p-5 hover:border-[#464EB8]/40 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold text-gray-900 text-base">{p.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.id} · {p.department}</p>
              </div>
              <Badge className={JOB_POSTING_STATUS_COLORS[p.status]}>{p.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {p.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {p.type}
              </span>
              <span className="flex items-center gap-1">
                <Users2 className="h-3.5 w-3.5" />
                {p.experience}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Posted {formatDate(p.postedDate)}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-[#464EB8]">
                <span>{p.applicants} applicants</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
        {postings.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-500 py-12">
            No job postings match your search.
          </div>
        )}
      </div>
    </>
  );
}
