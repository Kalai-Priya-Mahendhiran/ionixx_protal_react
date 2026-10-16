import { z } from "zod";
import { EXPENSE_CATEGORY_VALUES, REQUEST_CATEGORY_VALUES } from "@/lib/schemas";

// Form schemas for the Admin service desk (asset issue, budgets, SLA targets, resolving a request)

export const issueAssetSchema = z.object({
  userId: z.string().min(1, "Choose who gets the asset"),
  requestKey: z
    .string()
    .trim()
    .refine((value) => value === "" || /^ADM-\d+$/i.test(value), "A request key, e.g. ADM-107"),
});
export type IssueAssetFormValues = z.infer<typeof issueAssetSchema>;

const wholeRupees = z.string().trim().min(1, "Enter the budget").regex(/^\d+$/, "Whole rupees, e.g. 30000");

export const budgetsSchema = z.object(
  Object.fromEntries(EXPENSE_CATEGORY_VALUES.map((category) => [category, wholeRupees])) as Record<(typeof EXPENSE_CATEGORY_VALUES)[number], typeof wholeRupees>,
);
export type BudgetsFormValues = z.infer<typeof budgetsSchema>;

export const SLA_MIN_HOURS = 0.5;
export const SLA_MAX_HOURS = 720;

const hours = z
  .string()
  .trim()
  .min(1, "Enter the hours")
  .refine((value) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= SLA_MIN_HOURS && number <= SLA_MAX_HOURS;
  }, `${SLA_MIN_HOURS}–${SLA_MAX_HOURS} hours`);

const slaRow = z
  .object({ responseHours: hours, resolutionHours: hours })
  .refine((row) => !(Number(row.responseHours) > Number(row.resolutionHours)), { message: "Can't be under the response target", path: ["resolutionHours"] });

export const slaSchema = z.object(
  Object.fromEntries(REQUEST_CATEGORY_VALUES.map((category) => [category, slaRow])) as Record<(typeof REQUEST_CATEGORY_VALUES)[number], typeof slaRow>,
);
export type SlaFormValues = z.infer<typeof slaSchema>;

export const resolveRequestSchema = z.object({
  note: z.string().trim().max(2000, "Keep it under 2000 characters"),
});
export type ResolveRequestFormValues = z.infer<typeof resolveRequestSchema>;
