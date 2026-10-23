import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { SidebarItem } from "@/lib/mock-users";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useSidebarItems } from "@/services/apis/users/use-sidebar-items";
import { getIcon } from "@/lib/constants";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Where an item links to: its page plus the view it picks, e.g. /service-desk?tab=mine
const hrefOf = (item: SidebarItem) => (item.search ? `${item.path}?${item.search}` : item.path);

// Its query is all present in the current URL ("tab=mine" matches "?tab=mine&status=open")
const searchMatches = (item: SidebarItem, search: string) => {
  if (!item.search) return false;
  const current = new URLSearchParams(search);
  return [...new URLSearchParams(item.search)].every(([key, value]) => current.get(key) === value);
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { pathname, search } = useLocation();
  const { user } = useAuth();

  // Role defaults, pages System Admin added or removed, and pages that follow from the data (e.g. Approvals for team leads); live
  const items = useSidebarItems(user);

  // On small screens the sidebar is a drawer over the page, so close it once a page is picked
  const closeOnMobile = () => {
    if (isOpen && !window.matchMedia('(min-width: 1024px)').matches) onToggle();
  };

  // Sub-pages (e.g. /tasks/IXP-102) keep their section highlighted. When two items share a page
  // (Service Desk / My Requests, Tasks / Task Settings) the one whose view is in the URL wins, else the plain one.
  const onPage = items.filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  const activeId = (onPage.find((item) => searchMatches(item, search)) ?? onPage.find((item) => !item.search) ?? onPage[0])?.id;

  return (
    <div className={cn(
      // A column: the nav scrolls on its own so long menus never run under the footer
      "fixed inset-y-0 left-0 z-50 flex w-64 flex-col app-gradient-vertical transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full",
      "lg:translate-x-0"
    )}>
      {/* Sidebar Header */}
      <div className="flex shrink-0 items-center justify-between h-16 px-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-[10px] tracking-tight">KPSS</span>
          </div>
          <span className="text-white font-semibold text-[10px] leading-tight">Knowledge &amp; People Self-Service</span>
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

      {/* Navigation Items */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = item.id === activeId;

            return (
              <li key={item.id}>
                {/* A real link, so it can be opened in a new tab, bookmarked or copied */}
                <Link
                  to={hrefOf(item)}
                  onClick={closeOnMobile}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200",
                    isActive
                      ? "bg-white/20 backdrop-blur-sm text-white shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="shrink-0 p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          <p>© 2026 KPSS</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
