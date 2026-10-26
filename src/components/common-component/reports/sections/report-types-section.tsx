import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportType } from './reports-meta';

interface ReportTypesSectionProps {
  reportTypes: ReportType[];
  selectedReport: string;
  onSelect: (id: string) => void;
}

export function ReportTypesSection({ reportTypes, selectedReport, onSelect }: ReportTypesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => onSelect(report.id)}
                className={`w-full flex items-start space-x-3 p-3 rounded-lg text-left transition-colors ${
                  selectedReport === report.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{report.label}</p>
                  <p className="text-xs text-gray-600">{report.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
