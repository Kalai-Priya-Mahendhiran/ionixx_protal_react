import { PieChart as PieIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { departmentMetrics } from "./analytics-meta";
import { DistributionChart } from "./analytics-charts";

export function HeadcountDistributionSection() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieIcon className="h-5 w-5 text-[#464EB8]" />
          <span>Headcount Distribution</span>
        </CardTitle>
        <CardDescription>Share of workforce by department</CardDescription>
      </CardHeader>
      <CardContent>
        <DistributionChart data={departmentMetrics} />
      </CardContent>
    </Card>
  );
}
