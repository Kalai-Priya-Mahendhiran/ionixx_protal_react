import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAttendance } from '@/context/attendance-context';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Moon } from 'lucide-react';
import { InfoPopover } from '@/components/common-component/info';
import { DASHBOARD_INFO } from './dashboard-info';
import { formatTime, getGreeting, getGreetingIcon, getIcon, GREETING_ICON_COLORS } from '@/lib/constants';

export function WelcomeHeaderSection() {
  const { user } = useAuth();
  const { isCheckedIn } = useAttendance();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greetingIconName = getGreetingIcon(currentTime);
  const GreetingIcon = getIcon(greetingIconName, Moon);

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-6 py-4 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 border-2 border-white/20">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-lg font-bold bg-white/20 text-white">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <GreetingIcon className={`h-5 w-5 ${GREETING_ICON_COLORS[greetingIconName]}`} />
                <h1 className="text-2xl font-bold">{getGreeting(currentTime)}, {user?.name || 'User'}!</h1>
                <InfoPopover content={DASHBOARD_INFO} />
              </div>
              <p className="text-sm text-white/90 mt-0.5">
                {user?.designation} • {user?.department} • {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">{formatTime(currentTime)}</div>
            <Badge className="bg-white/20 text-white border-white/30">
              {isCheckedIn ? 'Currently Working' : 'Not Checked In'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
