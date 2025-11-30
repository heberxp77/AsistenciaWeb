import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { logOut } from "@/lib/firebase";
import { roleLabels } from "@shared/schema";

const adminMenuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Recintos", url: "/admin/campuses", icon: Building2 },
  { title: "Escuelas", url: "/admin/schools", icon: GraduationCap },
  { title: "Carreras", url: "/admin/programs", icon: BookOpen },
  { title: "Grupos", url: "/admin/groups", icon: Users },
  { title: "Docentes", url: "/admin/teachers", icon: UserCheck },
  { title: "Estudiantes", url: "/admin/students", icon: Users },
];

const teacherMenuItems = [
  { title: "Mis Grupos", url: "/teacher", icon: Users },
  { title: "Pasar Asistencia", url: "/teacher/attendance", icon: ClipboardList },
  { title: "Justificaciones", url: "/teacher/justifications", icon: FileText },
];

const managerMenuItems = [
  { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
  { title: "Reportes", url: "/manager/reports", icon: BarChart3 },
  { title: "Consultar Asistencia", url: "/manager/attendance", icon: ClipboardList },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { userData, isAdmin, isTeacher, isAreaManager } = useAuth();

  const menuItems = isAdmin
    ? adminMenuItems
    : isTeacher
    ? teacherMenuItems
    : isAreaManager
    ? managerMenuItems
    : [];

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            UA
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Universidad</span>
            <span className="text-xs text-muted-foreground">Sistema de Asistencia</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">
            <div className="flex items-center gap-2">
              <span>Navegación</span>
              {userData && (
                <Badge variant="secondary" className="text-xs">
                  {roleLabels[userData.role]}
                </Badge>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.url.replace(/\//g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {userData && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userData.photoURL} alt={userData.displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(userData.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{userData.displayName}</span>
              <span className="text-xs text-muted-foreground truncate">{userData.email}</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
