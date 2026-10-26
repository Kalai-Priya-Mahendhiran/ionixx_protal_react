import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Download } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader, headerSecondaryButtonClass } from '@/components/ui/page-header';
import { REPORT_TYPES } from './sections/reports-meta';
import {
  AttendanceReportSection,
  DateRangeFilterSection,
  LeaveReportSection,
  ReportTypesSection,
  SelectReportSection,
  TaskReportSection,
  TimeTrackerReportSection
} from './sections';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState('this-month');

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting ${selectedReport} report as ${format}`);
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'attendance':
        return <AttendanceReportSection />;

      case 'leave':
        return <LeaveReportSection />;

      case 'time-tracker':
        return <TimeTrackerReportSection />;

      case 'task':
        return <TaskReportSection />;

      default:
        return <SelectReportSection />;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          icon={BarChart3}
          title="Reports"
          description="Generate and export comprehensive reports"
          actions={
            <>
              <Button variant="outline" className={headerSecondaryButtonClass} onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" className={headerSecondaryButtonClass} onClick={() => handleExport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Types Sidebar */}
          <ReportTypesSection reportTypes={REPORT_TYPES} selectedReport={selectedReport} onSelect={setSelectedReport} />

          {/* Report Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Date Range Filter */}
            <DateRangeFilterSection dateRange={dateRange} onDateRangeChange={setDateRange} />

            {/* Report Content */}
            {renderReportContent()}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
