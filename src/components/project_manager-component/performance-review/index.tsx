import { useMemo, useState } from "react";
import {
  Star,
  Target,
  AlertTriangle,
  TrendingUp,
  Send,
  MessageSquare,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PerformanceProfile, EmployeeGoal } from "@/lib/team-data";
import { initials } from "@/lib/org-chart";
import { useReviewees, useShareFeedback, useSubmitRating } from "@/services/apis/performance/use-performance";

const goalStatusMeta: Record<
  EmployeeGoal["status"],
  { label: string; badge: string; tone: string }
> = {
  "on-track": { label: "On Track", badge: "bg-green-100 text-green-800", tone: "bg-green-500" },
  "at-risk": { label: "At Risk", badge: "bg-yellow-100 text-yellow-800", tone: "bg-yellow-500" },
  "off-track": { label: "Off Track", badge: "bg-red-100 text-red-800", tone: "bg-red-500" },
  completed: { label: "Completed", badge: "bg-blue-100 text-blue-800", tone: "bg-blue-500" },
};

const reviewStatusMeta: Record<
  PerformanceProfile["status"],
  { label: string; badge: string }
> = {
  draft: { label: "Draft", badge: "bg-gray-100 text-gray-700" },
  "in-review": { label: "In Review", badge: "bg-amber-100 text-amber-800" },
  submitted: { label: "Submitted", badge: "bg-green-100 text-green-800" },
};

export default function PerformanceReview() {
  // Your direct reports from the live org chart (HR sees everyone); ratings are kept by the service
  const { data: profiles = [], isLoading } = useReviewees();
  const submitRatingMutation = useSubmitRating();
  const shareFeedbackMutation = useShareFeedback();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [draftRating, setDraftRating] = useState<number | null>(null);
  const [draftFeedback, setDraftFeedback] = useState("");

  // Falls back to the first person when nothing is chosen or the chosen person has left the team
  const selected = useMemo(
    () => profiles.find((p) => p.employeeId === chosenId) ?? profiles[0] ?? null,
    [profiles, chosenId]
  );
  const selectedId = selected?.employeeId ?? "";
  const busy = submitRatingMutation.isPending || shareFeedbackMutation.isPending;

  const summary = useMemo(() => {
    const total = profiles.length;
    const submitted = profiles.filter((p) => p.status === "submitted").length;
    const inReview = profiles.filter((p) => p.status === "in-review").length;
    const draft = profiles.filter((p) => p.status === "draft").length;
    return { total, submitted, inReview, draft };
  }, [profiles]);

  const selectProfile = (id: string) => {
    setChosenId(id);
    const next = profiles.find((p) => p.employeeId === id);
    setDraftRating(next?.overallRating ?? null);
    setDraftFeedback("");
  };

  const submitRating = () => {
    if (!selected || draftRating === null) return;
    submitRatingMutation.mutate({ employeeId: selected.employeeId, rating: draftRating, feedback: draftFeedback }, { onSuccess: () => setDraftFeedback("") });
  };

  const shareFeedback = () => {
    if (!selected || !draftFeedback.trim()) return;
    shareFeedbackMutation.mutate({ employeeId: selected.employeeId, text: draftFeedback }, { onSuccess: () => setDraftFeedback("") });
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Star}
          title="Performance Review"
          description={`${summary.total} reviews · ${summary.submitted} submitted · ${summary.inReview} in review · ${summary.draft} draft`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#464EB8]" />
                <span>Reviewees</span>
              </CardTitle>
              <CardDescription>Pick an employee to evaluate.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {!isLoading && profiles.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-500">Nobody reports to you yet. People appear here as they join your team.</p>
                )}
                {profiles.map((p) => {
                  const isActive = p.employeeId === selectedId;
                  return (
                    <button
                      key={p.employeeId}
                      onClick={() => selectProfile(p.employeeId)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isActive
                          ? "border-[#464EB8] bg-[#464EB8]/5 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                            {initials(p.employeeName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 truncate">{p.employeeName}</p>
                            <Badge className={reviewStatusMeta[p.status].badge}>
                              {reviewStatusMeta[p.status].label}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{p.designation}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                            <span>{p.reviewCycle}</span>
                            <span className="flex items-center gap-1">
                              {p.overallRating !== null ? (
                                <>
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span className="font-medium text-gray-700">{p.overallRating}</span>
                                </>
                              ) : (
                                <span className="italic">Not rated</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {selected ? (
              <>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold">
                            {initials(selected.employeeName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl">{selected.employeeName}</CardTitle>
                          <CardDescription>
                            {selected.designation} · {selected.reviewCycle}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={reviewStatusMeta[selected.status].badge}>
                        {reviewStatusMeta[selected.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <MiniStat
                        label="Self rating"
                        value={selected.selfRating !== null ? `${selected.selfRating}/5` : "—"}
                      />
                      <MiniStat
                        label="Manager rating"
                        value={selected.overallRating !== null ? `${selected.overallRating}/5` : "Pending"}
                      />
                      <MiniStat
                        label="Last review"
                        value={selected.lastReview ? new Date(selected.lastReview).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }) : "—"}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-[#464EB8]" />
                      <span>Goals</span>
                    </CardTitle>
                    <CardDescription>Track progress on each weighted goal.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selected.goals.length === 0 && <p className="text-sm text-gray-500">No goals set for this cycle yet.</p>}
                      {selected.goals.map((g) => {
                        const meta = goalStatusMeta[g.status];
                        return (
                          <div key={g.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{g.title}</p>
                                <p className="text-sm text-gray-600 mt-0.5">{g.description}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <Badge className={meta.badge}>{meta.label}</Badge>
                                <p className="text-xs text-gray-500 mt-1">Weight {g.weight}%</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span className="font-medium">{g.progress}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${meta.tone} transition-all`}
                                  style={{ width: `${g.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#464EB8]" />
                      <span>Submit Rating</span>
                    </CardTitle>
                    <CardDescription>Evaluate overall performance and share feedback.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Overall rating</p>
                      <RatingPicker value={draftRating} onChange={setDraftRating} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Feedback</p>
                      <textarea
                        value={draftFeedback}
                        onChange={(e) => setDraftFeedback(e.target.value)}
                        rows={4}
                        placeholder={`Share specific feedback for ${selected.employeeName}...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={submitRating}
                        disabled={draftRating === null || busy}
                        className="bg-[#464EB8] hover:bg-[#3a3f9a] text-white"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Submit rating
                      </Button>
                      <Button variant="outline" onClick={shareFeedback} disabled={!draftFeedback.trim() || busy}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Share feedback
                      </Button>
                    </div>
                    {selected.feedback.length > 0 && (
                      <div className="space-y-2 border-t border-gray-100 pt-4">
                        <p className="text-sm font-medium text-gray-700">Feedback shared</p>
                        {selected.feedback.map((entry) => (
                          <div key={entry.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                            <p className="text-gray-800">{entry.text}</p>
                            <p className="mt-1 text-xs text-gray-500">{entry.authorName} · {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-16 text-center text-sm text-gray-500">
                  Select an employee to begin a review.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

    </MainLayout>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function RatingPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const labels = ["Needs improvement", "Below expectations", "Meets expectations", "Exceeds expectations", "Outstanding"];
  return (
    <div>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value !== null && n <= value;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`p-2 rounded-md border transition-all ${
                active
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              aria-label={`Rate ${n} out of 5`}
            >
              <Star
                className={`h-6 w-6 ${
                  active ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                }`}
              />
            </button>
          );
        })}
        {value !== null && (
          <span className="ml-3 text-sm font-medium text-gray-700">
            {value}/5 · {labels[value - 1]}
          </span>
        )}
      </div>
      {value === null && (
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          Pick a rating to enable submit.
        </p>
      )}
    </div>
  );
}

