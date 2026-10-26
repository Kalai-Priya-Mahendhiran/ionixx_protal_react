import type { InfoContent } from '@/components/common-component/info';

// The ⓘ next to the Pay & Tax title
export const PAY_INFO: InfoContent = {
  title: 'About Pay & Tax',
  description: 'Your salary, income tax, tax-saving investments and reimbursement claims in one place.',
  sections: [
    {
      heading: 'What you can do here',
      items: [
        'Overview: see your latest salary and tax, and view or print your payslips',
        'Documents: open your payslips, letters and Form 16',
        'Tax Declarations and Tax Planner: add your investments with proof, and compare the old and new tax regimes',
        'Reimbursements: claim money back for bills and see how much was approved',
      ],
    },
    {
      heading: 'Good to know',
      items: [
        'Investments and claims can only be submitted while their window is open',
        'The payroll team reviews your proofs and claims; you can resubmit a proof that was rejected or partly approved',
        'Approved proofs lower your tax only under the old tax regime',
        'Amounts stay hidden until you choose to show them',
      ],
    },
  ],
};
