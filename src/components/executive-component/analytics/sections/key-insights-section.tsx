import { Briefcase, DollarSign, TrendingDown, TrendingUp, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function KeyInsightsSection() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#464EB8]" />
          <span>Key Insights</span>
        </CardTitle>
        <CardDescription>Auto-generated highlights for this period</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          <Insight
            icon={<TrendingUp className="h-4 w-4 text-green-600" />}
            title="Engineering grew fastest"
            body="18 new hires this quarter — driven by platform expansion."
            tone="bg-green-50"
          />
          <Insight
            icon={<TrendingDown className="h-4 w-4 text-orange-600" />}
            title="Sales attrition up 0.4 pts"
            body="Three exits in May — recommend targeted retention review."
            tone="bg-orange-50"
          />
          <Insight
            icon={<DollarSign className="h-4 w-4 text-amber-600" />}
            title="Sales budget at 82%"
            body="Approaching threshold — flag for finance review before next hire."
            tone="bg-amber-50"
          />
          <Insight
            icon={<Users className="h-4 w-4 text-indigo-600" />}
            title="HR productivity leads"
            body="94% productivity score — highest across all teams this period."
            tone="bg-indigo-50"
          />
        </ul>
      </CardContent>
    </Card>
  );
}

function Insight({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <li className={`flex items-start gap-3 p-3 rounded-lg ${tone}`}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{body}</p>
      </div>
    </li>
  );
}
