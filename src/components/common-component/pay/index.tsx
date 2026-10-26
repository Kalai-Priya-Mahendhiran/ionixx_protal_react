import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calculator, FileCheck2, FileText, Home, Receipt, Wallet, type LucideIcon } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/context/auth-context';
import { cn, todayAsDateInput } from '@/lib/utils';
import { buildTaxStatement, financialYearOf, isWindowOpen, type Payslip } from '@/lib/payroll';
import type { ClaimFormValues, DeclarationFormValues } from '@/lib/form-schemas/payroll';
import {
  CLAIM_SUBMISSION_WINDOW,
  TAX_SUBMISSION_WINDOW,
  deductionsFromDeclarations,
  getPayrollData,
  type ClaimTypeId,
  type DeclarationTypeId,
  type TaxDeclaration,
} from '@/lib/sample-data/payroll-sample-data';
import { useMyClaims, useMyDeclarations, useSubmitClaim, useSubmitDeclaration } from '@/services/apis/payroll/use-payroll';
import {
  ReimbursementsCard,
  ClaimsTab,
  QuickTipsCard,
  GuidesCard,
  PayHistorySheet,
  PayReportsTab,
  PaySummaryCard,
  PayslipDialog,
  TaxStatementSheet,
  TaxSimulatorTab,
  TaxSubmissionTab,
  TaxDeclarationsCard,
  TaxSummaryCard,
  usePayTheme,
  type PayslipView,
} from './sections';
import { PageTabs } from '@/components/common-component/tabs';

type PayTab = 'home' | 'reports' | 'tax-submission' | 'tax-simulator' | 'claims';

const TABS: { id: PayTab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Overview', icon: Home },
  { id: 'reports', label: 'Documents', icon: FileText },
  { id: 'tax-submission', label: 'Tax Declarations', icon: FileCheck2 },
  { id: 'tax-simulator', label: 'Tax Planner', icon: Calculator },
  { id: 'claims', label: 'Reimbursements', icon: Receipt },
];

const isPayTab = (value: string | null): value is PayTab => TABS.some((tab) => tab.id === value);

export default function Pay() {
  const { user } = useAuth();
  // The tab lives in the URL (?tab=claims) so it can be linked and survives a refresh
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: PayTab = isPayTab(tabParam) ? tabParam : 'home';
  const openTab = (next: PayTab) => setParams(next === 'home' ? {} : { tab: next });

  // Each login has its own salary and tax regime; claims and proofs are live (HR reviews them in Approvals)
  const payroll = getPayrollData(user?.id);
  const { data: declarations = [] } = useMyDeclarations();
  const { data: claims = [] } = useMyClaims();
  const submitDeclarationMutation = useSubmitDeclaration();
  const submitClaimMutation = useSubmitClaim();
  const [payslipView, setPayslipView] = useState<{ payslip: Payslip; view: PayslipView } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Pay & Tax colours (see pay-theme.ts)
  usePayTheme();
  const [statementOpen, setStatementOpen] = useState(false);

  const today = todayAsDateInput();
  const currentYear = financialYearOf(today.slice(0, 7));
  const regime = payroll.profile.taxRegime;
  const payslips = payroll.payslips;
  const latestPayslip = payslips.at(-1);
  const currentDeclarations = declarations.filter((declaration) => declaration.financialYear === currentYear);
  // Approved proofs lower the tax only under the old regime (computeIncomeTax ignores them under the new one)
  const statement = buildTaxStatement(payslips, currentYear, regime, deductionsFromDeclarations(currentDeclarations));
  const taxWindowOpen = isWindowOpen(TAX_SUBMISSION_WINDOW, today);
  const claimWindowOpen = isWindowOpen(CLAIM_SUBMISSION_WINDOW, today);
  const employee = {
    name: user?.name ?? 'Employee',
    employeeId: user?.employeeId ?? '',
    designation: user?.designation ?? '',
    department: user?.department ?? '',
    ...payroll.profile,
  };

  const submitDeclaration = (values: DeclarationFormValues, replaces?: TaxDeclaration) =>
    submitDeclarationMutation.mutate({ input: { type: values.type as DeclarationTypeId, amount: Number(values.amount), proofName: values.proofName }, replacesId: replaces?.id });

  const submitClaim = (values: ClaimFormValues) =>
    submitClaimMutation.mutate({ type: values.type as ClaimTypeId, billDate: values.billDate, amount: Number(values.amount), remarks: values.remarks });

  const payCard = <PaySummaryCard payslip={latestPayslip} onViewPayslip={(payslip) => setPayslipView({ payslip, view: 'payslip' })} onOpenHistory={() => setHistoryOpen(true)} />;
  const taxCard = <TaxSummaryCard statement={statement} onOpenStatement={() => setStatementOpen(true)} />;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={Wallet}
          title="Pay & Tax"
          description="Your salary, income tax, tax-saving declarations and reimbursements"
        />

        <PageTabs label="Pay and tax" tabs={TABS} value={tab} onChange={openTab} />

        {tab === 'home' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {payCard}
              <QuickTipsCard />
              {taxCard}
            </div>
            <TaxDeclarationsCard
              period={TAX_SUBMISSION_WINDOW}
              open={taxWindowOpen}
              declarations={currentDeclarations}
              onOpenSubmission={() => openTab('tax-submission')}
              onOpenSimulator={() => openTab('tax-simulator')}
            />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ReimbursementsCard
                  open={claimWindowOpen}
                  period={CLAIM_SUBMISSION_WINDOW}
                  claims={claims.filter((claim) => claim.financialYear === currentYear)}
                  onOpenClaims={() => openTab('claims')}
                />
              </div>
              <GuidesCard />
            </div>
          </div>
        )}

        {tab === 'reports' && <PayReportsTab payslips={payslips} employee={employee} documents={payroll.documents} form16={payroll.form16} declarations={declarations} payCard={payCard} taxCard={taxCard} />}

        {tab === 'tax-submission' && (
          <TaxSubmissionTab
            declarations={declarations}
            currentYear={currentYear}
            period={TAX_SUBMISSION_WINDOW}
            windowOpen={taxWindowOpen}
            regime={regime}
            onSubmit={submitDeclaration}
            onOpenSimulator={() => openTab('tax-simulator')}
          />
        )}

        {tab === 'tax-simulator' && (
          <TaxSimulatorTab
            financialYear={currentYear}
            projectedGross={statement.yearEndGross}
            declarations={currentDeclarations}
            currentRegime={regime}
          />
        )}

        {tab === 'claims' && <ClaimsTab claims={claims} currentYear={currentYear} period={CLAIM_SUBMISSION_WINDOW} windowOpen={claimWindowOpen} onSubmit={submitClaim} />}
      </div>

      <PayHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} payslips={payslips} onView={(payslip, view) => setPayslipView({ payslip, view })} />
      <TaxStatementSheet open={statementOpen} onOpenChange={setStatementOpen} payslips={payslips} regime={regime} declarations={declarations} />
      <PayslipDialog payslip={payslipView?.payslip ?? null} view={payslipView?.view ?? 'payslip'} payslips={payslips} employee={employee} onClose={() => setPayslipView(null)} />
    </MainLayout>
  );
}
