import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import CampusManagement from "@/pages/admin/CampusManagement";
import SchoolManagement from "@/pages/admin/SchoolManagement";
import ProgramManagement from "@/pages/admin/ProgramManagement";
import GroupManagement from "@/pages/admin/GroupManagement";
import TeacherManagement from "@/pages/admin/TeacherManagement";
import StudentManagement from "@/pages/admin/StudentManagement";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TakeAttendance from "@/pages/teacher/TakeAttendance";
import Justifications from "@/pages/teacher/Justifications";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import Reports from "@/pages/manager/Reports";
import AttendanceReports from "@/pages/manager/AttendanceReports";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { currentUser, userData, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !userData) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    if (userData.role === "admin") {
      return <Redirect to="/admin" />;
    } else if (userData.role === "teacher") {
      return <Redirect to="/teacher" />;
    } else if (userData.role === "area_manager") {
      return <Redirect to="/manager" />;
    }
  }

  return <>{children}</>;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-2 border-b border-border h-14 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/">
        <ProtectedRoute>
          <RootRedirect />
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <AdminDashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/campuses">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <CampusManagement />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/schools">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <SchoolManagement />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/programs">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <ProgramManagement />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/groups">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <GroupManagement />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/teachers">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <TeacherManagement />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/students">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AuthenticatedLayout>
            <StudentManagement />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <AuthenticatedLayout>
            <TeacherDashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/attendance">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <AuthenticatedLayout>
            <TakeAttendance />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/justifications">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <AuthenticatedLayout>
            <Justifications />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/manager">
        <ProtectedRoute allowedRoles={["area_manager"]}>
          <AuthenticatedLayout>
            <ManagerDashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/manager/reports">
        <ProtectedRoute allowedRoles={["area_manager"]}>
          <AuthenticatedLayout>
            <Reports />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/manager/attendance">
        <ProtectedRoute allowedRoles={["area_manager"]}>
          <AuthenticatedLayout>
            <AttendanceReports />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function RootRedirect() {
  const { userData } = useAuth();

  if (userData?.role === "admin") {
    return <Redirect to="/admin" />;
  } else if (userData?.role === "teacher") {
    return <Redirect to="/teacher" />;
  } else if (userData?.role === "area_manager") {
    return <Redirect to="/manager" />;
  }

  return <Redirect to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
