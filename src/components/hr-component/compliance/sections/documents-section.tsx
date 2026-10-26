import { Download, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPLIANCE_DOC_STATUS_COLORS, COMPLIANCE_DOC_STATUS_LABELS } from "@/lib/constants";
import { formatDate, type ComplianceDocument } from "./compliance-meta";

export function DocumentsSection({
  documents,
  search,
  onSearchChange,
}: {
  documents: ComplianceDocument[];
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
          placeholder="Search by name, category, or uploader"
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
        />
      </div>

      <div className="space-y-3">
        {documents.map((d) => (
          <div
            key={d.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-[#464EB8]/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="p-2 bg-[#464EB8]/10 rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-[#464EB8]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{d.name}</p>
                    <Badge className="bg-gray-100 text-gray-700">
                      {d.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {d.id} · {d.size} · uploaded by {d.uploadedBy}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded {formatDate(d.uploadedDate)}
                    {d.expiryDate && (
                      <>
                        {" "}
                        · Expires{" "}
                        <span
                          className={
                            d.status === "expired"
                              ? "text-red-600 font-medium"
                              : d.status === "expiring"
                              ? "text-amber-600 font-medium"
                              : ""
                          }
                        >
                          {formatDate(d.expiryDate)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={COMPLIANCE_DOC_STATUS_COLORS[d.status]}>
                  {COMPLIANCE_DOC_STATUS_LABELS[d.status]}
                </Badge>
                <Button size="sm" variant="outline">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-12">
            No documents match your search.
          </div>
        )}
      </div>
    </>
  );
}
