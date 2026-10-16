import { z } from "zod";
import { todayAsDateInput } from "./utils";

export const loginSchema = z.object({
  loginId: z.string().min(1, "Login ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Personal Information Schema
export const personalInfoSchema = z.object({
  employeeId: z.string()
    .trim()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID must be less than 50 characters"),
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  middleName: z.string()
    .max(50, "Middle name must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
  preferredName: z.string()
    .max(50, "Preferred name must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      return actualAge >= 18;
    }, "Must be at least 18 years old"),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional(),
  nationality: z.string()
    .min(1, "Nationality is required")
    .max(50, "Nationality must be less than 50 characters"),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed", "Other"]).optional(),
  personalEmail: z.string()
    .email("Invalid email address")
    .refine((email) => {
      const companyDomains = ["@company.com", "@ionixx.com", "@work.com", "@corp.com"];
      return !companyDomains.some(domain => email.includes(domain));
    }, "Personal email cannot be a company email"),
  workEmail: z.string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  mobilePersonal: z.string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number must be less than 15 digits")
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format. Use country code + number pattern"),
  alternatePhone: z.string()
    .max(15, "Alternate phone must be less than 15 digits")
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  currentAddress: z.string()
    .min(10, "Current address must be at least 10 characters")
    .max(500, "Current address must be less than 500 characters"),
  permanentAddress: z.string()
    .max(500, "Permanent address must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  sameAsCurrentAddress: z.boolean().optional(),
  emergencyContact: z.object({
    name: z.string()
      .min(1, "Emergency contact name is required")
      .max(100, "Name must be less than 100 characters"),
    relationship: z.string()
      .min(1, "Relationship is required")
      .max(50, "Relationship must be less than 50 characters"),
    phone: z.string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be less than 15 digits")
      .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
    alternatePhone: z.string()
      .max(15, "Alternate phone must be less than 15 digits")
      .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
      .optional()
      .or(z.literal("")),
  }),
  governmentIds: z.object({
    pan: z.string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g., ABCDE1234F)")
      .optional()
      .or(z.literal("")),
    ssn: z.string()
      .regex(/^\d{3}-\d{2}-\d{4}$/, "Invalid SSN format (XXX-XX-XXXX)")
      .optional()
      .or(z.literal("")),
    nationalId: z.string()
      .max(20, "National ID must be less than 20 characters")
      .optional()
      .or(z.literal("")),
    passportNumber: z.string()
      .max(20, "Passport number must be less than 20 characters")
      .optional()
      .or(z.literal("")),
    aadhaar: z.string()
      .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits")
      .optional()
      .or(z.literal("")),
  }),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  profilePhoto: z.string().optional(),
  currentLocation: z.string()
    .max(100, "Current location must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  workAuthorization: z.enum(["Citizen", "Permanent Resident", "Work Visa", "Student Visa", "Other"]).optional(),
  linkedinUrl: z.string()
    .url("Invalid LinkedIn URL")
    .refine((url) => url.includes("linkedin.com"), "Must be a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  githubUrl: z.string()
    .url("Invalid GitHub URL")
    .refine((url) => url.includes("github.com"), "Must be a valid GitHub URL")
    .optional()
    .or(z.literal("")),
  portfolioUrl: z.string()
    .url("Invalid Portfolio URL")
    .optional()
    .or(z.literal("")),
});

// Education Schema
export const educationSchema = z.object({
  qualifications: z.array(z.object({
    type: z.enum(["High School", "Diploma", "Bachelor's", "Master's", "PhD", "Certification", "Other"]),
    degreeName: z.string()
      .min(1, "Degree/Course name is required")
      .max(200, "Degree name must be less than 200 characters"),
    specialization: z.string()
      .max(100, "Specialization must be less than 100 characters")
      .optional()
      .or(z.literal("")),
    institution: z.string()
      .min(1, "Institution name is required")
      .max(200, "Institution name must be less than 200 characters"),
    location: z.string()
      .min(1, "Location is required")
      .max(100, "Location must be less than 100 characters"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    percentage: z.string()
      .min(1, "Percentage is required")
      .regex(/^\d{1,3}(\.\d{1,2})?%?$/, "Invalid percentage format (e.g., 85% or 85.5)"),
    gpa: z.string()
      .regex(/^\d{1,2}(\.\d{1,2})?\/\d{1,2}(\.\d{1,2})?$/, "Invalid GPA format (e.g., 3.5/4.0 or 8.5/10)")
      .optional()
      .or(z.literal("")),
    mode: z.enum(["Full-time", "Part-time", "Distance", "Online"]).optional(),
    documentUpload: z.string().optional(),
    remarks: z.string()
      .max(500, "Remarks must be less than 500 characters")
      .optional()
      .or(z.literal("")),
  })),
  certifications: z.array(z.object({
    name: z.string()
      .min(1, "Certification name is required")
      .max(200, "Certification name must be less than 200 characters"),
    issuingOrganization: z.string()
      .min(1, "Issuing organization is required")
      .max(200, "Organization name must be less than 200 characters"),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    uploadCertificate: z.string()
      .min(1, "Certificate upload is required")
      .regex(/^data:(application\/pdf|image\/[a-z0-9.+-]+);base64,/i, "Upload a PDF or image file"),
  })),
});

// Employment Schema
export const employmentSchema = z.object({
  previousEmployments: z.array(z.object({
    companyName: z.string()
      .min(1, "Company name is required")
      .max(200, "Company name must be less than 200 characters"),
    companyLocation: z.string()
      .trim()
      .min(1, "Company location is required")
      .max(300, "Company location must be less than 300 characters"),
    designation: z.string()
      .min(1, "Designation is required")
      .max(100, "Designation must be less than 100 characters"),
    department: z.string()
      .trim()
      .min(1, "Department/Team is required")
      .max(100, "Department must be less than 100 characters"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
    employmentType: z.enum(["Full-time", "Part-time", "Contract", "Internship", "Freelance"], {
      required_error: "Employment type is required",
    }),
    lastSalary: z.string()
      .trim()
      .min(1, "Last drawn CTC/Salary is required")
      .regex(/^\d+(,\d{3})*(\.\d{2})?$/, "Invalid salary format (e.g., 50,000 or 50000.00)"),
    noticePeriod: z.string()
      .max(50, "Notice period must be less than 50 characters")
      .optional()
      .or(z.literal("")),
    reportingManager: z.string()
      .max(200, "Reporting manager must be less than 200 characters")
      .optional()
      .or(z.literal("")),
    reasonForLeaving: z.string()
      .max(500, "Reason for leaving must be less than 500 characters")
      .optional()
      .or(z.literal("")),
    experienceDescription: z.string()
      .max(1000, "Experience description must be less than 1000 characters")
      .optional()
      .or(z.literal("")),
    referencePermission: z.boolean().refine((val) => val === true, "Reference permission is required for background checks"),
    documentUploads: z.array(z.string()).optional(),
    nonCompeteDeclaration: z.boolean().optional(),
    ndaDeclaration: z.string()
      .max(500, "NDA declaration must be less than 500 characters")
      .optional()
      .or(z.literal("")),
  })),
});

// Bank Details Schema
export const bankDetailsSchema = z.object({
  accountNumber: z.string()
    .min(10, "Account number must be at least 10 digits")
    .max(20, "Account number must be less than 20 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
  bankName: z.string()
    .min(1, "Bank name is required")
    .max(100, "Bank name must be less than 100 characters"),
  ifscCode: z.string()
    .min(1, "IFSC code is required")
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format (e.g., SBIN0001234)"),
  accountType: z.enum(["Savings", "Current", "Salary", "Fixed Deposit", "Recurring Deposit"]),
  branchName: z.string()
    .trim()
    .min(1, "Branch name is required")
    .max(100, "Branch name must be less than 100 characters"),
  swiftCode: z.string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid SWIFT code format (e.g., SBININBB123)")
    .optional()
    .or(z.literal("")),
});

// File Upload Schema
export const fileUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"), // 10MB max
  fileType: z.enum(["image/jpeg", "image/png", "application/pdf"]).refine(
    (val) => ["image/jpeg", "image/png", "application/pdf"].includes(val),
    "Only JPEG, PNG, and PDF files are allowed"
  ),
  fileUrl: z.string().url("Invalid file URL"),
});

// Consent and Declarations Schema
export const consentSchema = z.object({
  dataProcessingConsent: z.boolean().refine((val) => val === true, "Data processing consent is required"),
  backgroundCheckConsent: z.boolean().refine((val) => val === true, "Background check consent is required"),
  dataPrivacyConsent: z.boolean().refine((val) => val === true, "Data privacy consent is required"),
  esignature: z.string().min(1, "E-signature is required"),
  consentDate: z.string().optional(),
});

// Complete Profile Schema
export const profileSchema = personalInfoSchema
  .merge(educationSchema)
  .merge(employmentSchema)
  .merge(bankDetailsSchema)
  .merge(consentSchema)
  .extend({
    uploadedDocuments: z.array(fileUploadSchema).optional(),
  });

export type ProfileFormData = z.infer<typeof profileSchema>;

// Leave Tracker
export const LEAVE_TYPE_IDS = [
  "casual", "sick", "earned", "loss-of-pay", "competency", "permission",
  "marriage", "paternity", "maternity", "restricted-holiday",
] as const;
export const LEAVE_DAY_PART_IDS = ["full-day", "first-half", "second-half"] as const;

export const leaveRequestSchema = z.object({
  leaveType: z.enum(LEAVE_TYPE_IDS, { required_error: "Select a leave type", invalid_type_error: "Select a leave type" }),
  startDate: z.string().min(1, "Select a from date"),
  startDayPart: z.enum(LEAVE_DAY_PART_IDS),
  endDate: z.string().min(1, "Select a to date"),
  endDayPart: z.enum(LEAVE_DAY_PART_IDS),
  reason: z.string()
    .trim()
    .min(1, "Enter a reason")
    .max(500, "Reason must be less than 500 characters"),
}).superRefine((leave, context) => {
  if (!leave.startDate || !leave.endDate) return;
  if (leave.endDate < leave.startDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "To date cannot be before from date",
    });
    return;
  }
  if (leave.startDate === leave.endDate) {
    if (leave.startDayPart !== leave.endDayPart) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDayPart"],
        message: "Use the same part of day for a single-day leave",
      });
    }
    return;
  }
  if (leave.startDayPart === "first-half") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startDayPart"],
      message: "A multi-day leave can start only on a full day or second half",
    });
  }
  if (leave.endDayPart === "second-half") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDayPart"],
      message: "A multi-day leave can end only on a full day or first half",
    });
  }
});

export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

// Tasks module: default workflow, issue types and priorities
export const TASK_WORKFLOW_STATUSES = ["todo", "in-progress", "in-review", "done", "reopened"] as const;
export const TASK_ISSUE_TYPES = ["task", "bug", "story", "epic", "sub-task", "hr"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

// Select value meaning "no epic" / "backlog" (Radix Select items can't use an empty string)
export const TASK_FIELD_NONE = "none";

export const taskSchema = z
  .object({
    title: z.string().trim().min(1, "Task title is required").max(200, "Keep the title under 200 characters"),
    description: z.string().trim().max(5000, "Keep the description under 5000 characters"),
    projectId: z.string().min(1, "Select a project"),
    type: z.enum(TASK_ISSUE_TYPES, { required_error: "Select a task type" }),
    priority: z.enum(TASK_PRIORITIES, { required_error: "Select a priority" }),
    assigneeId: z.string().min(1, "Select an assignee"),
    epicId: z.string(),
    sprintId: z.string(),
    startDate: z.string(),
    dueDate: z.string().min(1, "Due date is required"),
    estimateHours: z
      .string()
      .trim()
      .refine((value) => value === "" || (Number(value) > 0 && Number(value) <= 999), "Enter hours between 0 and 999"),
    // Comma-separated in the form, split into an array on submit
    labels: z.string(),
  })
  .refine((values) => !values.startDate || !values.dueDate || values.dueDate >= values.startDate, {
    path: ["dueDate"],
    message: "Due date can't be before the start date",
  });

export type TaskFormValues = z.infer<typeof taskSchema>;

export const attendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().min(1, "Check-in time is required"),
  checkOut: z.string().min(1, "Check-out time is required"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

export const timeEntrySchema = z.object({
  project: z.string().min(1, "Select a project"),
  module: z.string().min(1, "Select an epic or module"),
  task: z.string().min(1, "Select a user story or task"),
  description: z.string().trim().min(1, "Enter a description"),
  date: z.string()
    .min(1, "Select a date")
    .refine((date) => date <= todayAsDateInput(), "Date cannot be in the future"),
  startTime: z.string().min(1, "Enter a start time"),
  endTime: z.string().min(1, "Enter an end time"),
}).refine((entry) => !entry.startTime || !entry.endTime || entry.endTime > entry.startTime, {
  path: ["endTime"],
  message: "End time must be after start time",
});

export type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;

// Time Tracker tasks
export const TASK_STATUSES = ["not-started", "started", "completed", "hold"] as const;

export const optionalHoursSchema = z.preprocess(
  (value) => value === "" || value === undefined || (typeof value === "number" && Number.isNaN(value))
    ? undefined
    : typeof value === "string" ? Number(value) : value,
  z.number({ invalid_type_error: "Enter a valid number of hours" })
    .positive("Hours must be greater than zero")
    .optional()
);

export const timeTrackerTaskSchema = z.object({
  status: z.enum(TASK_STATUSES, { required_error: "Select a task status" }),
  project: z.string().min(1, "Select a project"),
  module: z.string().min(1, "Select an epic or module"),
  task: z.string().min(1, "Select a user story or task"),
  description: z.string().trim().min(1, "Enter a description"),
  estimateHours: z.preprocess(
    (value) => value === "" || value === undefined || (typeof value === "number" && Number.isNaN(value))
      ? undefined
      : typeof value === "string" ? Number(value) : value,
    z.number({ required_error: "Enter estimated hours", invalid_type_error: "Enter valid estimated hours" })
      .positive("Estimated hours must be greater than zero")
  ),
  actualHours: optionalHoursSchema,
  completedDate: z.string().optional(),
}).superRefine((task, context) => {
  if (task.status === "completed" && task.actualHours === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["actualHours"],
      message: "Enter actual hours for a completed task",
    });
  }
  if (task.status === "completed" && !task.completedDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["completedDate"],
      message: "Select a date",
    });
  }
  if (task.completedDate && task.completedDate > todayAsDateInput()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["completedDate"],
      message: "Date cannot be in the future",
    });
  }
});

export const timeTrackerTaskFormSchema = z.object({
  tasks: z.array(timeTrackerTaskSchema).min(1, "Add at least one task"),
});

export type TimeTrackerTaskFormValues = z.infer<typeof timeTrackerTaskFormSchema>;
export type TimeTrackerTaskFormRow = TimeTrackerTaskFormValues["tasks"][number];

// "Log Work" on a task; the entry also goes to the Time Tracker, so it must fit inside the day
export const logWorkSchema = z
  .object({
    date: z
      .string()
      .min(1, "Date is required")
      .refine((value) => value <= todayAsDateInput(), "You can't log work in the future"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time is required"),
    hours: z
      .string()
      .trim()
      .min(1, "Hours are required")
      .refine((value) => Number(value) > 0 && Number(value) <= 24, "Enter between 0.25 and 24 hours")
      .refine((value) => Number.isInteger(Number(value) * 4), "Use quarter hours, e.g. 1.25 or 2.5"),
    note: z.string().trim().max(500, "Keep the note under 500 characters"),
  })
  .refine(
    ({ startTime, hours }) => {
      const [h, m] = startTime.split(":").map(Number);
      return h * 60 + m + Number(hours) * 60 <= 24 * 60;
    },
    { path: ["hours"], message: "This would run past midnight — split it across two days" },
  );

export type LogWorkFormValues = z.infer<typeof logWorkSchema>;

export const flagBlockedSchema = z.object({
  reason: z.string().trim().min(5, "Tell your manager what's blocking you (at least 5 characters)").max(300, "Keep it under 300 characters"),
});

export type FlagBlockedFormValues = z.infer<typeof flagBlockedSchema>;

export const sprintSchema = z
  .object({
    name: z.string().trim().min(1, "Give the sprint a name").max(60, "Keep the name under 60 characters"),
    goal: z.string().trim().max(200, "Keep the goal under 200 characters"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((values) => !values.startDate || !values.endDate || values.endDate > values.startDate, {
    path: ["endDate"],
    message: "The sprint must end after it starts",
  });

export type SprintFormValues = z.infer<typeof sprintSchema>;

// HR task templates
export const TEMPLATE_KINDS = ["onboarding", "offboarding", "custom"] as const;
export const TEMPLATE_OWNERS = ["hr", "it", "manager", "employee", "specific"] as const;

const templateItemSchema = z
  .object({
    id: z.string(),
    title: z.string().trim().min(1, "Add a title").max(120, "Keep it under 120 characters"),
    owner: z.enum(TEMPLATE_OWNERS),
    ownerId: z.string(),
    // Number inputs give strings; checked and converted on save
    offsetDays: z
      .string()
      .trim()
      .refine((value) => /^-?\d+$/.test(value) && Math.abs(Number(value)) <= 365, "Whole days, −365 to 365"),
    priority: z.enum(TASK_PRIORITIES),
    estimateHours: z
      .string()
      .trim()
      .refine((value) => value === "" || (Number(value) > 0 && Number(value) <= 999), "0–999 hours"),
  })
  .refine((item) => item.owner !== "specific" || !!item.ownerId, { path: ["ownerId"], message: "Choose a person" });

export const templateSchema = z.object({
  name: z.string().trim().min(1, "Give the template a name").max(80, "Keep the name under 80 characters"),
  kind: z.enum(TEMPLATE_KINDS),
  description: z.string().trim().max(300, "Keep the description under 300 characters"),
  items: z.array(templateItemSchema).min(1, "Add at least one item").max(30, "A template can have at most 30 items"),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

export const applyTemplateSchema = z.object({
  subjectId: z.string().min(1, "Choose the employee"),
  anchorDate: z.string().min(1, "Choose a date"),
});

export type ApplyTemplateFormValues = z.infer<typeof applyTemplateSchema>;

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Give the project a name").max(60, "Keep the name under 60 characters"),
  key: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9]{1,9}$/, "2–10 capital letters or digits, starting with a letter (e.g. IXP)"),
  description: z.string().trim().max(300, "Keep the description under 300 characters"),
  leadId: z.string().min(1, "Choose a project lead"),
  defaultIssueType: z.enum(TASK_ISSUE_TYPES),
  memberIds: z.array(z.string()),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
