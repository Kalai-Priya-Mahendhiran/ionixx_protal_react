import { BarChart3 } from 'lucide-react';

export function SelectReportSection() {
  return (
    <div className="text-center py-12">
      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
      <p className="text-gray-600">Choose a report type from the sidebar to view detailed analytics</p>
    </div>
  );
}
