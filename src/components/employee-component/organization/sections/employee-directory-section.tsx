import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Search,
  Phone,
  Mail,
  ChevronRight,
  User,
  Crown
} from 'lucide-react';
import type { User as Employee } from '@/types';

interface EmployeeDirectorySectionProps {
  users: Employee[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 'manager':
      return <User className="h-4 w-4 text-blue-500" />;
    default:
      return <User className="h-4 w-4 text-gray-500" />;
  }
};

const getRoleBadge = (role: string) => {
  const colors = {
    'admin': 'bg-yellow-100 text-yellow-800',
    'manager': 'bg-blue-100 text-blue-800',
    'employee': 'bg-green-100 text-green-800',
    'hr': 'bg-purple-100 text-purple-800'
  };
  
  return (
    <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
};

export function EmployeeDirectorySection({ users, searchTerm, onSearchChange }: EmployeeDirectorySectionProps) {
  return (
    <div className="lg:col-span-3 space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                    {getRoleIcon(user.role)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{user.designation}</p>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    {getRoleBadge(user.role)}
                    <Badge variant="outline" className="text-xs">
                      {user.department}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3 w-3" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-3 w-3" />
                      <span>ID: {user.employeeId}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Manager: {user.reportingManager}
                      </span>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No employees in this department'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
