import { z } from "zod";

// Form schemas for Tasks (saved filters, sending a task back, automation rules)

export const saveFilterSchema = z.object({
  name: z.string().trim().min(1, "Enter a name for these filters").max(40, "Keep the name under 40 characters"),
});
export type SaveFilterFormValues = z.infer<typeof saveFilterSchema>;

export const SEND_BACK_MIN_LENGTH = 5;

export const sendBackSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Say what needs to change")
    .min(SEND_BACK_MIN_LENGTH, `Add a comment of at least ${SEND_BACK_MIN_LENGTH} characters.`)
    .max(1000, "Keep the comment under 1000 characters"),
});
export type SendBackFormValues = z.infer<typeof sendBackSchema>;

export const automationRuleNameSchema = z.object({
  name: z.string().trim().min(1, "Enter the rule name").max(80, "Keep the name under 80 characters"),
});
export type AutomationRuleNameFormValues = z.infer<typeof automationRuleNameSchema>;
