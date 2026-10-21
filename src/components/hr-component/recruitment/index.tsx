import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Briefcase,
  Plus,
  MapPin,
  Clock,
  Users2,
  CalendarClock,
  Mail,
  Phone,
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
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FormDialog } from "@/components/ui/form-dialog";
import { SelectField, TextareaField, TextField, toOptions } from "@/components/ui/form-fields";
import { AppSheet } from "@/components/ui/sheet";
import { CANDIDATE_STAGE_ORDER, CANDIDATE_STAGE_LABELS, CANDIDATE_STAGE_COLORS, JOB_POSTING_STATUS_COLORS, INTERVIEW_MODE_COLORS } from "@/lib/constants";
import { EMPLOYMENT_TYPES, postJobSchema, type PostJobFormValues } from "@/lib/form-schemas/hr";

type Tab = "postings" | "candidates" | "interviews";

// What a stat card narrows its tab to (the Candidates card shows every candidate)
type CardFilter = "open" | "scheduled" | "hired";

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
    description: "Closed — role filled in March 2026.",
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
    description: "Draft — not yet published.",
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

  const stats = useMemo(() => {
    return {
      open: postings.filter((p) => p.status === "open").length,
      candidates: candidates.length,
      interviews: interviews.filter((i) => i.status === "scheduled").length,
      hires: candidates.filter((c) => c.stage === "hired").length,
    };
  }, [postings, candidates, interviews]);

  // Stat cards filter the tab they belong to; changing tab by hand clears the card filter
  const [cardFilter, setCardFilter] = useState<CardFilter | null>(null);

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    setCardFilter(null);
  };

  const selectCard = (filter: CardFilter | null, tab: Tab) => {
    if (filter !== null && cardFilter === filter) {
      setCardFilter(null);
      return;
    }
    setActiveTab(tab);
    setCardFilter(filter);
  };

  const filteredPostings = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = cardFilter === "open" ? postings.filter((p) => p.status === "open") : postings;
    if (!term) return base;
    return base.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.department.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term)
    );
  }, [postings, search, cardFilter]);

  const visibleCandidates = useMemo(
    () => (cardFilter === "hired" ? candidates.filter((c) => c.stage === "hired") : candidates),
    [candidates, cardFilter]
  );

  const visibleInterviews = useMemo(
    () => (cardFilter === "scheduled" ? interviews.filter((i) => i.status === "scheduled") : interviews),
    [interviews, cardFilter]
  );

  const advanceStage = (id: string) => {
    const target = candidates.find((c) => c.id === id);
    if (!target) return;
    const idx = (CANDIDATE_STAGE_ORDER as readonly Stage[]).indexOf(target.stage);
    if (idx < 0 || idx >= CANDIDATE_STAGE_ORDER.length - 1) return;
    const next = CANDIDATE_STAGE_ORDER[idx + 1];
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: next } : c))
    );
    toast.success(`${target.name} moved to ${CANDIDATE_STAGE_LABELS[next]}.`);
  };

  const rejectCandidate = (id: string) => {
    const target = candidates.find((c) => c.id === id);
    if (!target) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: "rejected" } : c))
    );
    toast.success(`${target.name} rejected.`);
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
    toast.success(`"${newJob.title}" posted.`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Briefcase}
          title="Recruitment"
          description={`${stats.open} open roles · ${stats.candidates} candidates · ${stats.interviews} interviews scheduled`}
          actions={
            <>
              <Button onClick={() => setShowJobModal(true)} className={headerPrimaryButtonClass}>
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Button>
            </>
          }
        />

        <StatGrid>
          <StatCard icon={Briefcase} label="Open Roles" value={stats.open} tone="indigo" active={cardFilter === "open"} onClick={() => selectCard("open", "postings")} />
          <StatCard icon={Users2} label="Candidates" value={stats.candidates} tone="blue" active={activeTab === "candidates" && cardFilter === null} onClick={() => selectCard(null, "candidates")} />
          <StatCard icon={CalendarClock} label="Interviews" value={stats.interviews} tone="purple" active={cardFilter === "scheduled"} onClick={() => selectCard("scheduled", "interviews")} />
          <StatCard icon={CheckCircle2} label="Hired" value={stats.hires} tone="green" active={cardFilter === "hired"} onClick={() => selectCard("hired", "candidates")} />
        </StatGrid>

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
            <div className="flex border-b border-gray-200 mb-4 overflow-x-auto [&>button]:shrink-0 [&>button]:whitespace-nowrap">
              <TabButton
                tab="postings"
                activeTab={activeTab}
                onClick={changeTab}
                count={postings.length}
              />
              <TabButton
                tab="candidates"
                activeTab={activeTab}
                onClick={changeTab}
                count={candidates.length}
              />
              <TabButton
                tab="interviews"
                activeTab={activeTab}
                onClick={changeTab}
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
                candidates={visibleCandidates}
                onAdvance={advanceStage}
                onReject={rejectCandidate}
              />
            )}

            {activeTab === "interviews" && (
              <InterviewsView interviews={visibleInterviews} />
            )}
          </CardContent>
        </Card>
      </div>

      <PostJobModal
        open={showJobModal}
        onOpenChange={setShowJobModal}
        onSubmit={handleAddJob}
      />
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
                <span className="text-red-600"> · {c.appliedFor}</span>
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
    <AppSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={candidate.name}
      description={candidate.appliedFor}
      header={
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
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
      }
      footer={
        canAdvance ? (
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
        ) : (
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        )
      }
    >
      <div className="space-y-4 text-sm">
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
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </AppSheet>
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
                  <span className="text-xs text-gray-500">·</span>
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
                  {formatDate(i.date)} · {i.time}
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

const JOB_DEPARTMENTS = toOptions([
  "Engineering",
  "Design",
  "Quality",
  "Infrastructure",
  "Human Resources",
  "Sales",
]);
const JOB_TYPES = toOptions(EMPLOYMENT_TYPES);

const EMPTY_JOB: PostJobFormValues = {
  title: "",
  department: "Engineering",
  location: "",
  type: "Full-time",
  experience: "",
  description: "",
};

function PostJobModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: Omit<JobPosting, "id" | "applicants" | "postedDate" | "status">
  ) => void;
}) {
  const form = useForm<PostJobFormValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: EMPTY_JOB,
  });

  useEffect(() => {
    if (open) form.reset(EMPTY_JOB);
  }, [open, form]);

  const save = (values: PostJobFormValues) =>
    onSubmit({
      title: values.title.trim(),
      department: values.department,
      location: values.location.trim(),
      type: values.type,
      experience: values.experience?.trim() ?? "",
      description: values.description.trim(),
    });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={save}
      title="Post a Job"
      description="Create a new job posting."
      size="lg"
      submitLabel="Publish posting"
    >
      <TextField control={form.control} name="title" label="Job title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={form.control}
          name="department"
          label="Department"
          options={JOB_DEPARTMENTS}
        />
        <SelectField control={form.control} name="type" label="Type" options={JOB_TYPES} />
        <TextField control={form.control} name="location" label="Location" required />
        <TextField
          control={form.control}
          name="experience"
          label="Experience"
          placeholder="3-5 years"
        />
      </div>
      <TextareaField
        control={form.control}
        name="description"
        label="Description"
        rows={4}
        required
      />
    </FormDialog>
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
