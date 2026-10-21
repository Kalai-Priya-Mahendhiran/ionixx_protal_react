import { z } from "zod";
import { CLAIM_TYPES, DECLARATION_TYPES } from "@/lib/sample-data/payroll-sample-data";

// Form schemas for Pay & Tax (reimbursement claims, investment declarations)

const CLAIM_TYPE_IDS = CLAIM_TYPES.map((type) => type.id) as [string, ...string[]];
const DECLARATION_TYPE_IDS = DECLARATION_TYPES.map((type) => type.id) as [string, ...string[]];

const wholeRupees = (missing: string) =>
  z
    .string()
    .trim()
    .min(1, missing)
    .regex(/^\d+$/, "Whole rupees, e.g. 2500")
    .refine((value) => Number(value) > 0, "Enter an amount above zero");

export const claimSchema = z.object({
  type: z.enum(CLAIM_TYPE_IDS as [string, ...string[]], { required_error: "Select a claim type", invalid_type_error: "Select a claim type" }),
  billDate: z.string().min(1, "Select the bill date"),
  amount: wholeRupees("Enter the claim amount"),
  remarks: z.string().trim().min(1, "Describe the bills").max(300, "Keep remarks under 300 characters"),
});
export type ClaimFormValues = z.infer<typeof claimSchema>;

export const declarationSchema = z.object({
  type: z.enum(DECLARATION_TYPE_IDS as [string, ...string[]], { required_error: "Select an investment", invalid_type_error: "Select an investment" }),
  amount: wholeRupees("Enter the amount"),
  proofName: z.string().trim().min(1, "Name the proof you are attaching, e.g. PPF passbook"),
});
export type DeclarationFormValues = z.infer<typeof declarationSchema>;
