import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CANDIDATE_STAGE_ORDER, CANDIDATE_STAGE_LABELS } from "@/lib/constants";
import { CandidateDrawer } from "./candidate-drawer";
import { formatDate, initials, type Candidate, type Stage } from "./recruitment-meta";

export function CandidatesSection({
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
