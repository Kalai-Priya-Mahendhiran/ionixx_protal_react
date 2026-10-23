export interface TeamMember {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  employeeId: string;
  reportingManager: string;
  joiningDate: string;
  // Today's status; Team Overview takes it live from attendance ("not-in" = no check-in yet)
  status: "active" | "on-leave" | "remote" | "not-in";
  skills: string[];
  phone: string;
  location: string;
}

// Sample new joiner starts a week from today, so the onboarding template has someone to apply to
const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const teamMembers: TeamMember[] = [
  {
    id: "EMP001",
    name: "Kalai Priya",
    email: "kalai.priya@company.com",
    designation: "Software Developer",
    department: "Engineering",
    employeeId: "EMP00101",
    reportingManager: "Priya Kumar",
    joiningDate: "2023-04-12",
    status: "active",
    skills: ["React", "TypeScript", "Node.js"],
    phone: "+91 98765 11001",
    location: "Chennai, IN",
  },
  {
    id: "EMP002",
    name: "Arjun Rao",
    email: "arjun.rao@company.com",
    designation: "Senior Software Developer",
    department: "Engineering",
    employeeId: "EMP00102",
    reportingManager: "Priya Kumar",
    joiningDate: "2021-07-05",
    status: "remote",
    skills: ["Go", "Kubernetes", "AWS"],
    phone: "+91 98765 11002",
    location: "Bengaluru, IN",
  },
  {
    id: "EMP003",
    name: "Meera Sundar",
    email: "meera.sundar@company.com",
    designation: "QA Engineer",
    department: "Quality",
    employeeId: "EMP00103",
    reportingManager: "Priya Kumar",
    joiningDate: "2022-11-21",
    status: "active",
    skills: ["Cypress", "Playwright", "Jest"],
    phone: "+91 98765 11003",
    location: "Chennai, IN",
  },
  {
    id: "EMP004",
    name: "Rohit Deshmukh",
    email: "rohit.deshmukh@company.com",
    designation: "UI/UX Designer",
    department: "Design",
    employeeId: "EMP00104",
    reportingManager: "Priya Kumar",
    joiningDate: "2023-01-09",
    status: "on-leave",
    skills: ["Figma", "Design Systems", "Prototyping"],
    phone: "+91 98765 11004",
    location: "Pune, IN",
  },
  {
    id: "EMP005",
    name: "Divya Menon",
    email: "divya.menon@company.com",
    designation: "DevOps Engineer",
    department: "Infrastructure",
    employeeId: "EMP00105",
    reportingManager: "Priya Kumar",
    joiningDate: "2020-09-14",
    status: "active",
    skills: ["Terraform", "AWS", "CI/CD"],
    phone: "+91 98765 11005",
    location: "Hyderabad, IN",
  },
  {
    id: "EMP006",
    name: "Karthik Subramanian",
    email: "karthik.s@company.com",
    designation: "Junior Developer",
    department: "Engineering",
    employeeId: "EMP00106",
    reportingManager: "Priya Kumar",
    joiningDate: "2024-06-03",
    status: "active",
    skills: ["JavaScript", "Python"],
    phone: "+91 98765 11006",
    location: "Chennai, IN",
  },
  {
    id: "EMP007",
    name: "Sneha Reddy",
    email: "sneha.reddy@company.com",
    designation: "Associate Software Developer",
    department: "Engineering",
    employeeId: "EMP00107",
    reportingManager: "Priya Kumar",
    joiningDate: inDays(7),
    status: "active",
    skills: ["React", "TypeScript"],
    phone: "+91 98765 11007",
    location: "Chennai, IN",
  },
];

export interface ApprovalRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "leave" | "time-off" | "wfh" | "expense";
  subType?: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedDate: string;
  decidedDate?: string;
  decidedBy?: string;
}

export const approvalRequests: ApprovalRequest[] = [
  {
    id: "REQ-1001",
    employeeId: "EMP001",
    employeeName: "Kalai Priya",
    type: "leave",
    subType: "Casual Leave",
    startDate: "2026-05-12",
    endDate: "2026-05-13",
    days: 2,
    reason: "Family function out of town.",
    status: "pending",
    appliedDate: "2026-05-05",
  },
  {
    id: "REQ-1002",
    employeeId: "EMP002",
    employeeName: "Arjun Rao",
    type: "wfh",
    startDate: "2026-05-08",
    endDate: "2026-05-08",
    days: 1,
    reason: "Plumber visit at home.",
    status: "pending",
    appliedDate: "2026-05-06",
  },
  {
    id: "REQ-1003",
    employeeId: "EMP003",
    employeeName: "Meera Sundar",
    type: "leave",
    subType: "Sick Leave",
    startDate: "2026-05-07",
    endDate: "2026-05-07",
    days: 1,
    reason: "Fever and headache.",
    status: "pending",
    appliedDate: "2026-05-07",
  },
  {
    id: "REQ-1004",
    employeeId: "EMP005",
    employeeName: "Divya Menon",
    type: "leave",
    subType: "Earned Leave",
    startDate: "2026-05-20",
    endDate: "2026-05-23",
    days: 4,
    reason: "Pre-planned vacation.",
    status: "approved",
    appliedDate: "2026-04-22",
    decidedDate: "2026-04-23",
    decidedBy: "Priya Kumar",
  },
  {
    id: "REQ-1005",
    employeeId: "EMP004",
    employeeName: "Rohit Deshmukh",
    type: "leave",
    subType: "Casual Leave",
    startDate: "2026-05-04",
    endDate: "2026-05-06",
    days: 3,
    reason: "Personal work.",
    status: "approved",
    appliedDate: "2026-04-28",
    decidedDate: "2026-04-29",
    decidedBy: "Priya Kumar",
  },
  {
    id: "REQ-1006",
    employeeId: "EMP006",
    employeeName: "Karthik Subramanian",
    type: "leave",
    subType: "Casual Leave",
    startDate: "2026-04-18",
    endDate: "2026-04-18",
    days: 1,
    reason: "Bank work.",
    status: "rejected",
    appliedDate: "2026-04-17",
    decidedDate: "2026-04-17",
    decidedBy: "Priya Kumar",
  },
];

// Team attendance now comes from the attendance service (src/services/apis/attendance)

export interface EmployeeGoal {
  id: string;
  title: string;
  description: string;
  weight: number;
  progress: number;
  status: "on-track" | "at-risk" | "off-track" | "completed";
}

export interface PerformanceProfile {
  employeeId: string;
  employeeName: string;
  designation: string;
  reviewCycle: string;
  overallRating: number | null;
  selfRating: number | null;
  goals: EmployeeGoal[];
  lastReview: string;
  status: "draft" | "submitted" | "in-review";
}

export const performanceProfiles: PerformanceProfile[] = [
  {
    employeeId: "EMP001",
    employeeName: "Kalai Priya",
    designation: "Software Developer",
    reviewCycle: "H1 2026",
    overallRating: null,
    selfRating: 4,
    lastReview: "2025-11-10",
    status: "in-review",
    goals: [
      {
        id: "G1",
        title: "Ship Portal v2 dashboard",
        description: "Lead front-end delivery for the new manager dashboard.",
        weight: 40,
        progress: 75,
        status: "on-track",
      },
      {
        id: "G2",
        title: "Mentor 1 junior engineer",
        description: "Pair on weekly reviews and own onboarding for Karthik.",
        weight: 20,
        progress: 60,
        status: "on-track",
      },
      {
        id: "G3",
        title: "Reduce front-end bundle by 20%",
        description: "Audit and code-split the React app.",
        weight: 40,
        progress: 30,
        status: "at-risk",
      },
    ],
  },
  {
    employeeId: "EMP002",
    employeeName: "Arjun Rao",
    designation: "Senior Software Developer",
    reviewCycle: "H1 2026",
    overallRating: null,
    selfRating: 5,
    lastReview: "2025-11-08",
    status: "submitted",
    goals: [
      {
        id: "G1",
        title: "Migrate services to Go 1.22",
        description: "Coordinate the upgrade across 6 services.",
        weight: 50,
        progress: 100,
        status: "completed",
      },
      {
        id: "G2",
        title: "Reduce P95 latency by 25%",
        description: "Profile and tune the order pipeline.",
        weight: 50,
        progress: 80,
        status: "on-track",
      },
    ],
  },
  {
    employeeId: "EMP003",
    employeeName: "Meera Sundar",
    designation: "QA Engineer",
    reviewCycle: "H1 2026",
    overallRating: 4,
    selfRating: 4,
    lastReview: "2025-11-12",
    status: "draft",
    goals: [
      {
        id: "G1",
        title: "Increase E2E coverage to 70%",
        description: "Expand Cypress suite across critical flows.",
        weight: 60,
        progress: 55,
        status: "on-track",
      },
      {
        id: "G2",
        title: "Set up flaky-test dashboard",
        description: "Surface flake rate per suite for the team.",
        weight: 40,
        progress: 20,
        status: "off-track",
      },
    ],
  },
  {
    employeeId: "EMP005",
    employeeName: "Divya Menon",
    designation: "DevOps Engineer",
    reviewCycle: "H1 2026",
    overallRating: null,
    selfRating: null,
    lastReview: "2025-11-15",
    status: "draft",
    goals: [
      {
        id: "G1",
        title: "Cut cloud spend by 15%",
        description: "Right-size workloads and adopt savings plans.",
        weight: 60,
        progress: 45,
        status: "on-track",
      },
      {
        id: "G2",
        title: "Achieve SOC 2 readiness",
        description: "Close audit findings on access controls.",
        weight: 40,
        progress: 70,
        status: "on-track",
      },
    ],
  },
];
