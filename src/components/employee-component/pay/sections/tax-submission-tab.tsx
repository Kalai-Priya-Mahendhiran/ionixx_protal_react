import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, FileCheck2, Info, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormDialog, primaryButtonClass } from '@/components/ui/form-dialog';
import { SelectField, TextField } from '@/components/ui/form-fields';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { formatDayMonthYear, formatINR, REGIME_RULES, type SubmissionWindow, type TaxRegime } from '@/lib/payroll';
import { declarationSchema, type DeclarationFormValues } from '@/lib/form-schemas/payroll';
import { DECLARATION_TYPES, type TaxDeclaration } from '@/lib/sample-data/payroll-sample-data';
import { ApprovalBadge, FinancialYearSelect, WindowBadge } from './pay-shared';

interface TaxSubmissionTabProps {
  declarations: TaxDeclaration[];
  currentYear: string;
  period: SubmissionWindow;
  windowOpen: boolean;
  regime: TaxRegime;
  // `replaces` is the declaration being resubmitted
  onSubmit: (values: DeclarationFormValues, replaces?: TaxDeclaration) => void;
  onOpenSimulator: () => void;
}

const typeOf = (id: string) => DECLARATION_TYPES.find((type) => type.id === id);
const DECLARATION_OPTIONS = DECLARATION_TYPES.map((type) => ({ value: type.id, label: `${type.label} (${type.section})` }));

export function TaxSubmissionTab({ declarations, currentYear, period, windowOpen, regime, onSubmit, onOpenSimulator }: TaxSubmissionTabProps) {
  const years = [...new Set([currentYear, ...declarations.map((declaration) => declaration.financialYear)])].sort().reverse();
  const [year, setYear] = useState(currentYear);
  const [dialog, setDialog] = useState<{ replaces?: TaxDeclaration } | null>(null);
  const rows = declarations.filter((declaration) => declaration.financialYear === year);
  // Only the current year's declarations can change, and only while the window is open
  const editable = windowOpen && year === currentYear;

  const declared = rows.reduce((total, row) => total + row.declaredAmount, 0);
  const approved = rows.reduce((total, row) => total + row.approvedAmount, 0);
  const needsAction = rows.filter((row) => row.status === 'Rejected' || row.status === 'Partially Approved').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FinancialYearSelect id="tax-submission-year" years={years} value={year} onChange={setYear} className="w-56" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onOpenSimulator}>
            Tax planner
          </Button>
          {editable && (
            <Button className={primaryButtonClass} onClick={() => setDialog({})}>
              <Plus className="mr-2 h-4 w-4" />
              Add investment
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <WindowBadge open={windowOpen} />
            <p className="text-sm font-medium text-gray-800">
              {windowOpen
                ? `You can add or resubmit investments until ${formatDayMonthYear(period.closesOn)}`
                : `Declarations open again on ${formatDayMonthYear(period.opensOn)}. Until then you can review what you've sent.`}
            </p>
          </div>
          <span className="text-sm text-gray-600">
            Tax regime: <strong>{REGIME_RULES[regime].label}</strong>
          </span>
        </CardContent>
      </Card>

      {regime === 'new' && (
        <p className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          You are on the new regime, which doesn&apos;t use these deductions. They count only if you switch to the old regime; compare both in Tax Planner.
        </p>
      )}

      <StatGrid>
        <StatCard icon={Wallet} label="Declared" value={formatINR(declared)} tone="indigo" />
        <StatCard icon={CheckCircle2} label="Approved" value={formatINR(approved)} iconClassName="bg-[var(--pay-approved-bg)] text-[var(--pay-approved-fg)]" />
        <StatCard icon={AlertCircle} label="Needs resubmission" value={needsAction} iconClassName="bg-[var(--pay-partial-bg)] text-[var(--pay-partial-fg)]" />
      </StatGrid>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <FileCheck2 className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">Investment declarations</h2>
          </div>
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-500">No investments declared for this financial year.</p>
          ) : (
            <div className="app-scrollbar overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 text-left text-gray-700">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Investment No</th>
                    <th className="px-4 py-2.5 font-semibold">Investment</th>
                    <th className="px-4 py-2.5 font-semibold">Section</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Declared</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Approved</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Remarks</th>
                    {editable && <th className="px-4 py-2.5 text-right font-semibold">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => {
                    const type = typeOf(row.type);
                    const canResubmit = row.status === 'Rejected' || row.status === 'Partially Approved';
                    return (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.id}</td>
                        <td className="px-4 py-2.5">{type?.label}</td>
                        <td className="px-4 py-2.5 text-gray-600">{type?.section}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(row.declaredAmount)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(row.approvedAmount)}</td>
                        <td className="px-4 py-2.5">
                          <ApprovalBadge status={row.status} />
                        </td>
                        <td className="max-w-[260px] px-4 py-2.5 text-gray-600">{row.remarks ?? '—'}</td>
                        {editable && (
                          <td className="px-4 py-2.5 text-right">
                            {canResubmit && (
                              <Button variant="link" className="h-auto p-0 text-[#464EB8]" onClick={() => setDialog({ replaces: row })}>
                                Resubmit
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {dialog && (
        <DeclarationDialog
          replaces={dialog.replaces}
          onClose={() => setDialog(null)}
          onSubmit={(values) => {
            onSubmit(values, dialog.replaces);
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

function DeclarationDialog({ replaces, onClose, onSubmit }: { replaces?: TaxDeclaration; onClose: () => void; onSubmit: (values: DeclarationFormValues) => void }) {
  const form = useForm<DeclarationFormValues>({
    resolver: zodResolver(declarationSchema),
    defaultValues: { type: replaces?.type ?? '', amount: replaces ? String(replaces.declaredAmount) : '', proofName: '' },
  });
  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      form={form}
      onSubmit={onSubmit}
      title={replaces ? `Resubmit ${replaces.id}` : 'Add investment'}
      description={replaces?.remarks ? `Payroll's note: ${replaces.remarks}` : 'Payroll reviews each proof before it counts towards your tax'}
      submitLabel={replaces ? 'Resubmit' : 'Submit'}
    >
      <SelectField control={form.control} name="type" label="Investment" options={DECLARATION_OPTIONS} placeholder="Select an investment" disabled={!!replaces} />
      <TextField control={form.control} name="amount" label="Amount (₹)" inputMode="numeric" required />
      <TextField control={form.control} name="proofName" label="Proof attached" placeholder="e.g. PPF passbook, premium receipt" required />
    </FormDialog>
  );
}
