import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { ROLE_LABELS, ROLE_SIDEBAR_ITEMS } from "@/lib/mock-users";
import { getIcon } from "@/lib/constants";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const items = user ? ROLE_SIDEBAR_ITEMS[user.role] : [];

  const handleNavigation = (path: string) => {
    navigate(path);
    // On small screens the sidebar is a drawer over the page, so close it once a page is picked
    if (isOpen && !window.matchMedia('(min-width: 1024px)').matches) onToggle();
  };

  return (
    <div className={cn(
      // A column: the nav scrolls on its own so long menus never run under the footer
      "fixed inset-y-0 left-0 z-50 flex w-64 flex-col ionixx-gradient-vertical transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full",
      "lg:translate-x-0"
    )}>
      {/* Sidebar Header */}
      <div className="flex shrink-0 items-center justify-between h-16 px-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Ix</span>
          </div>
          <span className="text-white font-semibold text-lg">Ionixx Portal</span>
        </div>
        <button
          onClick={onToggle}
          aria-label="Close menu"
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {user && (
        <div className="shrink-0 px-6 py-3 border-b border-white/10">
          <p className="text-xs text-white/60 uppercase tracking-wider">Signed in as</p>
          <p className="text-white font-medium text-sm truncate">{user.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white/20 text-white">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            // Sub-pages (e.g. /tasks/IXP-102) keep their section highlighted
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200",
                    isActive
                      ? "bg-white/20 backdrop-blur-sm text-white shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="shrink-0 p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          <p>© 2026 Ionixx Technologies</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
