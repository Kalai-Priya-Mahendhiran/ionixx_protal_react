import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Plus,
  Users2,
  CalendarClock,
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
import { PageTabs } from "@/components/common-component/tabs";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { CANDIDATE_STAGE_ORDER, CANDIDATE_STAGE_LABELS } from "@/lib/constants";
import { CandidatesSection, InterviewsSection, PostJobDialog, PostingsSection } from "./sections";
import { seedCandidates, seedInterviews, seedPostings } from "./sections/recruitment-data";
import type { Candidate, CardFilter, Interview, JobPosting, NewJobPosting, Stage, Tab } from "./sections/recruitment-meta";

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

  const handleAddJob = (data: NewJobPosting) => {
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
            <PageTabs
              className="mb-4"
              label="Recruitment"
              tabs={[
                { id: "postings", label: "Job Postings", count: postings.length },
                { id: "candidates", label: "Candidates", count: candidates.length },
                { id: "interviews", label: "Interviews", count: interviews.length },
              ]}
              value={activeTab}
              onChange={changeTab}
            />

            {activeTab === "postings" && (
              <PostingsSection
                postings={filteredPostings}
                search={search}
                onSearchChange={setSearch}
              />
            )}

            {activeTab === "candidates" && (
              <CandidatesSection
                candidates={visibleCandidates}
                onAdvance={advanceStage}
                onReject={rejectCandidate}
              />
            )}

            {activeTab === "interviews" && (
              <InterviewsSection interviews={visibleInterviews} />
            )}
          </CardContent>
        </Card>
      </div>

      <PostJobDialog
        open={showJobModal}
        onOpenChange={setShowJobModal}
        onSubmit={handleAddJob}
      />
    </MainLayout>
  );
}
