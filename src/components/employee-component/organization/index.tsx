import { useState } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { sampleUsers, sampleDepartments } from '@/lib/sample-data/organization-sample-data';
import {
  OrganizationStatsSection,
  DepartmentsSidebarSection,
  EmployeeDirectorySection,
  OrganizationChartSection
} from './sections';

export default function Organization() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const filteredUsers = sampleUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || 
                             user.department.toLowerCase() === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization</h1>
          <p className="text-gray-600 mt-2">Explore company structure and employee directory</p>
        </div>

        {/* Organization Stats */}
        <OrganizationStatsSection users={sampleUsers} departmentCount={sampleDepartments.length - 1} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Departments Sidebar */}
          <DepartmentsSidebarSection
            departments={sampleDepartments}
            selectedDepartment={selectedDepartment}
            onSelectDepartment={setSelectedDepartment}
          />

          {/* Employee Directory */}
          <EmployeeDirectorySection
            users={filteredUsers}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Organization Chart */}
        <OrganizationChartSection />
      </div>
    </MainLayout>
  );
}
