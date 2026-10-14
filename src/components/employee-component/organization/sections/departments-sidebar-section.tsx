import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Department } from '@/types';

interface DepartmentsSidebarSectionProps {
  departments: Department[];
  selectedDepartment: string;
  onSelectDepartment: (departmentId: string) => void;
}

export function DepartmentsSidebarSection({ departments, selectedDepartment, onSelectDepartment }: DepartmentsSidebarSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Departments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => onSelectDepartment(dept.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                selectedDepartment === dept.id
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-sm font-medium">{dept.name}</span>
              <Badge variant="outline" className="text-xs">
                {dept.count}
              </Badge>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
