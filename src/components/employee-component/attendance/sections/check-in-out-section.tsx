import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export function CheckInOutSection() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('09:00');

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setCheckInTime(new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }));
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Today's Attendance</span>
        </CardTitle>
        <CardDescription>Check in and out for today</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Current Status</p>
          <p className="text-2xl font-bold text-green-600">
            {isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </p>
          {isCheckedIn && (
            <p className="text-sm text-gray-600 mt-1">
              Since: {checkInTime}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {!isCheckedIn ? (
            <Button
              onClick={handleCheckIn}
              className="w-full"
              size="lg"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Check In
            </Button>
          ) : (
            <Button
              onClick={handleCheckOut}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Check Out
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Expected working hours: 8 hours</p>
          <p>Break time: 1 hour</p>
        </div>
      </CardContent>
    </Card>
  );
}
