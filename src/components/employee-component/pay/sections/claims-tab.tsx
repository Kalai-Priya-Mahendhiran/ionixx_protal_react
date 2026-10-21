import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Columns3, Download, Filter, Info, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormDialog, primaryButtonClass } from '@/components/ui/form-dialog';
import { SelectField, TextField, TextareaField } from '@/components/ui/form-fields';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn, todayAsDateInput } from '@/lib/utils';
import { formatDayMonthYear, formatINR, type SubmissionWindow } from '@/lib/payroll';
import { claimSchema, type ClaimFormValues } from '@/lib/form-schemas/payroll';
import { CLAIM_STATUSES, CLAIM_TYPES, type Claim, type ClaimStatus, type ClaimTypeId } from '@/lib/sample-data/payroll-sample-data';
import { ApprovalBadge, FinancialYearSelect, WindowBadge } from './pay-shared';
import { downloadFile, toCsv } from './pay-utils';

interface ClaimsTabProps {
  claims: Claim[];
  currentYear: string;
  period: SubmissionWindow;
  windowOpen: boolean;
  onSubmit: (values: ClaimFormValues) => void;
}

const typeLabel = (id: string) => CLAIM_TYPES.find((type) => type.id === id)?.label ?? id;

type ColumnKey = 'claimNo' | 'type' | 'updatedOn' | 'amount' | 'approvedAmount' | 'status' | 'remarks';

const COLUMNS: { key: ColumnKey; label: string; numeric?: boolean; value: (claim: Claim) => string | number }[] = [
  { key: 'claimNo', label: 'Claim number', value: (claim) => claim.claimNo },
  { key: 'type', label: 'Category', value: (claim) => typeLabel(claim.type) },
  { key: 'updatedOn', label: 'Last updated', value: (claim) => formatDayMonthYear(claim.updatedOn) },
  { key: 'amount', label: 'Claimed (₹)', numeric: true, value: (claim) => claim.amount },
  { key: 'approvedAmount', label: 'Approved (₹)', numeric: true, value: (claim) => claim.approvedAmount },
  { key: 'status', label: 'Status', value: (claim) => claim.status },
  { key: 'remarks', label: 'Notes', value: (claim) => claim.remarks },
];
const ALL_COLUMNS = COLUMNS.map((column) => column.key);

export function ClaimsTab({ claims, currentYear, period, windowOpen, onSubmit }: ClaimsTabProps) {
  const years = [...new Set([currentYear, ...claims.map((claim) => claim.financialYear)])].sort().reverse();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState<ClaimTypeId[]>([]);
  const [statuses, setStatuses] = useState<ClaimStatus[]>([]);
  const [columns, setColumns] = useState<ColumnKey[]>(ALL_COLUMNS);
  const [creating, setCreating] = useState(false);
  const canSubmit = windowOpen && year === currentYear;

  const visibleColumns = COLUMNS.filter((column) => columns.includes(column.key));
  const filterCount = types.length + statuses.length;
  const rows = claims
    .filter((claim) => claim.financialYear === year)
    .filter((claim) => !search.trim() || claim.claimNo.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((claim) => types.length === 0 || types.includes(claim.type))
    .filter((claim) => statuses.length === 0 || statuses.includes(claim.status))
    .sort((a, b) => b.updatedOn.localeCompare(a.updatedOn));

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  const download = (format: 'csv' | 'tsv') => {
    const table = [visibleColumns.map((column) => column.label), ...rows.map((claim) => visibleColumns.map((column) => column.value(claim)))];
    if (format === 'csv') downloadFile(toCsv(table), `Claims-FY-${year}.csv`, 'text/csv;charset=utf-8');
    else downloadFile(table.map((row) => row.join('\t')).join('\n'), `Claims-FY-${year}.xls`, 'application/vnd.ms-excel');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FinancialYearSelect id="claims-year" years={years} value={year} onChange={setYear} className="w-full max-w-sm" />
        <div className="flex flex-wrap gap-2">
          {canSubmit && (
            <Button className={primaryButtonClass} onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New claim
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-[#464EB8] text-[#464EB8] hover:bg-indigo-50 hover:text-[#464EB8]" disabled={rows.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => download('csv')}>CSV</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => download('tsv')}>Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-col items-center gap-2 p-5 text-center sm:flex-row sm:text-left">
          <WindowBadge open={windowOpen} />
          <p className="flex-1 text-sm font-medium text-gray-900 sm:text-center">
            {windowOpen
              ? `Accepting claims until ${formatDayMonthYear(period.closesOn)}, for bills dated in this financial year.`
              : `Claims open again on ${formatDayMonthYear(period.opensOn)}. You can still look through your past claims below.`}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Your claims</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-[#464EB8] text-[#464EB8] hover:bg-indigo-50 hover:text-[#464EB8]">
                  <Filter className="mr-1.5 h-4 w-4" />
                  Filters
                  {filterCount > 0 && <span className="ml-1.5 rounded-full bg-[#464EB8] px-1.5 text-xs text-white">{filterCount}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuLabel>Category</DropdownMenuLabel>
                {CLAIM_TYPES.map((type) => (
                  <DropdownMenuCheckboxItem key={type.id} checked={types.includes(type.id)} onCheckedChange={() => setTypes((current) => toggle(current, type.id))} onSelect={(event) => event.preventDefault()}>
                    {type.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                {CLAIM_STATUSES.map((status) => (
                  <DropdownMenuCheckboxItem key={status} checked={statuses.includes(status)} onCheckedChange={() => setStatuses((current) => toggle(current, status))} onSelect={(event) => event.preventDefault()}>
                    {status}
                  </DropdownMenuCheckboxItem>
                ))}
                {filterCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => {
                        setTypes([]);
                        setStatuses([]);
                      }}
                    >
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-[#464EB8] text-[#464EB8] hover:bg-indigo-50 hover:text-[#464EB8]">
                  <Columns3 className="mr-1.5 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                  {COLUMNS.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      checked={columns.includes(column.key)}
                      // Keep at least one column
                      disabled={columns.length === 1 && columns.includes(column.key)}
                      onCheckedChange={() => setColumns((current) => ALL_COLUMNS.filter((key) => (key === column.key ? !current.includes(key) : current.includes(key))))}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {columns.length < ALL_COLUMNS.length && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setColumns(ALL_COLUMNS)}>Show all columns</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by claim number" aria-label="Search claim number" className="bg-white pl-9" />
          </div>
        </div>

        <div className="ionixx-scrollbar overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-gray-100 text-left text-gray-800">
              <tr>
                {visibleColumns.map((column) => (
                  <th key={column.key} className={cn('px-4 py-3 font-semibold', column.numeric && 'text-right')}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-sm text-gray-500">
                    No claims for this year yet.
                  </td>
                </tr>
              ) : (
                rows.map((claim) => (
                  <tr key={claim.claimNo} className="hover:bg-gray-50">
                    {visibleColumns.map((column) => (
                      <td key={column.key} className={cn('px-4 py-3', column.numeric && 'text-right tabular-nums', column.key === 'claimNo' && 'font-medium text-gray-900')}>
                        {column.key === 'status' ? <ApprovalBadge status={claim.status} /> : column.numeric ? formatINR(Number(column.value(claim))) : column.value(claim)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!canSubmit && year === currentYear && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            You can add new claims while claims are being accepted.
          </p>
        )}
      </section>

      {creating && (
        <ClaimDialog
          onClose={() => setCreating(false)}
          onSubmit={(values) => {
            onSubmit(values);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

const CLAIM_TYPE_OPTIONS = CLAIM_TYPES.map((type) => ({ value: type.id, label: `${type.label} (limit ${formatINR(type.yearlyLimit)} a year)` }));

function ClaimDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (values: ClaimFormValues) => void }) {
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: { type: '', billDate: todayAsDateInput(), amount: '', remarks: '' },
  });
  return (
    <FormDialog open onOpenChange={(open) => !open && onClose()} form={form} onSubmit={onSubmit} title="New claim" description="Payroll reviews the bills and updates the approved amount" submitLabel="Submit claim">
      <SelectField control={form.control} name="type" label="Category" options={CLAIM_TYPE_OPTIONS} placeholder="Choose a category" />
      <TextField control={form.control} name="billDate" label="Bill date" type="date" max={todayAsDateInput()} required />
      <TextField control={form.control} name="amount" label="Amount (₹)" inputMode="numeric" required />
      <TextareaField control={form.control} name="remarks" label="Remarks" required />
    </FormDialog>
  );
}
