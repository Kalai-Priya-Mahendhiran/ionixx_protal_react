import { useState, type ReactNode } from 'react';
import { FileBadge, FileText, Files, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { financialYearOf, financialYearsOf, formatDayMonthYear, formatMonth, payslipsForYear, type Payslip } from '@/lib/payroll';
import { deductionsFromDeclarations, type PayDocument, type TaxDeclaration } from '@/lib/sample-data/payroll-sample-data';
import { form16Html, letterHtml, payslipHtml, type PayEmployee } from './pay-documents';
import { FinancialYearSelect, PayCard } from './pay-shared';
import { downloadFile, formatFinancialYear, printHtml, toCsv } from './pay-utils';

interface PayReportsTabProps {
  payslips: Payslip[];
  employee: PayEmployee;
  documents: PayDocument[];
  // Financial year → date its Form 16 was issued
  form16: Record<string, string>;
  // For the old-regime deductions on Form 16
  declarations: TaxDeclaration[];
  // The Pay and Tax cards, shared with the home tab
  payCard: ReactNode;
  taxCard: ReactNode;
}

const openPrintable = (html: string) => {
  if (!printHtml(html)) toast.error('Allow pop-ups for this site to open the document');
};

export function PayReportsTab({ payslips, employee, documents, form16, declarations, payCard, taxCard }: PayReportsTabProps) {
  return (
    // items-start: each column keeps its cards at their natural height
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <div>{payCard}</div>
      <div className="space-y-6">
        {taxCard}
        <DocumentsCard documents={documents} employee={employee} />
      </div>
      <div className="space-y-6">
        <OtherReportsCard payslips={payslips} employee={employee} />
        <Form16Card payslips={payslips} employee={employee} form16={form16} declarations={declarations} />
      </div>
    </div>
  );
}

function DocumentRow({ title, meta, onOpen }: { title: string; meta: string; onOpen: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <FileText className="h-5 w-5 shrink-0 text-indigo-500" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{meta}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="shrink-0 text-[#464EB8]" onClick={onOpen} aria-label={`Open ${title}`}>
        <Printer className="mr-1.5 h-4 w-4" />
        Open
      </Button>
    </li>
  );
}

const NoDocument = () => <p className="text-sm text-gray-500">Nothing to download for this selection.</p>;

function DocumentsCard({ documents, employee }: { documents: PayDocument[]; employee: PayEmployee }) {
  return (
    <PayCard title="Letters" icon={Files} tone="gray">
      {documents.length === 0 ? (
        <NoDocument />
      ) : (
        <ul className="divide-y divide-gray-100">
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              title={document.title}
              meta={`Issued ${formatDayMonthYear(document.issuedOn)}`}
              onOpen={() => openPrintable(letterHtml(document.title, formatDayMonthYear(document.issuedOn), document.description, employee))}
            />
          ))}
        </ul>
      )}
    </PayCard>
  );
}

// Payslip and the month's pay register line for any processed month
function OtherReportsCard({ payslips, employee }: { payslips: Payslip[]; employee: PayEmployee }) {
  const years = financialYearsOf(payslips);
  const [year, setYear] = useState(years[0] ?? '');
  const months = payslipsForYear(payslips, year).map((payslip) => payslip.month).reverse();
  const [month, setMonth] = useState(months[0] ?? '');
  const payslip = payslips.find((slip) => slip.month === month && financialYearOf(slip.month) === year);

  const changeYear = (next: string) => {
    setYear(next);
    setMonth(payslipsForYear(payslips, next).at(-1)?.month ?? '');
  };

  const downloadRegister = (slip: Payslip) => {
    const rows = [
      ['Type', 'Component', 'Amount'],
      ...slip.earnings.map((component) => ['Earning', component.name, component.amount]),
      ...slip.deductions.map((component) => ['Deduction', component.name, component.amount]),
    ];
    downloadFile(toCsv(rows), `Pay-Register-${slip.month}.csv`, 'text/csv;charset=utf-8');
  };

  return (
    <PayCard title="Monthly reports" icon={FileText} tone="indigo">
      <FinancialYearSelect id="other-reports-year" years={years} value={year} onChange={changeYear} />
      <div className="space-y-1">
        <label htmlFor="other-reports-month" className="text-xs font-medium text-gray-600">
          Month
        </label>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger id="other-reports-month" className="bg-white">
            <SelectValue placeholder="Select one…" />
          </SelectTrigger>
          <SelectContent>
            {months.map((value) => (
              <SelectItem key={value} value={value}>
                {formatMonth(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {payslip ? (
        <ul className="divide-y divide-gray-100">
          <DocumentRow title={`Payslip – ${formatMonth(payslip.month)}`} meta={`Paid on ${formatDayMonthYear(payslip.payDate)}`} onOpen={() => openPrintable(payslipHtml(payslip, payslips, employee))} />
          <DocumentRow title={`Pay register – ${formatMonth(payslip.month)}`} meta="CSV download" onOpen={() => downloadRegister(payslip)} />
        </ul>
      ) : (
        <NoDocument />
      )}
    </PayCard>
  );
}

function Form16Card({ payslips, employee, form16, declarations }: { payslips: Payslip[]; employee: PayEmployee; form16: Record<string, string>; declarations: TaxDeclaration[] }) {
  const years = financialYearsOf(payslips);
  // The latest year that has ended is the one people usually want
  const [year, setYear] = useState(years.find((value) => form16[value]) ?? years[0] ?? '');
  const issuedOn = form16[year];

  return (
    <PayCard title="Form 16" icon={FileBadge} tone="purple">
      <FinancialYearSelect id="form16-year" years={years} value={year} onChange={setYear} />
      {issuedOn ? (
        <ul className="divide-y divide-gray-100">
          <DocumentRow title={`Form 16 – FY ${formatFinancialYear(year)}`} meta={`Part A & B · issued ${formatDayMonthYear(issuedOn)}`} onOpen={() => openPrintable(form16Html(payslips, year, employee, deductionsFromDeclarations(declarations.filter((row) => row.financialYear === year))))} />
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Not issued yet. Form 16 comes out each June, after the financial year ends.</p>
      )}
    </PayCard>
  );
}
