export type Period = "1M" | "3M" | "6M" | "1Y";

export type WorkforceMetric = "headcount" | "hires" | "exits";

export interface TrendPoint {
  label: string;
  headcount: number;
  hires: number;
  exits: number;
  attritionRate: number;
}

export interface DepartmentMetric {
  name: string;
  headcount: number;
  hires: number;
  exits: number;
  productivity: number;
  budgetUsed: number;
  color: string;
}

export interface ForecastPoint {
  label: string;
  actual: number | null;
  forecast: number;
}

export const trendData: Record<Period, TrendPoint[]> = {
  "1M": [
    { label: "Wk 1", headcount: 312, hires: 4, exits: 1, attritionRate: 0.3 },
    { label: "Wk 2", headcount: 314, hires: 3, exits: 1, attritionRate: 0.3 },
    { label: "Wk 3", headcount: 316, hires: 2, exits: 0, attritionRate: 0.0 },
    { label: "Wk 4", headcount: 318, hires: 3, exits: 1, attritionRate: 0.3 },
  ],
  "3M": [
    { label: "Mar", headcount: 298, hires: 9, exits: 4, attritionRate: 1.4 },
    { label: "Apr", headcount: 305, hires: 11, exits: 4, attritionRate: 1.3 },
    { label: "May", headcount: 318, hires: 18, exits: 5, attritionRate: 1.6 },
  ],
  "6M": [
    { label: "Dec", headcount: 280, hires: 8, exits: 6, attritionRate: 2.1 },
    { label: "Jan", headcount: 287, hires: 12, exits: 5, attritionRate: 1.8 },
    { label: "Feb", headcount: 294, hires: 11, exits: 4, attritionRate: 1.4 },
    { label: "Mar", headcount: 298, hires: 9, exits: 4, attritionRate: 1.4 },
    { label: "Apr", headcount: 305, hires: 11, exits: 4, attritionRate: 1.3 },
    { label: "May", headcount: 318, hires: 18, exits: 5, attritionRate: 1.6 },
  ],
  "1Y": [
    { label: "Jun", headcount: 246, hires: 7, exits: 5, attritionRate: 2.0 },
    { label: "Jul", headcount: 252, hires: 9, exits: 3, attritionRate: 1.2 },
    { label: "Aug", headcount: 258, hires: 8, exits: 2, attritionRate: 0.8 },
    { label: "Sep", headcount: 265, hires: 10, exits: 3, attritionRate: 1.1 },
    { label: "Oct", headcount: 271, hires: 9, exits: 3, attritionRate: 1.1 },
    { label: "Nov", headcount: 276, hires: 8, exits: 3, attritionRate: 1.1 },
    { label: "Dec", headcount: 280, hires: 8, exits: 6, attritionRate: 2.1 },
    { label: "Jan", headcount: 287, hires: 12, exits: 5, attritionRate: 1.8 },
    { label: "Feb", headcount: 294, hires: 11, exits: 4, attritionRate: 1.4 },
    { label: "Mar", headcount: 298, hires: 9, exits: 4, attritionRate: 1.4 },
    { label: "Apr", headcount: 305, hires: 11, exits: 4, attritionRate: 1.3 },
    { label: "May", headcount: 318, hires: 18, exits: 5, attritionRate: 1.6 },
  ],
};

export const departmentMetrics: DepartmentMetric[] = [
  { name: "Engineering", headcount: 142, hires: 18, exits: 6, productivity: 92, budgetUsed: 78, color: "#464EB8" },
  { name: "Design", headcount: 28, hires: 4, exits: 1, productivity: 88, budgetUsed: 64, color: "#3FCCE8" },
  { name: "Quality", headcount: 36, hires: 5, exits: 2, productivity: 90, budgetUsed: 71, color: "#22c55e" },
  { name: "Sales", headcount: 42, hires: 7, exits: 3, productivity: 85, budgetUsed: 82, color: "#f59e0b" },
  { name: "HR", headcount: 14, hires: 2, exits: 0, productivity: 94, budgetUsed: 58, color: "#a855f7" },
  { name: "Infrastructure", headcount: 22, hires: 3, exits: 1, productivity: 89, budgetUsed: 73, color: "#ef4444" },
  { name: "Finance", headcount: 18, hires: 1, exits: 1, productivity: 91, budgetUsed: 67, color: "#0ea5e9" },
  { name: "Marketing", headcount: 16, hires: 2, exits: 1, productivity: 86, budgetUsed: 70, color: "#ec4899" },
];

export const headcountForecast: ForecastPoint[] = [
  { label: "Mar", actual: 298, forecast: 298 },
  { label: "Apr", actual: 305, forecast: 304 },
  { label: "May", actual: 318, forecast: 312 },
  { label: "Jun", actual: null, forecast: 326 },
  { label: "Jul", actual: null, forecast: 334 },
  { label: "Aug", actual: null, forecast: 341 },
];

export const attritionForecast: ForecastPoint[] = [
  { label: "Mar", actual: 1.4, forecast: 1.4 },
  { label: "Apr", actual: 1.3, forecast: 1.5 },
  { label: "May", actual: 1.6, forecast: 1.6 },
  { label: "Jun", actual: null, forecast: 1.7 },
  { label: "Jul", actual: null, forecast: 1.8 },
  { label: "Aug", actual: null, forecast: 1.6 },
];
