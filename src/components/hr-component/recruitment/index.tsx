import { useMemo, useState } from "react";
import {
  Briefcase,
  Plus,
  MapPin,
  Clock,
  Users2,
  CalendarClock,
  Mail,
  Phone,
  X,
  ChevronRight,
  Search,
  CheckCircle2,
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
import { CANDIDATE_STAGE_ORDER, CANDIDATE_STAGE_LABELS, CANDIDATE_STAGE_COLORS, JOB_POSTING_STATUS_COLORS, INTERVIEW_MODE_COLORS } from "@/lib/constants";

type Tab = "postings" | "candidates" | "interviews";

type Stage =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Contract" | "Intern";
  experience: string;
  status: "open" | "closed" | "draft";
  postedDate: string;
  applicants: number;
  description: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  appliedFor: string;
  experience: string;
  stage: Stage;
  appliedDate: string;
  rating: number;
}

interface Interview {
  id: string;
  candidateName: string;
  role: string;
  panel: string;
  date: string;
  time: string;
  mode: "On-site" | "Video" | "Phone";
  status: "scheduled" | "completed" | "cancelled";
}

const seedPostings: JobPosting[] = [
  {
    id: "JOB-101",
    title: "Senior React Engineer",
    department: "Engineering",
    location: "Chennai, IN",
    type: "Full-time",
    experience: "5-7 years",
    status: "open",
    postedDate: "2026-04-22",
    applicants: 24,
    description:
      "Lead front-end development of the new HR portal. Experience with React, TypeScript, and design systems.",
  },
  {
    id: "JOB-102",
    title: "DevOps Engineer",
    department: "Infrastructure",
    location: "Remote, IN",
    type: "Full-time",
    experience: "3-5 years",
    status: "open",
    postedDate: "2026-04-28",
    applicants: 12,
    description:
      "Own CI/CD, cloud infrastructure, and observability. Strong AWS and Terraform skills required.",
  },
  {
    id: "JOB-103",
    title: "Product Designer",
    department: "Design",
    location: "Bengaluru, IN",
    type: "Full-time",
    experience: "3+ years",
    status: "open",
    postedDate: "2026-05-01",
    applicants: 18,
    description:
      "Design end-to-end user experiences for our employee-facing products.",
  },
  {
    id: "JOB-104",
    title: "QA Automation Intern",
    department: "Quality",
    location: "Chennai, IN",
    type: "Intern",
    experience: "0-1 years",
    status: "open",
    postedDate: "2026-05-04",
    applicants: 31,
    description: "Build automated test suites in Cypress / Playwright.",
  },
  {
    id: "JOB-105",
    title: "Backend Engineer (Go)",
    department: "Engineering",
    location: "Hyderabad, IN",
    type: "Full-time",
    experience: "4-6 years",
    status: "closed",
    postedDate: "2026-02-15",
    applicants: 42,
    description: "Closed â€” role filled in March 2026.",
  },
  {
    id: "JOB-106",
    title: "HR Business Partner",
    department: "Human Resources",
    location: "Chennai, IN",
    type: "Full-time",
    experience: "6+ years",
    status: "draft",
    postedDate: "2026-05-06",
    applicants: 0,
    description: "Draft â€” not yet published.",
  },
];

const seedCandidates: Candidate[] = [
  {
    id: "CAN-2001",
    name: "Aanya Krishnan",
    email: "aanya.k@example.com",
    phone: "+91 90000 20001",
    appliedFor: "Senior React Engineer",
    experience: "6 years",
    stage: "interview",
    appliedDate: "2026-04-26",
    rating: 4,
  },
  {
    id: "CAN-2002",
    name: "Sandeep Kumar",
    email: "sandeep.k@example.com",
    phone: "+91 90000 20002",
    appliedFor: "Senior React Engineer",
    experience: "5 years",
    stage: "screening",
    appliedDate: "2026-04-30",
    rating: 3,
  },
  {
    id: "CAN-2003",
    name: "Priya Nathan",
    email: "priya.n@example.com",
    phone: "+91 90000 20003",
    appliedFor: "DevOps Engineer",
    experience: "4 years",
    stage: "offer",
    appliedDate: "2026-04-29",
    rating: 5,
  },
  {
    id: "CAN-2004",
    name: "Rahul Mehta",
    email: "rahul.m@example.com",
    phone: "+91 90000 20004",
    appliedFor: "Product Designer",
    experience: "3 years",
    stage: "applied",
    appliedDate: "2026-05-04",
    rating: 0,
  },
  {
    id: "CAN-2005",
    name: "Tina Joseph",
    email: "tina.j@example.com",
    phone: "+91 90000 20005",
    appliedFor: "Product Designer",
    experience: "5 years",
    stage: "interview",
    appliedDate: "2026-05-02",
    rating: 4,
  },
  {
    id: "CAN-2006",
    name: "Naveen Pillai",
    email: "naveen.p@example.com",
    phone: "+91 90000 20006",
    appliedFor: "QA Automation Intern",
    experience: "Internship",
    stage: "applied",
    appliedDate: "2026-05-05",
    rating: 0,
  },
  {
    id: "CAN-2007",
    name: "Kiran Bhatt",
    email: "kiran.b@example.com",
    phone: "+91 90000 20007",
    appliedFor: "Senior React Engineer",
    experience: "7 years",
    stage: "hired",
    appliedDate: "2026-04-12",
    rating: 5,
  },
  {
    id: "CAN-2008",
    name: "Manoj Iyer",
    email: "manoj.i@example.com",
    phone: "+91 90000 20008",
    appliedFor: "DevOps Engineer",
    experience: "2 years",
    stage: "rejected",
    appliedDate: "2026-04-18",
    rating: 2,
  },
];

const seedInterviews: Interview[] = [
  {
    id: "INT-301",
    candidateName: "Aanya Krishnan",
    role: "Senior React Engineer",
    panel: "Priya Kumar, Arjun Rao",
    date: "2026-05-09",
    time: "11:00",
    mode: "Video",
    status: "scheduled",
  },
  {
    id: "INT-302",
    candidateName: "Tina Joseph",
    role: "Product Designer",
    panel: "Rohit Deshmukh",
    date: "2026-05-10",
    time: "15:00",
    mode: "On-site",
    status: "scheduled",
  },
  {
    id: "INT-303",
    candidateName: "Priya Nathan",
    role: "DevOps Engineer",
    panel: "Divya Menon, Priya Kumar",
    date: "2026-05-06",
    time: "10:30",
    mode: "Video",
    status: "completed",
  },
  {
    id: "INT-304",
    candidateName: "Sandeep Kumar",
    role: "Senior React Engineer",
    panel: "Priya Kumar",
    date: "2026-05-12",
    time: "14:00",
    mode: "Phone",
    status: "scheduled",
  },
];

export default function Recruitment() {
  const [postings, setPostings] = useState<JobPosting[]>(seedPostings);
  const [candidates, setCandidates] = useState<Candidate[]>(seedCandidates);
  const [interviews] = useState<Interview[]>(seedInterviews);
  const [activeTab, setActiveTab] = useState<Tab>("postings");
  const [search, setSearch] = useState("");
  const [showJobModal, setShowJobModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      open: postings.filter((p) => p.status === "open").length,
      candidates: candidates.length,
      interviews: interviews.filter((i) => i.status === "scheduled").length,
      hires: candidates.filter((c) => c.stage === "hired").length,
    };
  }, [postings, candidates, interviews]);

  const filteredPostings = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return postings;
    return postings.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.department.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term)
    );
  }, [postings, search]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const advanceStage = (id: string) => {
    const target = candidates.find((c) => c.id === id);
    if (!target) return;
    const idx = (CANDIDATE_STAGE_ORDER as readonly Stage[]).indexOf(target.stage);
    if (idx < 0 || idx >= CANDIDATE_STAGE_ORDER.length - 1) return;
    const next = CANDIDATE_STAGE_ORDER[idx + 1];
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: next } : c))
    );
    showToast(`${target.name} moved to ${CANDIDATE_STAGE_LABELS[next]}.`);
  };

  const rejectCandidate = (id: string) => {
    const target = candidates.find((c) => c.id === id);
    if (!target) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: "rejected" } : c))
    );
    showToast(`${target.name} rejected.`);
  };

  const handleAddJob = (data: Omit<JobPosting, "id" | "applicants" | "postedDate" | "status">) => {
    const newJob: JobPosting = {
      ...data,
      id: `JOB-${100 + postings.length + 1}`,
      applicants: 0,
      postedDate: new Date().toISOString().slice(0, 10),
      status: "open",
    };
    setPostings((prev) => [newJob, ...prev]);
    setShowJobModal(false);
    showToast(`"${newJob.title}" posted.`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Briefcase className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Recruitment</h1>
                <p className="text-white/90 mt-1">
                  {stats.open} open roles Â· {stats.candidates} candidates Â· {stats.interviews} interviews scheduled
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowJobModal(true)}
              className="bg-white text-[#464EB8] hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Post Job
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Open Roles"
            count={stats.open}
            icon={<Briefcase className="h-6 w-6 text-indigo-600" />}
            tone="bg-indigo-50"
          />
          <SummaryCard
            label="Candidates"
            count={stats.candidates}
            icon={<Users2 className="h-6 w-6 text-blue-600" />}
            tone="bg-blue-50"
          />
          <SummaryCard
            label="Interviews"
            count={stats.interviews}
            icon={<CalendarClock className="h-6 w-6 text-purple-600" />}
            tone="bg-purple-50"
          />
          <SummaryCard
            label="Hired"
            count={stats.hires}
            icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
            tone="bg-green-50"
          />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#464EB8]" />
              <span>Hiring Pipeline</span>
            </CardTitle>
            <CardDescription>
              Manage job postings, candidates, and interviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex border-b border-gray-200 mb-4">
              <TabButton
                tab="postings"
                activeTab={activeTab}
                onClick={setActiveTab}
                count={postings.length}
              />
              <TabButton
                tab="candidates"
                activeTab={activeTab}
                onClick={setActiveTab}
                count={candidates.length}
              />
              <TabButton
                tab="interviews"
                activeTab={activeTab}
                onClick={setActiveTab}
                count={interviews.length}
              />
            </div>

            {activeTab === "postings" && (
              <PostingsView
                postings={filteredPostings}
                search={search}
                onSearchChange={setSearch}
              />
            )}

            {activeTab === "candidates" && (
              <CandidatesView
                candidates={candidates}
                onAdvance={advanceStage}
                onReject={rejectCandidate}
              />
            )}

            {activeTab === "interviews" && (
              <InterviewsView interviews={interviews} />
            )}
          </CardContent>
        </Card>
      </div>

      {showJobModal && (
        <PostJobModal
          onCancel={() => setShowJobModal(false)}
          onSubmit={handleAddJob}
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

function PostingsView({
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
                <p className="text-xs text-gray-500 mt-0.5">{p.id} Â· {p.department}</p>
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

function CandidatesView({
  candidates,
  onAdvance,
  onReject,
}: {
  candidates: Candidate[];
  onAdvance: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [selected, setSelected] = useState<Candidate | null>(null);

  const grouped = useMemo(() => {
    const result: Record<Stage, Candidate[]> = {
      applied: [],
      screening: [],
      interview: [],
      offer: [],
      hired: [],
      rejected: [],
    };
    candidates.forEach((c) => result[c.stage].push(c));
    return result;
  }, [candidates]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {CANDIDATE_STAGE_ORDER.map((stage) => (
          <div
            key={stage}
            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase text-gray-600 tracking-wide">
                {CANDIDATE_STAGE_LABELS[stage]}
              </p>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                {grouped[stage].length}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[stage].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="w-full text-left bg-white border border-gray-200 rounded-md p-3 hover:border-[#464EB8]/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-[10px] font-semibold">
                        {initials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.name}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.appliedFor}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Applied {formatDate(c.appliedDate)}
                  </p>
                </button>
              ))}
              {grouped[stage].length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-2">
                  No candidates
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {grouped.rejected.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
            Rejected ({grouped.rejected.length})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {grouped.rejected.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="text-left bg-red-50 border border-red-100 rounded-md p-2 text-xs"
              >
                <span className="font-medium text-red-800">{c.name}</span>
                <span className="text-red-600"> Â· {c.appliedFor}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <CandidateDrawer
          candidate={selected}
          onClose={() => setSelected(null)}
          onAdvance={() => {
            onAdvance(selected.id);
            setSelected(null);
          }}
          onReject={() => {
            onReject(selected.id);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

function CandidateDrawer({
  candidate,
  onClose,
  onAdvance,
  onReject,
}: {
  candidate: Candidate;
  onClose: () => void;
  onAdvance: () => void;
  onReject: () => void;
}) {
  const canAdvance =
    candidate.stage !== "hired" &&
    candidate.stage !== "rejected";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {initials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{candidate.name}</h2>
              <p className="text-sm text-white/90">{candidate.appliedFor}</p>
              <Badge className={`mt-2 ${CANDIDATE_STAGE_COLORS[candidate.stage]}`}>
                {CANDIDATE_STAGE_LABELS[candidate.stage]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={candidate.email} />
          <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={candidate.phone} />
          <DetailRow icon={<Briefcase className="h-4 w-4" />} label="Experience" value={candidate.experience} />
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label="Applied"
            value={formatDate(candidate.appliedDate)}
          />
          <div>
            <p className="text-xs text-gray-500 mb-1">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={
                    n <= candidate.rating ? "text-yellow-500" : "text-gray-300"
                  }
                >
                  â˜…
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex gap-2">
          {canAdvance && (
            <>
              <Button
                onClick={onAdvance}
                className="flex-1 bg-[#464EB8] hover:bg-[#3a3f9a]"
              >
                Move forward
              </Button>
              <Button
                variant="outline"
                onClick={onReject}
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                Reject
              </Button>
            </>
          )}
          {!canAdvance && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

function InterviewsView({ interviews }: { interviews: Interview[] }) {
  return (
    <div className="space-y-3">
      {interviews.map((i) => (
        <div
          key={i.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-[#464EB8]/40 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              <Avatar className="w-11 h-11">
                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold">
                  {initials(i.candidateName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-gray-900">{i.candidateName}</p>
                  <span className="text-xs text-gray-500">Â·</span>
                  <span className="text-xs text-gray-500">{i.id}</span>
                  <Badge className={INTERVIEW_MODE_COLORS[i.mode]}>{i.mode}</Badge>
                </div>
                <p className="text-sm text-gray-700">{i.role}</p>
                <p className="text-xs text-gray-500 mt-1">Panel: {i.panel}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CalendarClock className="h-4 w-4 text-[#464EB8]" />
                <span className="font-medium">
                  {formatDate(i.date)} Â· {i.time}
                </span>
              </div>
              <Badge
                className={
                  i.status === "scheduled"
                    ? "bg-blue-100 text-blue-800 mt-2"
                    : i.status === "completed"
                    ? "bg-green-100 text-green-800 mt-2"
                    : "bg-red-100 text-red-800 mt-2"
                }
              >
                {i.status}
              </Badge>
            </div>
          </div>
        </div>
      ))}
      {interviews.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-12">
          No interviews scheduled.
        </div>
      )}
    </div>
  );
}

function PostJobModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (
    data: Omit<JobPosting, "id" | "applicants" | "postedDate" | "status">
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<JobPosting["type"]>("Full-time");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = title.trim() && location.trim() && description.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Post a Job</h2>
            <p className="text-xs text-white/80">Create a new job posting.</p>
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
          <FormField label="Job title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Department">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option>Engineering</option>
                <option>Design</option>
                <option>Quality</option>
                <option>Infrastructure</option>
                <option>Human Resources</option>
                <option>Sales</option>
              </select>
            </FormField>
            <FormField label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as JobPosting["type"])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option>Full-time</option>
                <option>Contract</option>
                <option>Intern</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Location">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
            <FormField label="Experience">
              <input
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="3-5 years"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
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
                department,
                location,
                type,
                experience,
                description,
              })
            }
            className="bg-[#464EB8] hover:bg-[#3a3f9a]"
          >
            Publish posting
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
    postings: "Job Postings",
    candidates: "Candidates",
    interviews: "Interviews",
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
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
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

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-400">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium truncate">{value}</p>
      </div>
    </div>
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
