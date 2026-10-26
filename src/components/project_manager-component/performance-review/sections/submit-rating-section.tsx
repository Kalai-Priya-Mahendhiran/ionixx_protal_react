import { Star, AlertTriangle, TrendingUp, Send, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PerformanceReview } from "@/services/apis/performance/performance-service";

interface SubmitRatingSectionProps {
  selected: PerformanceReview;
  draftRating: number | null;
  onDraftRatingChange: (rating: number) => void;
  draftFeedback: string;
  onDraftFeedbackChange: (feedback: string) => void;
  busy: boolean;
  onSubmitRating: () => void;
  onShareFeedback: () => void;
}

export function SubmitRatingSection({ selected, draftRating, onDraftRatingChange, draftFeedback, onDraftFeedbackChange, busy, onSubmitRating, onShareFeedback }: SubmitRatingSectionProps) {
  return (
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
          <RatingPicker value={draftRating} onChange={onDraftRatingChange} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Feedback</p>
          <textarea
            value={draftFeedback}
            onChange={(e) => onDraftFeedbackChange(e.target.value)}
            rows={4}
            placeholder={`Share specific feedback for ${selected.employeeName}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={onSubmitRating}
            disabled={draftRating === null || busy}
            className="bg-[#464EB8] hover:bg-[#3a3f9a] text-white"
          >
            <Send className="h-4 w-4 mr-1" />
            Submit rating
          </Button>
          <Button variant="outline" onClick={onShareFeedback} disabled={!draftFeedback.trim() || busy}>
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
