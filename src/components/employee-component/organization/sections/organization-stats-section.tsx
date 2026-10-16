import { Building, Users, User, Crown } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import type { User as Employee } from '@/types';

interface OrganizationStatsSectionProps {
  users: Employee[];
  departmentCount: number;
}

export function OrganizationStatsSection({ users, departmentCount }: OrganizationStatsSectionProps) {
  return (
    <StatGrid>
      <StatCard icon={Users} label="Total Employees" value={users.length} tone="blue" />
      <StatCard icon={Building} label="Departments" value={departmentCount} tone="green" />
      <StatCard
        icon={Crown}
        label="Managers"
        value={users.filter(u => u.role === 'manager' || u.role === 'admin').length}
        tone="purple"
      />
      <StatCard icon={User} label="Active Employees" value={users.length} tone="orange" />
    </StatGrid>
  );
}
