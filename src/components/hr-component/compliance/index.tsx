import { useMemo, useState } from "react";
import {
  ShieldCheck,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  X,
  History,
  ListChecks,
  ShieldAlert,
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
import { COMPLIANCE_DOC_STATUS_COLORS, COMPLIANCE_DOC_STATUS_LABELS, COMPLIANCE_EMPLOYEE_STATUS_COLORS, COMPLIANCE_EMPLOYEE_STATUS_LABELS, COMPLIANCE_AUDIT_TYPE_COLORS } from "@/lib/constants";

type Tab = "documents" | "status" | "audit";

type DocStatus = "valid" | "expiring" | "expired" | "missing";

interface ComplianceDocument {
  id: string;
  name: string;
  category: string;
  uploadedBy: string;
  uploadedDate: string;
  expiryDate: string | null;
  status: DocStatus;
  size: string;
}

interface EmployeeCompliance {
  employeeId: string;
  employeeName: string;
  department: string;
  required: number;
  submitted: number;
  pending: string[];
  status: "compliant" | "partial" | "non-compliant";
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  type: "upload" | "update" | "review" | "delete" | "assign";
}

const seedDocuments: ComplianceDocument[] = [
  {
    id: "DOC-7001",
    name: "POSH Policy 2026.pdf",
    category: "Policy",
    uploadedBy: "Anita Rajan",
    uploadedDate: "2026-01-08",
    expiryDate: "2026-12-31",
    status: "valid",
    size: "1.2 MB",
  },
  {
    id: "DOC-7002",
    name: "Data Privacy Policy.pdf",
    category: "Policy",
    uploadedBy: "Anita Rajan",
    uploadedDate: "2025-09-20",
    expiryDate: "2026-09-20",
    status: "valid",
    size: "850 KB",
  },
  {
    id: "DOC-7003",
    name: "ISO 27001 Certificate.pdf",
    category: "Certification",
    uploadedBy: "Divya Menon",
    uploadedDate: "2025-06-12",
    expiryDate: "2026-06-12",
    status: "expiring",
    size: "2.1 MB",
  },
  {
    id: "DOC-7004",
    name: "PF Compliance Filing Q1.pdf",
    category: "Statutory",
    uploadedBy: "Sneha Iyer",
    uploadedDate: "2026-04-15",
    expiryDate: null,
    status: "valid",
    size: "640 KB",
  },
  {
    id: "DOC-7005",
    name: "Fire Safety Audit 2025.pdf",
    category: "Audit",
    uploadedBy: "Anita Rajan",
    uploadedDate: "2025-04-30",
    expiryDate: "2026-04-30",
    status: "expired",
    size: "3.5 MB",
  },
  {
    id: "DOC-7006",
    name: "Employee Code of Conduct.pdf",
    category: "Policy",
    uploadedBy: "Anita Rajan",
    uploadedDate: "2026-02-01",
    expiryDate: "2027-02-01",
    status: "valid",
    size: "920 KB",
  },
];

const seedEmployeeCompliance: EmployeeCompliance[] = [
  {
    employeeId: "EMP00101",
    employeeName: "Kalai Priya",
    department: "Engineering",
    required: 6,
    submitted: 6,
    pending: [],
    status: "compliant",
  },
  {
    employeeId: "EMP00102",
    employeeName: "Arjun Rao",
    department: "Engineering",
    required: 6,
    submitted: 5,
    pending: ["Background Verification"],
    status: "partial",
  },
  {
    employeeId: "EMP00103",
    employeeName: "Meera Sundar",
    department: "Quality",
    required: 6,
    submitted: 6,
    pending: [],
    status: "compliant",
  },
  {
    employeeId: "EMP00104",
    employeeName: "Rohit Deshmukh",
    department: "Design",
    required: 6,
    submitted: 4,
    pending: ["NDA", "Tax Declaration"],
    status: "partial",
  },
  {
    employeeId: "EMP00105",
    employeeName: "Divya Menon",
    department: "Infrastructure",
    required: 6,
    submitted: 6,
    pending: [],
    status: "compliant",
  },
  {
    employeeId: "EMP00106",
    employeeName: "Karthik Subramanian",
    department: "Engineering",
    required: 6,
    submitted: 2,
    pending: ["NDA", "Tax Declaration", "PF Form", "Background Verification"],
    status: "non-compliant",
  },
  {
    employeeId: "EMP00107",
    employeeName: "Sneha Iyer",
    department: "Human Resources",
    required: 6,
    submitted: 6,
    pending: [],
    status: "compliant",
  },
];

const seedAuditLogs: AuditLog[] = [
  {
    id: "LOG-50012",
    timestamp: "2026-05-08T09:42:00",
    actor: "Anita Rajan",
    action: "Uploaded compliance document",
    target: "POSH Policy 2026.pdf",
    type: "upload",
  },
  {
    id: "LOG-50011",
    timestamp: "2026-05-07T16:20:00",
    actor: "Sneha Iyer",
    action: "Reviewed employee documents",
    target: "Karthik Subramanian (EMP00106)",
    type: "review",
  },
  {
    id: "LOG-50010",
    timestamp: "2026-05-07T11:05:00",
    actor: "Divya Menon",
    action: "Renewed certification",
    target: "ISO 27001 Certificate.pdf",
    type: "update",
  },
  {
    id: "LOG-50009",
    timestamp: "2026-05-06T15:30:00",
    actor: "Anita Rajan",
    action: "Assigned policy acknowledgement",
    target: "All Engineering employees",
    type: "assign",
  },
  {
    id: "LOG-50008",
    timestamp: "2026-05-05T10:12:00",
    actor: "Sneha Iyer",
    action: "Updated employee record",
    target: "Rohit Deshmukh (EMP00104)",
    type: "update",
  },
  {
    id: "LOG-50007",
    timestamp: "2026-05-04T18:00:00",
    actor: "System",
    action: "Auto-flagged expiring document",
    target: "Fire Safety Audit 2025.pdf",
    type: "review",
  },
  {
    id: "LOG-50006",
    timestamp: "2026-05-03T09:15:00",
    actor: "Anita Rajan",
    action: "Deleted obsolete document",
    target: "Old IT Policy 2023.pdf",
    type: "delete",
  },
  {
    id: "LOG-50005",
    timestamp: "2026-05-02T14:48:00",
    actor: "Sneha Iyer",
    action: "Uploaded statutory filing",
    target: "PF Compliance Filing Q1.pdf",
    type: "upload",
  },
];

export default function Compliance() {
  const [documents, setDocuments] = useState<ComplianceDocument[]>(seedDocuments);
  const [employeeCompliance] = useState<EmployeeCompliance[]>(
    seedEmployeeCompliance
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seedAuditLogs);
  const [activeTab, setActiveTab] = useState<Tab>("documents");
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      documents: documents.length,
      compliant: employeeCompliance.filter((e) => e.status === "compliant").length,
      pending: documents.filter(
        (d) => d.status === "expiring" || d.status === "expired"
      ).length,
      auditEntries: auditLogs.length,
    };
  }, [documents, employeeCompliance, auditLogs]);

  const filteredDocs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.category.toLowerCase().includes(term) ||
        d.uploadedBy.toLowerCase().includes(term)
    );
  }, [documents, search]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleUpload = (
    data: Pick<
      ComplianceDocument,
      "name" | "category" | "expiryDate"
    >
  ) => {
    const newDoc: ComplianceDocument = {
      id: `DOC-${7000 + documents.length + 1}`,
      name: data.name,
      category: data.category,
      uploadedBy: "Anita Rajan",
      uploadedDate: new Date().toISOString().slice(0, 10),
      expiryDate: data.expiryDate,
      status: "valid",
      size: "1.0 MB",
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setAuditLogs((prev) => [
      {
        id: `LOG-${50000 + prev.length + 1}`,
        timestamp: new Date().toISOString(),
        actor: "Anita Rajan",
        action: "Uploaded compliance document",
        target: newDoc.name,
        type: "upload",
      },
      ...prev,
    ]);
    setShowUploadModal(false);
    showToast(`Uploaded ${newDoc.name}.`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Compliance</h1>
                <p className="text-white/90 mt-1">
                  {stats.documents} documents Â· {stats.compliant} compliant employees Â· {stats.pending} action items
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-white text-[#464EB8] hover:bg-white/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Documents"
            count={stats.documents}
            icon={<FileText className="h-6 w-6 text-indigo-600" />}
            tone="bg-indigo-50"
          />
          <SummaryCard
            label="Compliant"
            count={stats.compliant}
            icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
            tone="bg-green-50"
          />
          <SummaryCard
            label="Action Items"
            count={stats.pending}
            icon={<AlertTriangle className="h-6 w-6 text-amber-600" />}
            tone="bg-amber-50"
          />
          <SummaryCard
            label="Audit Entries"
            count={stats.auditEntries}
            icon={<History className="h-6 w-6 text-purple-600" />}
            tone="bg-purple-50"
          />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#464EB8]" />
              <span>Compliance Center</span>
            </CardTitle>
            <CardDescription>
              Maintain documents, monitor compliance status, and review audit trails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex border-b border-gray-200 mb-4">
              <TabButton
                tab="documents"
                activeTab={activeTab}
                onClick={setActiveTab}
                count={documents.length}
                icon={<FileText className="h-3.5 w-3.5" />}
              />
              <TabButton
                tab="status"
                activeTab={activeTab}
                onClick={setActiveTab}
                count={employeeCompliance.length}
                icon={<ListChecks className="h-3.5 w-3.5" />}
              />
              <TabButton
                tab="audit"
                activeTab={activeTab}
                onClick={setActiveTab}
                count={auditLogs.length}
                icon={<History className="h-3.5 w-3.5" />}
              />
            </div>

            {activeTab === "documents" && (
              <DocumentsView
                documents={filteredDocs}
                search={search}
                onSearchChange={setSearch}
              />
            )}

            {activeTab === "status" && (
              <StatusView records={employeeCompliance} />
            )}

            {activeTab === "audit" && <AuditView logs={auditLogs} />}
          </CardContent>
        </Card>
      </div>

      {showUploadModal && (
        <UploadDocumentModal
          onCancel={() => setShowUploadModal(false)}
          onSubmit={handleUpload}
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

function DocumentsView({
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
                    {d.id} Â· {d.size} Â· uploaded by {d.uploadedBy}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded {formatDate(d.uploadedDate)}
                    {d.expiryDate && (
                      <>
                        {" "}
                        Â· Expires{" "}
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

function StatusView({ records }: { records: EmployeeCompliance[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
            <th className="py-3 px-2">Employee</th>
            <th className="py-3 px-2">Department</th>
            <th className="py-3 px-2">Documents</th>
            <th className="py-3 px-2">Pending</th>
            <th className="py-3 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const pct = Math.round((r.submitted / r.required) * 100);
            return (
              <tr
                key={r.employeeId}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                        {initials(r.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{r.employeeName}</p>
                      <p className="text-xs text-gray-500">{r.employeeId}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2 text-gray-700">{r.department}</td>
                <td className="py-3 px-2 w-44">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={
                          r.status === "compliant"
                            ? "bg-green-500 h-1.5 rounded-full"
                            : r.status === "partial"
                            ? "bg-amber-500 h-1.5 rounded-full"
                            : "bg-red-500 h-1.5 rounded-full"
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {r.submitted}/{r.required}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  {r.pending.length === 0 ? (
                    <span className="text-xs text-green-600">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {r.pending.slice(0, 2).map((item) => (
                        <Badge
                          key={item}
                          className="bg-red-50 text-red-700 border border-red-100"
                        >
                          {item}
                        </Badge>
                      ))}
                      {r.pending.length > 2 && (
                        <Badge className="bg-gray-100 text-gray-600">
                          +{r.pending.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3 px-2">
                  <Badge className={COMPLIANCE_EMPLOYEE_STATUS_COLORS[r.status]}>
                    {COMPLIANCE_EMPLOYEE_STATUS_LABELS[r.status]}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AuditView({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="space-y-1">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="p-2 bg-gray-100 rounded-lg shrink-0">
            {log.type === "upload" && <Upload className="h-4 w-4 text-blue-600" />}
            {log.type === "update" && (
              <FileText className="h-4 w-4 text-purple-600" />
            )}
            {log.type === "review" && (
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
            )}
            {log.type === "delete" && (
              <ShieldAlert className="h-4 w-4 text-red-600" />
            )}
            {log.type === "assign" && (
              <ListChecks className="h-4 w-4 text-indigo-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{log.actor}</span> {log.action}
              </p>
              <Badge className={COMPLIANCE_AUDIT_TYPE_COLORS[log.type]}>{log.type}</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{log.target}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(log.timestamp)} Â· {log.id}
            </p>
          </div>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-12">
          No audit entries yet.
        </div>
      )}
    </div>
  );
}

function UploadDocumentModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (
    data: Pick<ComplianceDocument, "name" | "category" | "expiryDate">
  ) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Policy");
  const [expiryDate, setExpiryDate] = useState("");

  const canSubmit = name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Upload Document</h2>
            <p className="text-xs text-white/80">Add a compliance document.</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <FormField label="Document name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="POSH Policy 2026.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </FormField>
          <FormField label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            >
              <option>Policy</option>
              <option>Certification</option>
              <option>Statutory</option>
              <option>Audit</option>
              <option>Contract</option>
            </select>
          </FormField>
          <FormField label="Expiry date (optional)">
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </FormField>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
            <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Drop a file or click to browse</p>
            <p className="text-xs text-gray-500 mt-1">PDF, DOCX up to 10 MB</p>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                name,
                category,
                expiryDate: expiryDate || null,
              })
            }
            className="bg-[#464EB8] hover:bg-[#3a3f9a]"
          >
            Upload
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
  icon,
}: {
  tab: Tab;
  activeTab: Tab;
  onClick: (t: Tab) => void;
  count: number;
  icon: React.ReactNode;
}) {
  const isActive = tab === activeTab;
  const labels: Record<Tab, string> = {
    documents: "Documents",
    status: "Employee Status",
    audit: "Audit Logs",
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
      {icon}
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  const d = new Date(value);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
