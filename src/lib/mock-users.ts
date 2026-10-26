export type UserRole =
  | "employee"
  | "hr"
  | "project_manager"
  | "admin"
  | "system_admin"
  | "executive";

export interface MockUser {
  id: string;
  loginId: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  employeeId: string;
  avatar?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Employee",
  hr: "HR",
  project_manager: "Manager",
  admin: "Admin",
  system_admin: "System Admin",
  executive: "Executive",
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "EMP001",
    loginId: "employee",
    password: "employee123",
    name: "Kalai Priya",
    email: "employee@company.com",
    role: "employee",
    department: "Engineering",
    designation: "Software Developer",
    employeeId: "EMP00101",
  },
  {
    id: "HR001",
    loginId: "hr",
    password: "hr123",
    name: "Priya Ramesh",
    email: "hr@company.com",
    role: "hr",
    department: "Human Resources",
    designation: "HR Manager",
    employeeId: "HR00102",
  },
  {
    id: "PM001",
    loginId: "pm",
    password: "pm123",
    name: "Priya Kumar",
    email: "pm@company.com",
    role: "project_manager",
    department: "Engineering",
    designation: "Project Manager",
    employeeId: "PM00103",
  },
  {
    id: "ADM001",
    loginId: "admin",
    password: "admin123",
    name: "Vikram Shah",
    email: "admin@company.com",
    role: "admin",
    department: "Operations",
    designation: "Administrator",
    employeeId: "ADM00104",
  },
  {
    id: "SYS001",
    loginId: "sysadmin",
    password: "sysadmin123",
    name: "kaviya Iyer",
    email: "sysadmin@company.com",
    role: "system_admin",
    department: "IT",
    designation: "System Administrator",
    employeeId: "SYS00105",
  },
  {
    id: "EXE001",
    loginId: "executive",
    password: "executive123",
    name: "Ananya Nair",
    email: "executive@company.com",
    role: "executive",
    department: "Executive Office",
    designation: "Chief Executive",
    employeeId: "EXE00106",
  },
];

export const validateCredentials = (
  loginId: string,
  password: string
): MockUser | null => {
  const id = loginId.trim().toLowerCase();
  const match = MOCK_USERS.find(
    (u) =>
      (u.loginId.toLowerCase() === id || u.email.toLowerCase() === id) &&
      u.password === password
  );
  return match ?? null;
};

export const DEMO_ACCOUNTS: Array<{ role: UserRole; loginId: string; password: string }> =
  MOCK_USERS.map((u) => ({ role: u.role, loginId: u.loginId, password: u.password }));
