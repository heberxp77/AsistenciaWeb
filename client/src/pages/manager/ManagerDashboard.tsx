import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, FileText, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db, collection, getDocs, query, where } from "@/lib/firebase";
import type { Campus, School, Program, ClassGroup, Student, AttendanceRecord } from "@shared/schema";
import { shiftLabels, ShiftType } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface FilterState {
  campusId: string;
  schoolId: string;
  programId: string;
  shift: string;
  dateRange: string;
}

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    campusId: "all",
    schoolId: "all",
    programId: "all",
    shift: "all",
    dateRange: "today",
  });

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [stats, setStats] = useState({
    totalStudents: 0,
    present: 0,
    absent: 0,
    justified: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [filters, records, students, groups]);

  async function fetchData() {
    try {
      const [campusesSnap, schoolsSnap, programsSnap, groupsSnap, studentsSnap, recordsSnap] = await Promise.all([
        getDocs(collection(db, "campuses")),
        getDocs(collection(db, "schools")),
        getDocs(collection(db, "programs")),
        getDocs(collection(db, "classGroups")),
        getDocs(collection(db, "students")),
        getDocs(collection(db, "attendanceRecords")),
      ]);

      setCampuses(campusesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Campus[]);
      setSchools(schoolsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as School[]);
      setPrograms(programsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Program[]);
      setGroups(groupsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClassGroup[]);
      setStudents(studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[]);
      setRecords(recordsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getDateRange() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filters.dateRange) {
      case "today":
        return { start: today, end: today };
      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: today };
      }
      case "month": {
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return { start: monthStart, end: today };
      }
      default:
        return { start: today, end: today };
    }
  }

  function calculateStats() {
    let filteredGroups = [...groups];

    if (filters.programId !== "all") {
      filteredGroups = filteredGroups.filter((g) => g.programId === filters.programId);
    }

    if (filters.shift !== "all") {
      filteredGroups = filteredGroups.filter((g) => g.shift === filters.shift);
    }

    if (filters.schoolId !== "all") {
      const programIds = programs.filter((p) => p.schoolId === filters.schoolId).map((p) => p.id);
      filteredGroups = filteredGroups.filter((g) => programIds.includes(g.programId));
    }

    if (filters.campusId !== "all") {
      const schoolIds = schools.filter((s) => s.campusId === filters.campusId).map((s) => s.id);
      const programIds = programs.filter((p) => schoolIds.includes(p.schoolId)).map((p) => p.id);
      filteredGroups = filteredGroups.filter((g) => programIds.includes(g.programId));
    }

    const groupIds = filteredGroups.map((g) => g.id);
    const filteredStudents = students.filter((s) => groupIds.includes(s.classGroupId) && s.active);

    const { start, end } = getDateRange();
    const filteredRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      return groupIds.includes(r.classGroupId) && recordDate >= start && recordDate <= end;
    });

    const present = filteredRecords.filter((r) => r.status === "present").length;
    const absent = filteredRecords.filter((r) => r.status === "absent").length;
    const justified = filteredRecords.filter((r) => r.status === "justified").length;
    const total = filteredRecords.length;
    const attendanceRate = total > 0 ? Math.round(((present + justified) / total) * 100) : 0;

    setStats({
      totalStudents: filteredStudents.length,
      present,
      absent,
      justified,
      attendanceRate,
    });
  }

  const filteredSchools = filters.campusId === "all"
    ? schools
    : schools.filter((s) => s.campusId === filters.campusId);

  const filteredPrograms = filters.schoolId === "all"
    ? programs
    : programs.filter((p) => p.schoolId === filters.schoolId);

  const pieData = [
    { name: "Presentes", value: stats.present, color: "#22c55e" },
    { name: "Ausentes", value: stats.absent, color: "#ef4444" },
    { name: "Justificados", value: stats.justified, color: "#eab308" },
  ].filter((d) => d.value > 0);

  const shiftData = Object.entries(shiftLabels).map(([key, label]) => {
    const shiftGroups = groups.filter((g) => g.shift === key);
    const shiftGroupIds = shiftGroups.map((g) => g.id);
    const shiftRecords = records.filter((r) => shiftGroupIds.includes(r.classGroupId));
    const present = shiftRecords.filter((r) => r.status === "present").length;
    const total = shiftRecords.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { name: label, asistencia: rate };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-manager-title">Dashboard de Asistencia</h1>
        <p className="text-muted-foreground mt-1">Visualiza las estadísticas de asistencia</p>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Select
              value={filters.campusId}
              onValueChange={(value) => setFilters({ ...filters, campusId: value, schoolId: "all", programId: "all" })}
            >
              <SelectTrigger data-testid="filter-campus">
                <SelectValue placeholder="Recinto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los recintos</SelectItem>
                {campuses.filter((c) => c.active).map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>{campus.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.schoolId}
              onValueChange={(value) => setFilters({ ...filters, schoolId: value, programId: "all" })}
            >
              <SelectTrigger data-testid="filter-school">
                <SelectValue placeholder="Escuela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las escuelas</SelectItem>
                {filteredSchools.filter((s) => s.active).map((school) => (
                  <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.programId}
              onValueChange={(value) => setFilters({ ...filters, programId: value })}
            >
              <SelectTrigger data-testid="filter-program">
                <SelectValue placeholder="Carrera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las carreras</SelectItem>
                {filteredPrograms.filter((p) => p.active).map((program) => (
                  <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.shift}
              onValueChange={(value) => setFilters({ ...filters, shift: value })}
            >
              <SelectTrigger data-testid="filter-shift">
                <SelectValue placeholder="Turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los turnos</SelectItem>
                <SelectItem value="morning">Matutino</SelectItem>
                <SelectItem value="afternoon">Vespertino</SelectItem>
                <SelectItem value="evening">Nocturno</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
            >
              <SelectTrigger data-testid="filter-date">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-total">{loading ? "..." : stats.totalStudents}</p>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presentes</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="stat-present">
              {loading ? "..." : stats.present}
            </p>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausentes</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400" data-testid="stat-absent">
              {loading ? "..." : stats.absent}
            </p>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Asistencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-rate">{loading ? "..." : `${stats.attendanceRate}%`}</p>
            <Progress value={stats.attendanceRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-md" />
            ) : pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos para mostrar
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Asistencia por Turno</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-md" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shiftData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="asistencia" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
