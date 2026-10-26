import { BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TrendPoint, WorkforceMetric } from "./analytics-meta";
import { SvgBarChart, SvgLineChart } from "./analytics-charts";

interface WorkforceTrendSectionProps {
  points: TrendPoint[];
  activeMetric: WorkforceMetric;
  setActiveMetric: (metric: WorkforceMetric) => void;
  maxValue: number;
  minHeadcount: number;
}

export function WorkforceTrendSection({
  points,
  activeMetric,
  setActiveMetric,
  maxValue,
  minHeadcount,
}: WorkforceTrendSectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#464EB8]" />
              <span>Workforce Trend</span>
            </CardTitle>
            <CardDescription>
              Headcount, hires, and exits over time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(["headcount", "hires", "exits"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  activeMetric === m
                    ? "bg-[#464EB8] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 relative">
          {activeMetric === "headcount" ? (
            <SvgLineChart
              points={points.map((p) => ({ label: p.label, value: p.headcount }))}
              min={minHeadcount}
              max={maxValue + 5}
              color="#464EB8"
              fillId="headcount-grad"
            />
          ) : (
            <SvgBarChart
              points={points.map((p) => ({
                label: p.label,
                value: activeMetric === "hires" ? p.hires : p.exits,
              }))}
              max={maxValue + 2}
              color={activeMetric === "hires" ? "#22c55e" : "#ef4444"}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
