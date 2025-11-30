import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Users, ClipboardList, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { db, collection, getDocs, query, where } from "@/lib/firebase";
import type { ClassGroup, Program } from "@shared/schema";
import { shiftLabels } from "@shared/schema";

interface GroupWithDetails extends ClassGroup {
  programName?: string;
  studentCount?: number;
}

export default function TeacherDashboard() {
  const { userData } = useAuth();
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.id) {
      fetchGroups();
    }
  }, [userData?.id]);

  async function fetchGroups() {
    try {
      const [groupsSnap, programsSnap, studentsSnap] = await Promise.all([
        getDocs(query(collection(db, "classGroups"), where("teacherId", "==", userData?.id), where("active", "==", true))),
        getDocs(collection(db, "programs")),
        getDocs(collection(db, "students")),
      ]);

      const programs = programsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Program[];
      const students = studentsSnap.docs.map((doc) => doc.data());

      const groupsWithDetails = groupsSnap.docs.map((doc) => {
        const group = { id: doc.id, ...doc.data() } as ClassGroup;
        const program = programs.find((p) => p.id === group.programId);
        const studentCount = students.filter((s) => s.classGroupId === group.id && s.active).length;

        return {
          ...group,
          programName: program?.name,
          studentCount,
        };
      });

      setGroups(groupsWithDetails);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-teacher-title">
          Hola, {userData?.displayName?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona la asistencia de tus grupos de clase
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mis Grupos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-groups">
              {loading ? "..." : groups.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-students">
              {loading ? "..." : groups.reduce((acc, g) => acc + (g.studentCount || 0), 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fecha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Mis Grupos Activos</h2>
          <Link href="/teacher/attendance">
            <Button variant="outline" size="sm" data-testid="link-take-attendance">
              <ClipboardList className="h-4 w-4 mr-2" />
              Pasar Asistencia
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="border-card-border">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes grupos asignados actualmente</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="border-card-border hover-elevate transition-all" data-testid={`card-group-${group.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>{group.programName}</CardDescription>
                    </div>
                    <Badge variant="outline">{shiftLabels[group.shift]}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estudiantes</span>
                      <span className="font-medium">{group.studentCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Semestre</span>
                      <span className="font-medium">{group.semester} - {group.year}</span>
                    </div>
                    <Link href={`/teacher/attendance?group=${group.id}`}>
                      <Button className="w-full mt-2" variant="secondary" data-testid={`button-attendance-${group.id}`}>
                        Pasar Asistencia
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
