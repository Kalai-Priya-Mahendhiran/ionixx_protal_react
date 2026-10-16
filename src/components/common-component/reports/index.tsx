import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import {
  AlarmClock,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Calendar,
  FolderKanban,
  Hourglass,
  ListChecks,
  Loader,
  Users,
  UserX,
  Clock,
  TrendingUp,
  FileText,
  Filter
} from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader, headerSecondaryButtonClass } from '@/components/ui/page-header';
import { REPORT_DATE_RANGES } from '@/lib/constants';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState('this-month');

  const reportTypes = [
    { id: 'attendance', label: 'Attendance Report', icon: Clock, description: 'Daily attendance and working hours' },
    { id: 'leave', label: 'Leave Report', icon: Calendar, description: 'Leave requests and approvals' },
    { id: 'time-tracker', label: 'Time Tracker Report', icon: BarChart3, description: 'Project-wise time tracking' },
    { id: 'task', label: 'Task Report', icon: FileText, description: 'Task completion and productivity' },
    { id: 'employee', label: 'Employee Report', icon: Users, description: 'Employee performance and details' },
  ];

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting ${selectedReport} report as ${format}`);
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'attendance':
        return (
          <div className="space-y-6">
            <StatGrid>
              <StatCard icon={CheckCircle2} label="Attendance Rate" value="95%" tone="green" />
              <StatCard icon={Clock} label="Total Hours" value="168h" tone="blue" />
              <StatCard icon={AlarmClock} label="Late Arrivals" value={3} tone="amber" />
              <StatCard icon={UserX} label="Absent Days" value={1} tone="red" />
            </StatGrid>
            
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Week {i + 1}</p>
                        <p className="text-sm text-gray-600">Jan {i * 7 + 1} - Jan {(i + 1) * 7}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className="bg-green-100 text-green-800">Present: 5 days</Badge>
                        <Badge className="bg-yellow-100 text-yellow-800">Late: 1 day</Badge>
                        <Badge className="bg-red-100 text-red-800">Absent: 0 days</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'leave':
        return (
          <div className="space-y-6">
            <StatGrid>
              <StatCard icon={FileText} label="Total Requests" value={5} tone="blue" />
              <StatCard icon={CheckCircle2} label="Approved" value={4} tone="green" />
              <StatCard icon={Hourglass} label="Pending" value={1} tone="amber" />
            </StatGrid>
            
            <Card>
              <CardHeader>
                <CardTitle>Leave Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-lg font-bold text-blue-600">12</p>
                    <p className="text-sm text-gray-600">Casual Leave</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-lg font-bold text-red-600">7</p>
                    <p className="text-sm text-gray-600">Sick Leave</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-lg font-bold text-green-600">15</p>
                    <p className="text-sm text-gray-600">Earned Leave</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-lg font-bold text-purple-600">90</p>
                    <p className="text-sm text-gray-600">Maternity Leave</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'time-tracker':
        return (
          <div className="space-y-6">
            <StatGrid>
              <StatCard icon={Clock} label="Total Time" value="168h" tone="blue" />
              <StatCard icon={TrendingUp} label="Productivity" value="85%" tone="green" />
              <StatCard icon={FolderKanban} label="Active Projects" value={3} tone="purple" />
            </StatGrid>
            
            <Card>
              <CardHeader>
                <CardTitle>Project Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="font-medium">Employee Portal</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">120h</p>
                      <p className="text-sm text-gray-600">71%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="font-medium">Mobile App</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">32h</p>
                      <p className="text-sm text-gray-600">19%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-purple-500 rounded"></div>
                      <span className="font-medium">API Development</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">16h</p>
                      <p className="text-sm text-gray-600">10%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'task':
        return (
          <div className="space-y-6">
            <StatGrid>
              <StatCard icon={ListChecks} label="Total Tasks" value={20} tone="blue" />
              <StatCard icon={CheckCircle2} label="Completed" value={15} tone="green" />
              <StatCard icon={Loader} label="In Progress" value={3} tone="amber" />
              <StatCard icon={AlertTriangle} label="Overdue" value={2} tone="red" />
            </StatGrid>
            
            <Card>
              <CardHeader>
                <CardTitle>Task Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-gray-600">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">On-time Delivery</span>
                    <span className="text-sm text-gray-600">80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quality Score</span>
                    <span className="text-sm text-gray-600">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
            <p className="text-gray-600">Choose a report type from the sidebar to view detailed analytics</p>
          </div>
        );
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
                      onClick={() => setSelectedReport(report.id)}
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

          {/* Report Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Date Range Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                    <select 
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {REPORT_DATE_RANGES.map(range => (
                        <option key={range.id} value={range.id}>{range.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Apply Filter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Content */}
            {renderReportContent()}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
