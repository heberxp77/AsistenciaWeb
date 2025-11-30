import { useEffect, useState } from "react";
import { Building2, GraduationCap, BookOpen, Users, UserCheck, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db, collection, getDocs } from "@/lib/firebase";

interface DashboardStats {
  campuses: number;
  schools: number;
  programs: number;
  groups: number;
  teachers: number;
  students: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    campuses: 0,
    schools: 0,
    programs: 0,
    groups: 0,
    teachers: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [campusesSnap, schoolsSnap, programsSnap, groupsSnap, teachersSnap, studentsSnap] = await Promise.all([
          getDocs(collection(db, "campuses")),
          getDocs(collection(db, "schools")),
          getDocs(collection(db, "programs")),
          getDocs(collection(db, "classGroups")),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "students")),
        ]);

        setStats({
          campuses: campusesSnap.size,
          schools: schoolsSnap.size,
          programs: programsSnap.size,
          groups: groupsSnap.size,
          teachers: teachersSnap.docs.filter(doc => doc.data().role === "teacher").length,
          students: studentsSnap.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { title: "Recintos", value: stats.campuses, icon: Building2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Escuelas", value: stats.schools, icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { title: "Carreras", value: stats.programs, icon: BookOpen, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
    { title: "Grupos", value: stats.groups, icon: Users, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
    { title: "Docentes", value: stats.teachers, icon: UserCheck, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-900/30" },
    { title: "Estudiantes", value: stats.students, icon: ClipboardList, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-900/30" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-admin-title">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">Gestiona todos los recursos del sistema de asistencia</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-card-border hover-elevate transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-9 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold" data-testid={`stat-${stat.title.toLowerCase()}`}>
                  {stat.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="/admin/campuses"
                className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate transition-all"
                data-testid="link-quick-campuses"
              >
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium">Agregar Recinto</span>
              </a>
              <a
                href="/admin/schools"
                className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate transition-all"
                data-testid="link-quick-schools"
              >
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-medium">Agregar Escuela</span>
              </a>
              <a
                href="/admin/programs"
                className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate transition-all"
                data-testid="link-quick-programs"
              >
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-medium">Agregar Carrera</span>
              </a>
              <a
                href="/admin/groups"
                className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate transition-all"
                data-testid="link-quick-groups"
              >
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Agregar Grupo</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Estado</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Operativo
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Versión</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Última actualización</span>
              <span>{new Date().toLocaleDateString("es-ES")}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
