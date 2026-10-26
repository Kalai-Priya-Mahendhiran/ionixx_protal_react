import { Target, UserMinus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { attritionForecast, headcountForecast } from "./analytics-meta";
import { ForecastChart } from "./analytics-charts";

export function ForecastSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#464EB8]" />
            <span>Headcount Forecast</span>
          </CardTitle>
          <CardDescription>
            Projected growth — next 3 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForecastChart data={headcountForecast} color="#464EB8" suffix="" />
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-xs font-medium text-indigo-900">
              Projected: <span className="font-bold">+23 employees</span> by Aug 2026
            </p>
            <p className="text-xs text-indigo-700 mt-0.5">
              Based on current hiring velocity and attrition trends
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-orange-500" />
            <span>Attrition Forecast</span>
          </CardTitle>
          <CardDescription>
            Expected attrition trend (%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForecastChart data={attritionForecast} color="#f59e0b" suffix="%" />
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-xs font-medium text-orange-900">
              Watch zone: <span className="font-bold">1.6% – 1.8%</span> through Q3
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              Sales and Engineering are showing elevated risk
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
