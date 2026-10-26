import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useReviewees, useShareFeedback, useSubmitRating } from "@/services/apis/performance/use-performance";
import { GoalsSection, ReviewSummarySection, RevieweesSection, SubmitRatingSection } from "./sections";

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
          <RevieweesSection profiles={profiles} isLoading={isLoading} selectedId={selectedId} onSelect={selectProfile} />

          <div className="lg:col-span-2 space-y-6">
            {selected ? (
              <>
                <ReviewSummarySection selected={selected} />

                <GoalsSection goals={selected.goals} />

                <SubmitRatingSection
                  selected={selected}
                  draftRating={draftRating}
                  onDraftRatingChange={setDraftRating}
                  draftFeedback={draftFeedback}
                  onDraftFeedbackChange={setDraftFeedback}
                  busy={busy}
                  onSubmitRating={submitRating}
                  onShareFeedback={shareFeedback}
                />
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
