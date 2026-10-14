import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import type { LeaveRequest } from '@/types';

interface LeaveCalendarSectionProps {
  requests: LeaveRequest[];
}

export function LeaveCalendarSection({ requests }: LeaveCalendarSectionProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Leave Calendar</span>
        </CardTitle>
        <CardDescription>View team leaves and holidays</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 31 }, (_, i) => {
            const date = i + 1;
            const dateStr = `2024-01-${date.toString().padStart(2, '0')}`;
            const leave = requests.find(req => 
              req.startDate <= dateStr && req.endDate >= dateStr && req.status === 'approved'
            );
            
            return (
              <div
                key={date}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg border
                  ${leave 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                  }
                `}
              >
                {date}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>On Leave</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Working Day</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
