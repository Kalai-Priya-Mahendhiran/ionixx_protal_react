import { useState } from 'react';
import { CheckCircle2, ChevronDown, Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fieldClass } from '@/components/ui/form-fields';
import { cn } from '@/lib/utils';
import { computeIncomeTax, DEDUCTION_LIMITS, formatINR, REGIME_RULES, type TaxBreakdown, type TaxDeductions, type TaxRegime } from '@/lib/payroll';
import { deductionsFromDeclarations, type TaxDeclaration } from '@/lib/sample-data/payroll-sample-data';
import { formatFinancialYear } from './pay-utils';

/*
 * Tax Planner: "which tax regime leaves me with less tax?" answered in plain words.
 * Salary and approved proofs are filled in; the person can change any number and the answer updates.
 */

interface TaxSimulatorTabProps {
  financialYear: string;
  // Expected salary for the whole year
  projectedGross: number;
  // This year's declarations; approved amounts fill in the investments
  declarations: TaxDeclaration[];
  currentRegime: TaxRegime;
}

type InvestmentKey = Exclude<keyof TaxDeductions, 'otherDeductions'>;

// Everyday names for the tax sections
const INVESTMENTS: { key: InvestmentKey; label: string; hint: string }[] = [
  { key: 'section80C', label: 'Savings and insurance', hint: 'PPF, ELSS, life insurance, children’s school fees' },
  { key: 'section80D', label: 'Health insurance premium', hint: 'For you, your family or your parents' },
  { key: 'hraExemption', label: 'Tax-free part of your rent allowance', hint: 'Only if you live on rent; see your approved rent proof' },
  { key: 'homeLoanInterest', label: 'Home loan interest', hint: 'For a house you live in' },
  { key: 'nps80CCD1B', label: 'Extra pension (NPS)', hint: 'Over and above savings and insurance' },
];

const toText = (value: number) => (value ? String(Math.round(value)) : '');
const toNumber = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};
const initialInvestments = (declarations: TaxDeclaration[]) => {
  const approved = deductionsFromDeclarations(declarations);
  return Object.fromEntries(INVESTMENTS.map(({ key }) => [key, toText(approved[key])])) as Record<InvestmentKey, string>;
};

export function TaxSimulatorTab({ financialYear, projectedGross, declarations, currentRegime }: TaxSimulatorTabProps) {
  const [salary, setSalary] = useState(toText(projectedGross));
  const [investments, setInvestments] = useState(() => initialInvestments(declarations));

  const deductions: TaxDeductions = { otherDeductions: 0, ...(Object.fromEntries(INVESTMENTS.map(({ key }) => [key, toNumber(investments[key])])) as Record<InvestmentKey, number>) };
  const income = toNumber(salary);
  const results: Record<TaxRegime, TaxBreakdown> = { new: computeIncomeTax(income, 'new'), old: computeIncomeTax(income, 'old', deductions) };
  const winner: TaxRegime | null = results.new.totalTax === results.old.totalTax ? null : results.new.totalTax < results.old.totalTax ? 'new' : 'old';
  const saving = Math.abs(results.new.totalTax - results.old.totalTax);

  const reset = () => {
    setSalary(toText(projectedGross));
    setInvestments(initialInvestments(declarations));
  };

  return (
    <div className="space-y-6">
      {/* What the two regimes mean */}
      <Card className="border-0 shadow-lg">
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Which tax regime saves you more?</h2>
            <p className="text-sm text-gray-600">India has two ways to work out income tax. You pick one each year. Enter your numbers below and we&apos;ll tell you which one costs you less.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <RegimeExplainer regime="new" text="Lower tax rates, but investments and rent don't reduce your tax." current={currentRegime === 'new'} />
            <RegimeExplainer regime="old" text="Higher tax rates, but savings, insurance, rent and home loan reduce the income that is taxed." current={currentRegime === 'old'} />
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        {/* Inputs */}
        <Card className="border-0 shadow-lg lg:col-span-3">
          <CardContent className="space-y-6 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">Filled in from your salary and approved proofs for {formatFinancialYear(financialYear)}. Change any number to try it out.</p>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset
              </Button>
            </div>

            <section className="space-y-2">
              <StepTitle step={1} title="Your salary for the year" />
              <MoneyInput id="planner-salary" value={salary} onChange={setSalary} ariaLabel="Your salary for the year" />
              <p className="text-xs text-gray-500">Before any deductions. Your expected total for this year is filled in.</p>
            </section>

            <section className="space-y-3">
              <StepTitle step={2} title="What you invest or pay in a year" />
              <p className="flex items-start gap-1.5 text-xs text-gray-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                These only lower your tax in the old regime. Leave a box empty if it doesn&apos;t apply to you.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {INVESTMENTS.map(({ key, label, hint }) => {
                  const limit = DEDUCTION_LIMITS[key];
                  const overLimit = Number.isFinite(limit) && toNumber(investments[key]) > limit;
                  return (
                    <div key={key} className="space-y-1">
                      <label htmlFor={`planner-${key}`} className="text-sm font-medium text-gray-800">
                        {label}
                      </label>
                      <MoneyInput id={`planner-${key}`} value={investments[key]} onChange={(value) => setInvestments((current) => ({ ...current, [key]: value }))} />
                      <p className={cn('text-xs', overLimit ? 'font-medium text-[var(--pay-deep)]' : 'text-gray-500')}>
                        {hint}
                        {Number.isFinite(limit) && (overLimit ? ` · only ${formatINR(limit)} counts` : ` · counts up to ${formatINR(limit)}`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Answer */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:col-span-2">
          <Card className={cn('border-0 shadow-lg', winner && 'ring-2 ring-[var(--pay-line)]')}>
            <CardContent className="space-y-5 p-5" aria-live="polite">
              <StepTitle step={3} title="Your answer" />
              {winner ? (
                <div className="flex items-start gap-3 rounded-xl bg-[var(--pay-tint)] p-4">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[var(--pay-deep)]" aria-hidden="true" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Choose the {REGIME_RULES[winner].label.toLowerCase()}</p>
                    <p className="text-sm text-gray-700">
                      You pay <strong>{formatINR(saving)} less tax</strong> a year, about {formatINR(saving / 12)} a month.
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {winner === currentRegime ? 'This is already the regime you are on, so nothing to change.' : `You are on the ${REGIME_RULES[currentRegime].label.toLowerCase()} now. You can switch when tax declarations open.`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">Both regimes give the same tax for these numbers, so either is fine.</p>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-800">Tax for the year</p>
                {(['new', 'old'] as const).map((regime) => (
                  <TaxBar key={regime} label={REGIME_RULES[regime].label} amount={results[regime].totalTax} max={Math.max(results.new.totalTax, results.old.totalTax, 1)} best={winner === regime} />
                ))}
                <p className="text-xs text-gray-500">Shorter bar = less tax.</p>
              </div>
            </CardContent>
          </Card>

          <details className="group rounded-lg bg-white shadow-lg">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium text-gray-800 [&::-webkit-details-marker]:hidden">
              Show how this was worked out
              <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="grid gap-4 border-t border-gray-100 p-4">
              {(['new', 'old'] as const).map((regime) => (
                <Workings key={regime} result={results[regime]} />
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function RegimeExplainer({ regime, text, current }: { regime: TaxRegime; text: string; current: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <p className="flex items-center gap-2 font-semibold text-gray-900">
        {REGIME_RULES[regime].label}
        {current && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">You are on this</span>}
      </p>
      <p className="mt-1 text-sm text-gray-600">{text}</p>
    </div>
  );
}

function StepTitle({ step, title }: { step: number; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#464EB8] text-xs font-bold text-white">{step}</span>
      {title}
    </h3>
  );
}

function MoneyInput({ id, value, onChange, ariaLabel }: { id: string; value: string; onChange: (value: string) => void; ariaLabel?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
      <Input
        id={id}
        inputMode="numeric"
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
        placeholder="0"
        className={cn(fieldClass, 'pl-7 tabular-nums')}
      />
      {value && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{formatINR(Number(value))}</span>}
    </div>
  );
}

// One labelled bar per regime; the cheaper one takes the sample colour, the other grey
function TaxBar({ label, amount, max, best }: { label: string; amount: number; max: number; best: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={cn('text-gray-700', best && 'font-semibold text-gray-900')}>
          {label}
          {best && ' · lower'}
        </span>
        <span className="font-semibold tabular-nums text-gray-900">{formatINR(amount)}</span>
      </div>
      <div className="h-3 rounded-full bg-gray-100">
        <div className={cn('h-3 rounded-full', best ? 'bg-[var(--pay-take)]' : 'bg-gray-300')} style={{ width: `${Math.max((amount / max) * 100, amount > 0 ? 2 : 0)}%` }} />
      </div>
    </div>
  );
}

function Workings({ result }: { result: TaxBreakdown }) {
  const rows: [string, number][] = [
    ['Salary for the year', result.grossIncome],
    ['Standard deduction (everyone gets this)', -result.standardDeduction],
    ['Your investments and rent', -result.otherDeductions],
    ['Income that is taxed', result.taxableIncome],
    ['Tax as per the slabs', result.taxOnIncome],
    ['Tax relief for lower incomes (87A)', -result.rebate],
    ['Health & education cess (4%)', result.cess],
  ];
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-gray-900">{REGIME_RULES[result.regime].label}</p>
      <dl className="divide-y divide-gray-100 text-sm">
        {rows.map(([label, amount]) => (
          <div key={label} className="flex justify-between gap-3 py-1.5">
            <dt className="text-gray-600">{label}</dt>
            <dd className="tabular-nums">{formatINR(amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 py-1.5 font-semibold">
          <dt>Tax for the year</dt>
          <dd className="tabular-nums">{formatINR(result.totalTax)}</dd>
        </div>
      </dl>
    </div>
  );
}
