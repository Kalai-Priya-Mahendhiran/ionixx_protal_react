import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ShieldCheck,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Download,
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
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FormDialog } from "@/components/ui/form-dialog";
import { SelectField, TextField, toOptions } from "@/components/ui/form-fields";
import { COMPLIANCE_DOC_STATUS_COLORS, COMPLIANCE_DOC_STATUS_LABELS, COMPLIANCE_EMPLOYEE_STATUS_COLORS, COMPLIANCE_EMPLOYEE_STATUS_LABELS, COMPLIANCE_AUDIT_TYPE_COLORS } from "@/lib/constants";
import { uploadDocumentSchema, type UploadDocumentFormValues } from "@/lib/form-schemas/hr";

type Tab = "documents" | "status" | "audit";

// What a stat card narrows its tab to (Documents and Audit Entries show their whole tab)
type CardFilter = "compliant" | "action";

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

  const filteredDocs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base =
      cardFilter === "action"
        ? documents.filter((d) => d.status === "expiring" || d.status === "expired")
        : documents;
    if (!term) return base;
    return base.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.category.toLowerCase().includes(term) ||
        d.uploadedBy.toLowerCase().includes(term)
    );
  }, [documents, search, cardFilter]);

  const visibleRecords = useMemo(
    () =>
      cardFilter === "compliant"
        ? employeeCompliance.filter((e) => e.status === "compliant")
        : employeeCompliance,
    [employeeCompliance, cardFilter]
  );

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
    toast.success(`Uploaded ${newDoc.name}.`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={ShieldCheck}
          title="Compliance"
          description={`${stats.documents} documents · ${stats.compliant} compliant employees · ${stats.pending} action items`}
          actions={
            <>
              <Button onClick={() => setShowUploadModal(true)} className={headerPrimaryButtonClass}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </>
          }
        />

        <StatGrid>
          <StatCard icon={FileText} label="Documents" value={stats.documents} tone="indigo" active={activeTab === "documents" && cardFilter === null} onClick={() => selectCard(null, "documents")} />
          <StatCard icon={CheckCircle2} label="Compliant" value={stats.compliant} tone="green" active={cardFilter === "compliant"} onClick={() => selectCard("compliant", "status")} />
          <StatCard icon={AlertTriangle} label="Action Items" value={stats.pending} tone="amber" active={cardFilter === "action"} onClick={() => selectCard("action", "documents")} />
          <StatCard icon={History} label="Audit Entries" value={stats.auditEntries} tone="purple" active={activeTab === "audit"} onClick={() => selectCard(null, activeTab === "audit" ? "documents" : "audit")} />
        </StatGrid>

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
            <div className="flex border-b border-gray-200 mb-4 overflow-x-auto [&>button]:shrink-0 [&>button]:whitespace-nowrap">
              <TabButton
                tab="documents"
                activeTab={activeTab}
                onClick={changeTab}
                count={documents.length}
                icon={<FileText className="h-3.5 w-3.5" />}
              />
              <TabButton
                tab="status"
                activeTab={activeTab}
                onClick={changeTab}
                count={employeeCompliance.length}
                icon={<ListChecks className="h-3.5 w-3.5" />}
              />
              <TabButton
                tab="audit"
                activeTab={activeTab}
                onClick={changeTab}
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
              <StatusView records={visibleRecords} />
            )}

            {activeTab === "audit" && <AuditView logs={auditLogs} />}
          </CardContent>
        </Card>
      </div>

      <UploadDocumentModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onSubmit={handleUpload}
      />
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
          {records.length === 0 && (
            <tr>
              <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                No employees match this filter.
              </td>
            </tr>
          )}
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
              {formatDateTime(log.timestamp)} · {log.id}
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

const DOCUMENT_CATEGORIES = toOptions(["Policy", "Certification", "Statutory", "Audit", "Contract"]);

const EMPTY_DOCUMENT: UploadDocumentFormValues = {
  name: "",
  category: "Policy",
  expiryDate: "",
};

function UploadDocumentModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: Pick<ComplianceDocument, "name" | "category" | "expiryDate">
  ) => void;
}) {
  const form = useForm<UploadDocumentFormValues>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: EMPTY_DOCUMENT,
  });

  useEffect(() => {
    if (open) form.reset(EMPTY_DOCUMENT);
  }, [open, form]);

  const save = (values: UploadDocumentFormValues) =>
    onSubmit({
      name: values.name.trim(),
      category: values.category,
      expiryDate: values.expiryDate || null,
    });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={save}
      title="Upload Document"
      description="Add a compliance document."
      submitLabel="Upload"
    >
      <TextField
        control={form.control}
        name="name"
        label="Document name"
        placeholder="POSH Policy 2026.pdf"
        required
      />
      <SelectField
        control={form.control}
        name="category"
        label="Category"
        options={DOCUMENT_CATEGORIES}
      />
      <TextField control={form.control} name="expiryDate" label="Expiry date" type="date" />
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Drop a file or click to browse</p>
        <p className="text-xs text-gray-500 mt-1">PDF, DOCX up to 10 MB</p>
      </div>
    </FormDialog>
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
