import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  HelpCircle, 
  Bell, 
  Menu,
  User,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { QUICK_ADD_OPTIONS, ROUTES } from "@/lib/constants";
import { useLocation, useNavigate } from "react-router-dom";
import { NotificationsPanel } from "./notifications-panel";
import { useUnreadNotificationCount } from "@/services/apis/notifications/use-notifications";

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

 const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenuButton = true }) => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const unreadCount = useUnreadNotificationCount();

  // Function to get current page name based on pathname
  const getCurrentPageName = (): string => {
    // Sub-pages such as /tasks/IXP-102 show their section name
    const section = `/${pathname.split("/")[1] ?? ""}`;
    switch (section) {
      case ROUTES.Dashboard:
        return 'Dashboard';
      case ROUTES.Profile:
        return 'Profile';
      case ROUTES.Attendance:
        return 'Attendance';
      case ROUTES.TimeTracker:
        return 'Time Tracker';
      case ROUTES.Leave:
        return 'Leave Tracker';
      case ROUTES.Tasks:
        return 'Tasks';
      case ROUTES.Files:
        return 'Files';
      case ROUTES.Organization:
        return 'Organization';
      case ROUTES.Reports:
        return 'Reports';
      case ROUTES.ServiceDesk: {
        const page = pathname.split('/')[2];
        if (page === 'assets') return 'Asset Log';
        if (page === 'expenses') return 'Expenses';
        if (page === 'reports') return 'Desk Reports';
        return user?.role === 'admin' ? 'Service Desk' : 'My Requests';
      }
      default:
        return 'Dashboard';
    }
  };

  // Refs for dropdown containers
  const quickAddRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setShowQuickAdd(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleQuickAdd = (option: string) => {
    setShowQuickAdd(false);
    // The service desk opens its raise dialog from ?raise=1
    if (option === "admin-request") navigate(`${ROUTES.ServiceDesk}?raise=1`);
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Breadcrumb */}
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 font-medium">
          <span className="font-bold">Ionixx Portal</span>
          <span><ChevronRight /></span>
          <span>{getCurrentPageName()}</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search employees, tasks, or anything..."
            className="pl-10 pr-4"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Quick Add */}
        <div className="relative" ref={quickAddRef}>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="hidden sm:flex items-center space-x-2 border border-gray-300 hover:bg-blue-50 hover:border-blue-500 transition-all"
          >
            <Plus className="h-4 w-4 text-blue-600" />
            <span>Quick Add</span>
          </Button>
          
          {showQuickAdd && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
              {QUICK_ADD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleQuickAdd(option.id)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Help */}
        <Button variant="ghost" size="icon" title="Help">
          <HelpCircle className="h-8 w-8" />
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotificationClick}
            className="relative"
          >
            <Bell className="h-8 w-8 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 -right-1 h-6 min-w-6 px-1 ionixx_icon-gradient rounded-full text-xs text-white flex items-center justify-center font-bold border border-blue-600">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && <NotificationsPanel onNavigate={() => setShowNotifications(false)} />}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <Button
            variant="ghost"
            onClick={handleProfileClick}
            className="flex items-center space-x-2 px-2"
          >
            <div className="w-8 h-8 ionixx_icon-gradient rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="hidden md:block text-sm font-medium">{user?.name || 'User'}</span>
          </Button>
          
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <hr className="my-1" />
              <button 
                onClick={logout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
