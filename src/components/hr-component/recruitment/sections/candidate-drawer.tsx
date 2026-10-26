import { Briefcase, Clock, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppSheet } from "@/components/ui/sheet";
import { CANDIDATE_STAGE_LABELS, CANDIDATE_STAGE_COLORS } from "@/lib/constants";
import { formatDate, initials, type Candidate } from "./recruitment-meta";

export function CandidateDrawer({
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
