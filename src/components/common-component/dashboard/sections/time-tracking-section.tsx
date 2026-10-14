import { useEffect, useState } from 'react';
import { useAttendance } from '@/context/attendance-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square } from 'lucide-react';
import { formatTime, formatDuration, WORKING_HOURS } from '@/lib/constants';

export function TimeTrackingSection() {
  const { isCheckedIn, checkInTime, checkIn: handleCheckIn, checkOut: handleCheckOut } = useAttendance();
  const [now, setNow] = useState(new Date());

  // Refresh the elapsed time every second while checked in
  useEffect(() => {
    if (!isCheckedIn) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isCheckedIn]);

  const formatElapsedTime = () => {
    if (!isCheckedIn || !checkInTime) return formatDuration(0);
    return formatDuration(now.getTime() - checkInTime.getTime());
  };

  return (
    <Card className="lg:col-span-1 border-0 shadow-xl">
      <CardHeader className="text-black rounded-t-lg">
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Time Tracking</span>
        </CardTitle>
        <CardDescription className="text-white/90">Track your daily attendance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full ionixx_icon-gradient flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {formatElapsedTime()}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">Today's Status</p>
          <Badge className={isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {isCheckedIn ? 'Present' : 'Not Checked In'}
          </Badge>
        </div>

        <div className="space-y-3">
          {!isCheckedIn ? (
            <Button
              onClick={handleCheckIn}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Play className="h-4 w-4 mr-2" />
              Check In
            </Button>
          ) : (
            <Button
              onClick={handleCheckOut}
              variant="outline"
              className="w-full h-12 border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <Square className="h-4 w-4 mr-2" />
              Check Out
            </Button>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Check-in Time</span>
            <span className="font-medium">
              {checkInTime ? formatTime(checkInTime) : 'Not checked in'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Expected Hours</span>
            <span className="font-medium">{WORKING_HOURS.expectedHours}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Break Time</span>
            <span className="font-medium">{WORKING_HOURS.breakTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
