import { z } from "zod";
import { INTEGRATION_CATEGORIES } from "@/lib/constants";
import { ROLE_LABELS, type UserRole } from "@/lib/mock-users";

// Form schemas for the System Admin pages (integrations, workflow rules, inviting users) and attendance notes

export const resolveNoteSchema = z.object({
  note: z.string().trim().min(1, "Add a note to resolve the exception").min(5, "Write at least 5 characters"),
});
export type ResolveNoteFormValues = z.infer<typeof resolveNoteSchema>;

export const integrationSchema = z.object({
  name: z.string().trim().min(1, "Enter the integration name"),
  vendor: z.string().trim().min(1, "Enter the vendor"),
  category: z.enum(INTEGRATION_CATEGORIES, { errorMap: () => ({ message: "Choose a category" }) }),
  endpoint: z
    .string()
    .trim()
    .min(1, "Enter the endpoint URL")
    .url("Enter a valid URL, e.g. https://api.example.com/v1")
    .refine((value) => value.toLowerCase().startsWith("https://"), "The endpoint must use https://"),
  apiKey: z.string().trim().min(1, "Enter the API key").min(8, "The API key must be at least 8 characters"),
});
export type IntegrationFormValues = z.infer<typeof integrationSchema>;

export const workflowRuleSchema = z.object({
  name: z.string().trim().min(1, "Enter the rule name"),
  trigger: z.string().trim().min(1, "Describe when the rule runs"),
  action: z.string().trim().min(1, "Describe what the rule does"),
  enabled: z.boolean(),
});
export type WorkflowRuleFormValues = z.infer<typeof workflowRuleSchema>;

const ROLES = Object.keys(ROLE_LABELS) as [UserRole, ...UserRole[]];

export const inviteUserSchema = z.object({
  name: z.string().trim().min(1, "Enter their full name"),
  email: z.string().trim().min(1, "Enter their work email").email("Enter a valid email, e.g. name@ionixx.com"),
  role: z.enum(ROLES, { errorMap: () => ({ message: "Choose a role" }) }),
  managerId: z.string(),
  department: z.string().trim(),
  designation: z.string().trim(),
});
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
