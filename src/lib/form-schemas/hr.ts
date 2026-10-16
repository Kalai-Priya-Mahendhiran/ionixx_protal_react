import { z } from "zod";

// Form schemas for the HR pages (compliance, employee management, recruitment, training)

export const EMPLOYMENT_TYPES = ["Full-time", "Contract", "Intern"] as const;
export const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export const uploadDocumentSchema = z.object({
  name: z.string().trim().min(1, "Enter the document name").max(150, "Keep the name under 150 characters"),
  category: z.string().min(1, "Choose a category"),
  expiryDate: z.string().optional().or(z.literal("")),
});
export type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>;

export const addEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Enter the full name").max(100, "Keep the name under 100 characters"),
  employeeId: z.string().trim().min(1, "Enter the employee ID").max(50, "Keep the ID under 50 characters"),
  joiningDate: z.string().optional().or(z.literal("")),
  email: z.string().trim().min(1, "Enter the email address").email("Enter a valid email address"),
  phone: z.string().trim().max(20, "Keep the phone number under 20 characters").optional().or(z.literal("")),
  designation: z.string().trim().min(1, "Enter the designation").max(100, "Keep the designation under 100 characters"),
  department: z.string().min(1, "Choose a department"),
  employmentType: z.enum(EMPLOYMENT_TYPES, { errorMap: () => ({ message: "Choose an employment type" }) }),
  reportingManager: z.string().trim().max(100, "Keep the name under 100 characters").optional().or(z.literal("")),
  location: z.string().trim().max(100, "Keep the location under 100 characters").optional().or(z.literal("")),
});
export type AddEmployeeFormValues = z.infer<typeof addEmployeeSchema>;

export const postJobSchema = z.object({
  title: z.string().trim().min(1, "Enter the job title").max(120, "Keep the title under 120 characters"),
  department: z.string().min(1, "Choose a department"),
  type: z.enum(EMPLOYMENT_TYPES, { errorMap: () => ({ message: "Choose a job type" }) }),
  location: z.string().trim().min(1, "Enter the location").max(100, "Keep the location under 100 characters"),
  experience: z.string().trim().max(50, "Keep the experience under 50 characters").optional().or(z.literal("")),
  description: z.string().trim().min(1, "Enter the job description").max(2000, "Keep the description under 2000 characters"),
});
export type PostJobFormValues = z.infer<typeof postJobSchema>;

// Modules stay a string in the form and are converted to a number on save
export const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Enter the course title").max(120, "Keep the title under 120 characters"),
  category: z.string().min(1, "Choose a category"),
  level: z.enum(COURSE_LEVELS, { errorMap: () => ({ message: "Choose a level" }) }),
  instructor: z.string().trim().min(1, "Enter the instructor").max(100, "Keep the name under 100 characters"),
  duration: z.string().trim().min(1, "Enter the duration").max(30, "Keep the duration under 30 characters"),
  modules: z
    .string()
    .trim()
    .min(1, "Enter the number of modules")
    .regex(/^\d+$/, "Enter a whole number")
    .refine((value) => Number(value) >= 1 && Number(value) <= 50, "Enter between 1 and 50 modules"),
  description: z.string().trim().max(1000, "Keep the description under 1000 characters").optional().or(z.literal("")),
});
export type CreateCourseFormValues = z.infer<typeof createCourseSchema>;

export const assignLearnersSchema = z.object({
  learners: z.array(z.string()).min(1, "Choose at least one learner"),
});
export type AssignLearnersFormValues = z.infer<typeof assignLearnersSchema>;
