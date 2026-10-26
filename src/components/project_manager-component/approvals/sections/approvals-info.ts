import type { InfoContent } from "@/components/common-component/info";

// The ⓘ next to the Approvals title. Payroll reviewers (HR) also see what else comes to them.
export function getApprovalsInfo(reviewsPayroll: boolean): InfoContent {
  return {
    title: "About Approvals",
    description: "Every request waiting for your decision, in one list.",
    sections: [
      {
        heading: "What you can do here",
        items: [
          "Approve or reject a request, or tick several and decide them together",
          "Add a comment with your decision; it's required when you reject, so they know why",
          "Use the Pending, Approved and Rejected tabs to look back at earlier decisions",
        ],
      },
      {
        heading: "Good to know",
        items: [
          "Leave, work from home and time off requests from the people who report to you come here",
          "The person sees your decision and comment straight away",
          "Each pending request shows who decides it and why",
        ],
      },
      ...(reviewsPayroll
        ? [
            {
              heading: "For payroll reviewers",
              items: [
                "Reimbursement claims and tax-saving proofs also come here for you to check",
                "Leave and work requests come to you when someone has no reporting manager, or their manager is on leave that day",
              ],
            },
          ]
        : []),
    ],
  };
}
