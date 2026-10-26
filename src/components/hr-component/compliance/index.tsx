import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  History,
  ListChecks,
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
import { AuditLogSection, DocumentsSection, EmployeeStatusSection, UploadDocumentDialog } from "./sections";
import { seedAuditLogs, seedDocuments, seedEmployeeCompliance } from "./sections/compliance-data";
import { COMPLIANCE_INFO } from "./sections/compliance-info";
import type { AuditLog, CardFilter, ComplianceDocument, EmployeeCompliance, NewComplianceDocument, Tab } from "./sections/compliance-meta";

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

  const handleUpload = (data: NewComplianceDocument) => {
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
          info={COMPLIANCE_INFO}
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
            <PageTabs
              className="mb-4"
              label="Compliance"
              tabs={[
                { id: "documents", label: "Documents", icon: FileText, count: documents.length },
                { id: "status", label: "Employee Status", icon: ListChecks, count: employeeCompliance.length },
                { id: "audit", label: "Audit Logs", icon: History, count: auditLogs.length },
              ]}
              value={activeTab}
              onChange={changeTab}
            />

            {activeTab === "documents" && (
              <DocumentsSection
                documents={filteredDocs}
                search={search}
                onSearchChange={setSearch}
              />
            )}

            {activeTab === "status" && (
              <EmployeeStatusSection records={visibleRecords} />
            )}

            {activeTab === "audit" && <AuditLogSection logs={auditLogs} />}
          </CardContent>
        </Card>
      </div>

      <UploadDocumentDialog
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onSubmit={handleUpload}
      />
    </MainLayout>
  );
}
