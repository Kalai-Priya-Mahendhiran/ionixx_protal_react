import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/protected-route';
import PublicRoute from '@/components/auth/public-route';
import Login from '@/components/auth-component/login';
import ForgotPassword from '@/components/auth-component/forgot-password';

// Common (shared across roles)
import Dashboard from '@/components/common-component/dashboard';
import Profile from '@/components/employee-component/profile';
import Reports from '@/components/common-component/reports';

// Employee (ESS)
import Attendance from '@/components/employee-component/attendance';
import TimeTracker from '@/components/employee-component/time-tracker';
import Leave from '@/components/employee-component/leave-tracker';
import Pay from '@/components/employee-component/pay';
import Tasks from '@/components/employee-component/tasks';
import ProjectSummary from '@/components/employee-component/tasks/reports/project-summary';
import ServiceDesk from '@/components/admin-component/service-desk';
import RequestDetail from '@/components/admin-component/service-desk/request-detail';
import AssetLog from '@/components/admin-component/service-desk/asset-log';
import Expenses from '@/components/admin-component/service-desk/expenses';
import DeskReports from '@/components/admin-component/service-desk/desk-reports';
import TaskDetail from '@/components/employee-component/tasks/task-detail';
import Files from '@/components/employee-component/files';
import Organization from '@/components/employee-component/organization';

// Project Manager (MSS)
import TeamOverview from '@/components/project_manager-component/team-overview';
import Approvals from '@/components/project_manager-component/approvals';
import AttendanceMonitoring from '@/components/project_manager-component/attendance-monitoring';
import PerformanceReview from '@/components/project_manager-component/performance-review';

// HR
import EmployeeManagement from '@/components/hr-component/employee-management';
import Recruitment from '@/components/hr-component/recruitment';
import Training from '@/components/hr-component/training';
import Compliance from '@/components/hr-component/compliance';

// Executive
import Analytics from '@/components/executive-component/analytics';
import KpiMonitoring from '@/components/executive-component/kpi-monitoring';

// System Admin
import UserManagement from '@/components/system_admin-component/user-management';
import RolesPermissions from '@/components/system_admin-component/roles-permissions';
import SystemConfig from '@/components/system_admin-component/system-config';
import Integrations from '@/components/system_admin-component/integrations';
import Logs from '@/components/system_admin-component/logs';

import { ROUTES } from '@/lib/constants';
import { NotFoundPage } from '@/components/common-component/status-page';

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* Common */}
      <Route
        path={ROUTES.Dashboard}
        element={
          <ProtectedRoute module={ROUTES.Dashboard}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Profile}
        element={
          <ProtectedRoute module={ROUTES.Profile}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Reports}
        element={
          <ProtectedRoute module={ROUTES.Reports}>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* Employee (ESS) */}
      <Route
        path={ROUTES.Attendance}
        element={
          <ProtectedRoute module={ROUTES.Attendance}>
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TimeTracker}
        element={
          <ProtectedRoute module={ROUTES.TimeTracker}>
            <TimeTracker />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Leave}
        element={
          <ProtectedRoute module={ROUTES.Leave}>
            <Leave />
          </ProtectedRoute>
        }
      />
      {/* Pay & Tax: payslips, tax statement, investment declarations and claims */}
      <Route
        path={ROUTES.Pay}
        element={
          <ProtectedRoute module={ROUTES.Pay}>
            <Pay />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Tasks}
        element={
          <ProtectedRoute module={ROUTES.Tasks}>
            <Tasks />
          </ProtectedRoute>
        }
      />
      {/* Admin service desk: My Requests for everyone, the queue for the Admin team */}
      <Route
        path={ROUTES.ServiceDesk}
        element={
          <ProtectedRoute module={ROUTES.ServiceDesk}>
            <ServiceDesk />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AssetLog}
        element={
          <ProtectedRoute module={ROUTES.AssetLog}>
            <AssetLog />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Expenses}
        element={
          <ProtectedRoute module={ROUTES.Expenses}>
            <Expenses />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DeskReports}
        element={
          <ProtectedRoute module={ROUTES.DeskReports}>
            <DeskReports />
          </ProtectedRoute>
        }
      />
      {/* Each request has its own shareable page, e.g. /service-desk/ADM-104 */}
      <Route
        path={`${ROUTES.ServiceDesk}/:requestKey`}
        element={
          <ProtectedRoute module={ROUTES.ServiceDesk}>
            <RequestDetail />
          </ProtectedRoute>
        }
      />
      {/* Read-only project summary from the executive dashboard, e.g. /tasks/project/IXP */}
      <Route
        path={`${ROUTES.Tasks}/project/:projectKey`}
        element={
          <ProtectedRoute module={ROUTES.Tasks}>
            <ProjectSummary />
          </ProtectedRoute>
        }
      />
      {/* Each task has its own shareable page, e.g. /tasks/IXP-102 */}
      <Route
        path={`${ROUTES.Tasks}/:taskKey`}
        element={
          <ProtectedRoute module={ROUTES.Tasks}>
            <TaskDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Files}
        element={
          <ProtectedRoute module={ROUTES.Files}>
            <Files />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Organization}
        element={
          <ProtectedRoute module={ROUTES.Organization}>
            <Organization />
          </ProtectedRoute>
        }
      />

      {/* Project Manager (MSS) */}
      <Route
        path={ROUTES.TeamOverview}
        element={
          <ProtectedRoute module={ROUTES.TeamOverview}>
            <TeamOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Approvals}
        element={
          <ProtectedRoute module={ROUTES.Approvals}>
            <Approvals />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AttendanceMonitoring}
        element={
          <ProtectedRoute module={ROUTES.AttendanceMonitoring}>
            <AttendanceMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PerformanceReview}
        element={
          <ProtectedRoute module={ROUTES.PerformanceReview}>
            <PerformanceReview />
          </ProtectedRoute>
        }
      />

      {/* HR */}
      <Route
        path={ROUTES.EmployeeManagement}
        element={
          <ProtectedRoute module={ROUTES.EmployeeManagement}>
            <EmployeeManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Recruitment}
        element={
          <ProtectedRoute module={ROUTES.Recruitment}>
            <Recruitment />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Training}
        element={
          <ProtectedRoute module={ROUTES.Training}>
            <Training />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Compliance}
        element={
          <ProtectedRoute module={ROUTES.Compliance}>
            <Compliance />
          </ProtectedRoute>
        }
      />

      {/* Executive */}
      <Route
        path={ROUTES.Analytics}
        element={
          <ProtectedRoute module={ROUTES.Analytics}>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.KpiMonitoring}
        element={
          <ProtectedRoute module={ROUTES.KpiMonitoring}>
            <KpiMonitoring />
          </ProtectedRoute>
        }
      />

      {/* System Admin */}
      <Route
        path={ROUTES.UserManagement}
        element={
          <ProtectedRoute module={ROUTES.UserManagement}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.RolesPermissions}
        element={
          <ProtectedRoute module={ROUTES.RolesPermissions}>
            <RolesPermissions />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.SystemConfig}
        element={
          <ProtectedRoute module={ROUTES.SystemConfig}>
            <SystemConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Integrations}
        element={
          <ProtectedRoute module={ROUTES.Integrations}>
            <Integrations />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.Logs}
        element={
          <ProtectedRoute module={ROUTES.Logs}>
            <Logs />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<RootRedirect />} />
      {/* Unknown addresses get a 404 page (signed-out visitors are asked to sign in first) */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <NotFoundPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function RootRedirect() {
  return <Navigate to="/dashboard" replace />;
}
