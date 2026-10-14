import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp, 
  Bell,
  CheckCircle,
  Play,
  Square,
  Plus,
  ArrowUpRight,
  Target,
  Award,
  Zap,
  Star,
  Coffee,
  Sun,
  Moon,
  Cake,
  HeartHandshake,
  Gift
} from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { sampleEvents, sampleNotifications, quickStats, recentActivities, celebrationCards } from '@/lib/sample-data/dashboard-sample-data';
import { formatTime, getGreeting, getGreetingIcon } from '@/lib/constants';

export default function Dashboard() {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Update time every second and calculate elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Calculate elapsed time if checked in
      if (isCheckedIn && checkInTime) {
        const diffInMs = now.getTime() - checkInTime.getTime();
        const totalSeconds = Math.floor(diffInMs / 1000);
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        setElapsedTime({ hours, minutes, seconds });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isCheckedIn, checkInTime]);

  const handleCheckIn = () => {
    const now = new Date();
    setCheckInTime(now);
    setIsCheckedIn(true);
    setIsTimerRunning(true);
    setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setIsTimerRunning(false);
    setCheckInTime(null);
    setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
  };

  const getGreetingIconComponent = () => {
    const iconName = getGreetingIcon(currentTime);
    if (iconName === 'Sun') return <Sun className="h-5 w-5 text-yellow-500" />;
    if (iconName === 'Coffee') return <Coffee className="h-5 w-5 text-orange-500" />;
    return <Moon className="h-5 w-5 text-blue-500" />;
  };

  const formatElapsedTime = () => {
    if (!isCheckedIn) return '0h 0m 0s';
    return `${elapsedTime.hours}h ${elapsedTime.minutes}m ${elapsedTime.seconds}s`;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 border-4 border-white/20">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {getGreetingIconComponent()}
                    <h1 className="text-3xl font-bold">{getGreeting(currentTime)}, {user?.name || 'User'}!</h1>
                  </div>
                  <p className="text-white/90 text-lg">
                    {user?.designation} • {user?.department}
                  </p>
                  <p className="text-white/70">
                    {formatTime(currentTime)} • {currentTime.toLocaleDateString('en-US', {
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold mb-2">{formatTime(currentTime)}</div>
                <Badge className="bg-white/20 text-white border-white/30">
                  {isCheckedIn ? 'Currently Working' : 'Not Checked In'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const getIcon = (iconName: string) => {
              switch (iconName) {
                case 'CheckCircle': return CheckCircle;
                case 'Target': return Target;
                case 'Clock': return Clock;
                case 'Star': return Star;
                default: return CheckCircle;
              }
            };
            const Icon = getIcon(stat.icon);
            return (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                      <div className="flex items-center">
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                      </div>
                    </div>
                    <div className={`p-4 rounded-2xl ${stat.bgColor} shadow-lg`}>
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Time Tracking Card */}
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
                  <span className="font-medium">8 hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Break Time</span>
                  <span className="font-medium">1 hour</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="lg:col-span-2 border-0 shadow-xl">
            <CardHeader className="text-black rounded-t-lg">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Upcoming Events</span>
                </div>
                <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </CardTitle>
              <CardDescription className="text-white/90">This week's important dates and meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleEvents.map((event, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 ionixx_icon-gradient rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">{event.date}</span>
                        <span className="text-xs text-gray-500">{event.time}</span>
                        {event.location && (
                          <span className="text-xs text-gray-500">{event.location}</span>
                        )}
                      </div>
                    </div>
                    <Badge className={
                      event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                      event.type === 'birthday' ? 'bg-pink-100 text-pink-800' :
                      event.type === 'deadline' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Celebration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {celebrationCards.map((card, index) => {
            const getIcon = (iconName: string) => {
              switch (iconName) {
                case 'Cake': return Cake;
                case 'HeartHandshake': return HeartHandshake;
                case 'Gift': return Gift;
                default: return Cake;
              }
            };
            const Icon = getIcon(card.icon);
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className={`rounded-t-lg`}>
                  <CardTitle className="flex items-center space-x-2 text-black">
                    <Icon className={`h-5 w-5 ${card.color}`} />
                    <span>{card.title}</span>
                  </CardTitle>
                  <CardDescription className="text-black">{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {card.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{item.date}</span>
                            {item.years && (
                              <span className="text-xs text-gray-500">• {item.years}</span>
                            )}
                          </div>
                        </div>
                        <Badge className={
                          item.status === 'Today' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :  
                          item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activities & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Recent Activities</span>
              </CardTitle>
              <CardDescription>Your latest updates and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const getIcon = (iconName: string) => {
                    switch (iconName) {
                      case 'CheckCircle': return CheckCircle;
                      case 'Target': return Target;
                      case 'Calendar': return Calendar;
                      case 'Users': return Users;
                      default: return CheckCircle;
                    }
                  };
                  const Icon = getIcon(activity.icon);
                  return (
                    <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <span>Notifications</span>
                </div>
                <Badge className="bg-red-100 text-red-800">3 new</Badge>
              </CardTitle>
              <CardDescription>Important updates and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleNotifications.slice(0, 4).map((notification, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.isRead ? 'bg-gray-300' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300 transition-all">
                <Plus className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">Add Task</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300 transition-all">
                <Calendar className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">Apply Leave</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-300 transition-all">
                <FileText className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-medium">Upload File</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-300 transition-all">
                <Users className="h-6 w-6 text-orange-600" />
                <span className="text-sm font-medium">View Team</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-red-50 hover:border-red-300 transition-all">
                <TrendingUp className="h-6 w-6 text-red-600" />
                <span className="text-sm font-medium">Reports</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                <Award className="h-6 w-6 text-indigo-600" />
                <span className="text-sm font-medium">Achievements</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
