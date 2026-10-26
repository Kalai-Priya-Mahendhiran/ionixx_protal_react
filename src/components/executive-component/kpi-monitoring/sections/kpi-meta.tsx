import { Activity, Award, DollarSign, Users } from "lucide-react";

export type Status = "on-track" | "at-risk" | "off-track";
export type Category = "all" | "people" | "performance" | "financial" | "operations";
export type Trend = "up" | "down" | "flat";

export interface Kpi {
  id: string;
  name: string;
  category: Exclude<Category, "all">;
  current: number;
  target: number;
  unit: string;
  status: Status;
  trend: Trend;
  changePct: number;
  history: number[];
  owner: string;
  lastUpdated: string;
  description: string;
  higherIsBetter: boolean;
  drilldown: { label: string; value: number; status: Status }[];
}

export interface AlertItem {
  id: string;
  kpiName: string;
  severity: "high" | "medium" | "low";
  message: string;
  raisedAt: string;
}

export const kpis: Kpi[] = [
  {
    id: "kpi-001",
    name: "Attrition Rate",
    category: "people",
    current: 1.6,
    target: 1.5,
    unit: "%",
    status: "at-risk",
    trend: "up",
    changePct: 6.7,
    history: [1.4, 1.3, 1.4, 1.3, 1.5, 1.6],
    owner: "Anita Rajan",
    lastUpdated: "2026-05-07",
    description: "Monthly attrition rate across all departments.",
    higherIsBetter: false,
    drilldown: [
      { label: "Engineering", value: 1.4, status: "on-track" },
      { label: "Sales", value: 2.4, status: "off-track" },
      { label: "Design", value: 1.1, status: "on-track" },
      { label: "Quality", value: 1.8, status: "at-risk" },
    ],
  },
  {
    id: "kpi-002",
    name: "Productivity Index",
    category: "performance",
    current: 89.2,
    target: 90,
    unit: "",
    status: "on-track",
    trend: "up",
    changePct: 2.1,
    history: [85, 86, 87, 87, 88, 89.2],
    owner: "Priya Kumar",
    lastUpdated: "2026-05-07",
    description: "Composite productivity score across teams.",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 92, status: "on-track" },
      { label: "Design", value: 88, status: "on-track" },
      { label: "HR", value: 94, status: "on-track" },
      { label: "Sales", value: 85, status: "at-risk" },
    ],
  },
  {
    id: "kpi-003",
    name: "Time-to-Hire",
    category: "people",
    current: 38,
    target: 30,
    unit: " days",
    status: "off-track",
    trend: "up",
    changePct: 8.6,
    history: [32, 33, 35, 36, 37, 38],
    owner: "Sneha Iyer",
    lastUpdated: "2026-05-06",
    description: "Average days from job posting to offer acceptance.",
    higherIsBetter: false,
    drilldown: [
      { label: "Engineering", value: 42, status: "off-track" },
      { label: "Design", value: 28, status: "on-track" },
      { label: "Sales", value: 35, status: "at-risk" },
      { label: "HR", value: 25, status: "on-track" },
    ],
  },
  {
    id: "kpi-004",
    name: "Employee Satisfaction",
    category: "people",
    current: 4.2,
    target: 4.0,
    unit: "/5",
    status: "on-track",
    trend: "up",
    changePct: 5.0,
    history: [3.9, 4.0, 4.0, 4.1, 4.1, 4.2],
    owner: "Anita Rajan",
    lastUpdated: "2026-05-05",
    description: "eNPS-style rating from quarterly pulse survey.",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 4.3, status: "on-track" },
      { label: "Design", value: 4.5, status: "on-track" },
      { label: "Sales", value: 3.8, status: "at-risk" },
      { label: "HR", value: 4.4, status: "on-track" },
    ],
  },
  {
    id: "kpi-005",
    name: "Revenue per Employee",
    category: "financial",
    current: 142,
    target: 150,
    unit: "K",
    status: "at-risk",
    trend: "flat",
    changePct: 0.7,
    history: [138, 139, 141, 140, 141, 142],
    owner: "Vivek Mehta",
    lastUpdated: "2026-05-04",
    description: "Annualized revenue divided by total headcount (USD).",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 168, status: "on-track" },
      { label: "Sales", value: 195, status: "on-track" },
      { label: "Design", value: 96, status: "off-track" },
      { label: "HR", value: 0, status: "on-track" },
    ],
  },
  {
    id: "kpi-006",
    name: "Training Completion",
    category: "operations",
    current: 82,
    target: 85,
    unit: "%",
    status: "at-risk",
    trend: "up",
    changePct: 3.8,
    history: [76, 77, 78, 79, 80, 82],
    owner: "Anita Rajan",
    lastUpdated: "2026-05-07",
    description: "Mandatory training course completion rate.",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 88, status: "on-track" },
      { label: "Design", value: 75, status: "off-track" },
      { label: "Sales", value: 80, status: "at-risk" },
      { label: "HR", value: 95, status: "on-track" },
    ],
  },
  {
    id: "kpi-007",
    name: "Goal Achievement",
    category: "performance",
    current: 76,
    target: 80,
    unit: "%",
    status: "at-risk",
    trend: "up",
    changePct: 4.1,
    history: [70, 71, 72, 74, 75, 76],
    owner: "Priya Kumar",
    lastUpdated: "2026-05-06",
    description: "Percentage of employees meeting quarterly goals.",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 82, status: "on-track" },
      { label: "Design", value: 78, status: "at-risk" },
      { label: "Sales", value: 68, status: "off-track" },
      { label: "HR", value: 88, status: "on-track" },
    ],
  },
  {
    id: "kpi-008",
    name: "Absenteeism Rate",
    category: "operations",
    current: 2.3,
    target: 2.5,
    unit: "%",
    status: "on-track",
    trend: "down",
    changePct: -8.0,
    history: [2.6, 2.5, 2.5, 2.4, 2.4, 2.3],
    owner: "Sneha Iyer",
    lastUpdated: "2026-05-07",
    description: "Unplanned absences as percentage of working days.",
    higherIsBetter: false,
    drilldown: [
      { label: "Engineering", value: 2.0, status: "on-track" },
      { label: "Design", value: 2.4, status: "on-track" },
      { label: "Sales", value: 2.8, status: "at-risk" },
      { label: "HR", value: 1.8, status: "on-track" },
    ],
  },
];

export const alerts: AlertItem[] = [
  {
    id: "alt-1",
    kpiName: "Time-to-Hire",
    severity: "high",
    message: "Engineering exceeded target by 12 days — recruitment review recommended.",
    raisedAt: "2026-05-07",
  },
  {
    id: "alt-2",
    kpiName: "Attrition Rate",
    severity: "medium",
    message: "Sales department attrition at 2.4% — above 2% threshold.",
    raisedAt: "2026-05-06",
  },
  {
    id: "alt-3",
    kpiName: "Goal Achievement",
    severity: "medium",
    message: "Sales team trending below 70% goal completion.",
    raisedAt: "2026-05-05",
  },
  {
    id: "alt-4",
    kpiName: "Training Completion",
    severity: "low",
    message: "Design team behind schedule on compliance training.",
    raisedAt: "2026-05-04",
  },
];

export const categoryConfig: Record<Exclude<Category, "all">, { label: string; icon: React.ReactNode; tone: string }> = {
  people: {
    label: "People",
    icon: <Users className="h-4 w-4" />,
    tone: "bg-indigo-100 text-indigo-700",
  },
  performance: {
    label: "Performance",
    icon: <Award className="h-4 w-4" />,
    tone: "bg-cyan-100 text-cyan-700",
  },
  financial: {
    label: "Financial",
    icon: <DollarSign className="h-4 w-4" />,
    tone: "bg-amber-100 text-amber-700",
  },
  operations: {
    label: "Operations",
    icon: <Activity className="h-4 w-4" />,
    tone: "bg-purple-100 text-purple-700",
  },
};
