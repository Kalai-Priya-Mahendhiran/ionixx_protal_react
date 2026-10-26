import { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, FileCheck2, Lightbulb, Receipt } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { primaryButtonClass } from '@/components/ui/form-dialog';
import { cn } from '@/lib/utils';
import { formatDayMonthYear, formatINR, type SubmissionWindow } from '@/lib/payroll';
import { CLAIM_TYPES, HELP_TOPICS, PAY_TIPS, type Claim, type TaxDeclaration } from '@/lib/sample-data/payroll-sample-data';
import { PayCard, WindowBadge } from './pay-shared';

// ── Quick tips ──────────────────────────────────────────────────────────────

export function QuickTipsCard() {
  const [index, setIndex] = useState(0);
  const tip = PAY_TIPS[index];
  const move = (step: number) => setIndex((current) => (current + step + PAY_TIPS.length) % PAY_TIPS.length);

  return (
    <PayCard title="Quick tips" icon={Lightbulb} tone="amber">
      <div className="flex flex-1 items-center gap-2" aria-roledescription="carousel" aria-label="Pay and tax tips">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[#464EB8]" onClick={() => move(-1)} aria-label="Previous tip">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center" aria-live="polite">
          <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
          <p className="mt-2 text-sm text-gray-600">{tip.body}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[#464EB8]" onClick={() => move(1)} aria-label="Next tip">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-center gap-2">
        {PAY_TIPS.map((item, dot) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setIndex(dot)}
            aria-label={`Tip ${dot + 1} of ${PAY_TIPS.length}`}
            aria-current={dot === index}
            className={cn('h-2.5 w-2.5 rounded-full border border-[#464EB8]', dot === index ? 'bg-[#464EB8]' : 'bg-white')}
          />
        ))}
      </div>
    </PayCard>
  );
}

// ── Tax declarations────────────────────────────────────────────────────────

interface TaxDeclarationsCardProps {
  period: SubmissionWindow;
  open: boolean;
  declarations: TaxDeclaration[];
  onOpenSubmission: () => void;
  onOpenSimulator: () => void;
}

export function TaxDeclarationsCard({ period, open, declarations, onOpenSubmission, onOpenSimulator }: TaxDeclarationsCardProps) {
  const needsAction = declarations.filter((declaration) => declaration.status === 'Rejected' || declaration.status === 'Partially Approved').length;
  return (
    <PayCard title="Tax declarations" icon={FileCheck2} tone="blue" action={<WindowBadge open={open} />}>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        {open ? (
          <>
            <p className="text-base font-semibold text-gray-900">Declarations are open until {formatDayMonthYear(period.closesOn)}</p>
            <p className="text-sm text-gray-600">
              Add your tax-saving investments and attach proofs.
              {needsAction > 0 && ` ${needsAction} ${needsAction === 1 ? 'proof needs' : 'proofs need'} resubmitting.`}
            </p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-gray-900">Declarations open again on {formatDayMonthYear(period.opensOn)}</p>
            <p className="text-sm text-gray-600">Until then you can review the proofs you&apos;ve already sent.</p>
          </>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" className="border-[#464EB8] text-[#464EB8] hover:bg-indigo-50 hover:text-[#464EB8]" onClick={onOpenSubmission}>
          {open ? 'Add declarations' : 'Review declarations'}
        </Button>
        <Button className={primaryButtonClass} onClick={onOpenSimulator}>
          Tax planner
        </Button>
      </div>
    </PayCard>
  );
}

// ── Reimbursements ─────────────────────────────────────────────────────────

interface ReimbursementsCardProps {
  open: boolean;
  period: SubmissionWindow;
  // Claims in the current financial year
  claims: Claim[];
  onOpenClaims: () => void;
}

export function ReimbursementsCard({ open, period, claims, onOpenClaims }: ReimbursementsCardProps) {
  // Rejected claims don't use up the limit
  const submittedFor = (type: string) => claims.filter((claim) => claim.type === type && claim.status !== 'Rejected').reduce((total, claim) => total + claim.amount, 0);
  return (
    <PayCard
      title="Reimbursements"
      icon={Receipt}
      tone="pink"
      action={
        <Button variant="link" className="h-auto p-0 text-[#464EB8]" onClick={onOpenClaims}>
          {open ? 'New claim' : 'View claims'}
        </Button>
      }
    >
      <p className="text-sm text-gray-600">{open ? `Accepting claims until ${formatDayMonthYear(period.closesOn)}` : 'Not accepting claims right now'}</p>
      <div className="app-scrollbar overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 font-semibold text-gray-900">Category</th>
              <th className="py-2 font-semibold text-gray-900">Claimed</th>
              <th className="py-2 text-right font-semibold text-gray-900">Yearly limit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {CLAIM_TYPES.map((type) => {
              const submitted = submittedFor(type.id);
              const share = Math.min((submitted / type.yearlyLimit) * 100, 100);
              return (
                <tr key={type.id}>
                  <td className="py-2 text-gray-800">{type.label}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-gray-100" aria-hidden="true">
                        <div className="h-1.5 rounded-full bg-[#464EB8]" style={{ width: `${share}%` }} />
                      </div>
                      <span className="tabular-nums">{formatINR(submitted)}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right tabular-nums text-gray-700">{formatINR(type.yearlyLimit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PayCard>
  );
}

// ── How-to guides────────────────────────────────────────────────────────────

export function GuidesCard() {
  return (
    <PayCard title="How-to guides" icon={BookOpen} tone="sky">
      <p className="text-sm text-gray-600">Short step-by-step guides for common payroll tasks.</p>
      {/* One guide open at a time; the first starts open */}
      <Accordion
        items={HELP_TOPICS.map((topic) => ({
          id: topic.title,
          title: topic.title,
          content: (
            <ol className="ml-5 list-decimal space-y-1 text-sm text-gray-600">
              {topic.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ),
        }))}
      />
    </PayCard>
  );
}
