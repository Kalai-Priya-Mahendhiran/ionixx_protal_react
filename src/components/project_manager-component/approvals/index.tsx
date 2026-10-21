import { useMemo, useState } from "react";
import {
  CheckCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Home,
  Receipt,
  Send,
  AlertCircle,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { approvalRequests as seedRequests, type ApprovalRequest } from "@/lib/team-data";
import { APPROVAL_TYPE_LABELS, APPROVAL_TYPE_COLORS } from "@/lib/constants";

type Tab = "pending" | "approved" | "rejected";

const typeIcon: Record<ApprovalRequest["type"], React.ReactNode> = {
  leave: <Calendar className="h-4 w-4" />,
  "time-off": <Clock className="h-4 w-4" />,
  wfh: <Home className="h-4 w-4" />,
  expense: <Receipt className="h-4 w-4" />,
};

export default function Approvals() {
  const [requests, setRequests] = useState<ApprovalRequest[]>(seedRequests);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [toast, setToast] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "pending"),
      approved: requests.filter((r) => r.status === "approved"),
      rejected: requests.filter((r) => r.status === "rejected"),
    };
  }, [requests]);

  const decide = (id: string, decision: "approved" | "rejected") => {
    const target = requests.find((r) => r.id === id);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: decision,
              decidedDate: new Date().toISOString().slice(0, 10),
              decidedBy: "Priya Kumar",
            }
          : r
      )
    );
    if (target) {
      setToast(
        decision === "approved"
          ? `Approved ${target.employeeName}'s request — notification sent.`
          : `Rejected ${target.employeeName}'s request — notification sent.`
      );
      window.setTimeout(() => setToast(null), 3500);
    }
  };

  const list = grouped[activeTab];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          icon={CheckCheck}
          title="Approvals"
          description={`${grouped.pending.length} pending · ${grouped.approved.length} approved · ${grouped.rejected.length} rejected`}
        />

        <StatGrid>
          {/* The cards are the same filter as the tabs below (the queue has no "All" view) */}
          <StatCard icon={AlertCircle} label="Pending" value={grouped.pending.length} tone="amber" active={activeTab === "pending"} onClick={() => setActiveTab("pending")} />
          <StatCard icon={CheckCircle2} label="Approved" value={grouped.approved.length} tone="green" active={activeTab === "approved"} onClick={() => setActiveTab("approved")} />
          <StatCard icon={XCircle} label="Rejected" value={grouped.rejected.length} tone="red" active={activeTab === "rejected"} onClick={() => setActiveTab("rejected")} />
        </StatGrid>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-[#464EB8]" />
              <span>Request Queue</span>
            </CardTitle>
            <CardDescription>Review pending requests and act on them.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex border-b border-gray-200 mb-4">
              <TabButton tab="pending" activeTab={activeTab} onClick={setActiveTab} count={grouped.pending.length} />
              <TabButton tab="approved" activeTab={activeTab} onClick={setActiveTab} count={grouped.approved.length} />
              <TabButton tab="rejected" activeTab={activeTab} onClick={setActiveTab} count={grouped.rejected.length} />
            </div>

            <div className="space-y-3">
              {list.map((req) => (
                <RequestRow
                  key={req.id}
                  request={req}
                  onApprove={() => decide(req.id, "approved")}
                  onReject={() => decide(req.id, "rejected")}
                />
              ))}
              {list.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-12">
                  No {activeTab} requests right now.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm">
          <Send className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}
    </MainLayout>
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
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
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

function RequestRow({
  request,
  onApprove,
  onReject,
}: {
  request: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-[#464EB8]/40 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <Avatar className="w-11 h-11">
          <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold">
            {initials(request.employeeName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900">{request.employeeName}</p>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">{request.id}</span>
            <Badge className={APPROVAL_TYPE_COLORS[request.type]}>
              <span className="flex items-center gap-1">
                {typeIcon[request.type]}
                <span>{request.subType ?? APPROVAL_TYPE_LABELS[request.type]}</span>
              </span>
            </Badge>
          </div>
          <p className="text-sm text-gray-700">
            {formatDate(request.startDate)}
            {request.startDate !== request.endDate && <> → {formatDate(request.endDate)}</>}
            <span className="text-gray-400"> · </span>
            <span className="font-medium">
              {request.days} day{request.days > 1 ? "s" : ""}
            </span>
          </p>
          <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
          <p className="text-xs text-gray-400 mt-2">
            Applied {formatDate(request.appliedDate)}
            {request.decidedDate && request.decidedBy && (
              <>
                {" "}
                · {request.status === "approved" ? "Approved" : "Rejected"} by {request.decidedBy} on {formatDate(request.decidedDate)}
              </>
            )}
          </p>
        </div>
        {request.status === "pending" ? (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              size="sm"
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        ) : (
          <Badge
            className={
              request.status === "approved"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }
          >
            {request.status === "approved" ? "Approved" : "Rejected"}
          </Badge>
        )}
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
