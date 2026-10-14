import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Github, 
  ExternalLink,
  Heart,
  Shield,
  Calendar,
  Building2,
  GraduationCap,
  Award,
  Briefcase,
  CreditCard,
  Download,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DisplayFieldProps {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
  isSensitive?: boolean;
  isUrl?: boolean;
  className?: string;
}

export function DisplayField({ label, value, icon, isSensitive, isUrl, className = "" }: DisplayFieldProps) {
  if (!value) {
    return (
      <div className={`space-y-1 ${className}`}>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-slate-400 italic text-sm">Not provided</p>
      </div>
    );
  }

  const displayValue = isSensitive ? value.replace(/./g, '•').slice(0, 12) + '****' : value;

  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2">
        {icon && <span className="text-indigo-600">{icon}</span>}
        {isUrl ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
          >
            {displayValue}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <p className="text-slate-800 font-medium">{displayValue}</p>
        )}
      </div>
    </div>
  );
}

interface DisplayGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function DisplayGrid({ children, columns = 2 }: DisplayGridProps) {
  const colsClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };
  return <div className={`grid ${colsClass[columns]} gap-6`}>{children}</div>;
}

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, icon, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface SubSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SubSection({ title, children, className = "" }: SubSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
        <span className="w-8 h-px bg-gradient-to-r from-indigo-500 to-transparent"></span>
        {title}
      </h4>
      {children}
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      {icon && <div className="mb-3 opacity-40">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface EntryCardProps {
  title: string;
  subtitle?: string;
  badges?: { label: string; variant?: "default" | "secondary" | "outline" }[];
  children: React.ReactNode;
  accentColor?: "indigo" | "violet" | "emerald";
  actions?: React.ReactNode;
}

export function EntryCard({ title, subtitle, badges, children, accentColor = "indigo", actions }: EntryCardProps) {
  const accentColors = {
    indigo: "border-l-indigo-500",
    violet: "border-l-violet-500",
    emerald: "border-l-emerald-500",
  };

  return (
    <div className={`bg-slate-50/50 backdrop-blur border border-slate-200 rounded-xl p-5 border-l-4 ${accentColors[accentColor]} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h5 className="font-semibold text-slate-900">{title}</h5>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          {badges && badges.length > 0 && (
            <div className="flex gap-2 mt-2">
              {badges.map((badge, idx) => (
                <Badge key={idx} variant={badge.variant || "secondary"} className="text-xs">
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

interface DocumentItemProps {
  name: string;
  type: string;
  size?: string;
  onDownload?: () => void;
}

export function DocumentItem({ name, type, size, onDownload }: DocumentItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <FileText className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{type} {size && `• ${size}`}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDownload} className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
}

