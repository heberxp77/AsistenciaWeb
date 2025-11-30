import { useEffect, useState } from "react";
import { BarChart3, Users, TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db, collection, getDocs } from "@/lib/firebase";
import type { Campus, School, Program, ClassGroup, Student, AttendanceRecord, User } from "@shared/schema";
import { shiftLabels } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface GroupReport {
  id: string;
  name: string;
  programName: string;
  teacherName: string;
  shift: string;
  studentCount: number;
  attendanceRate: number;
  absentCount: number;
  justifiedCount: number;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [groupReports, setGroupReports] = useState<GroupReport[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; asistencia: number }[]>([]);
  const [programData, setProgramData] = useState<{ name: string; asistencia: number; ausencias: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      calculateReports();
    }
  }, [loading, dateRange, records]);

  async function fetchData() {
    try {
      const [
        campusesSnap,
        schoolsSnap,
        programsSnap,
        groupsSnap,
        studentsSnap,
        teachersSnap,
        recordsSnap,
      ] = await Promise.all([
        getDocs(collection(db, "campuses")),
        getDocs(collection(db, "schools")),
        getDocs(collection(db, "programs")),
        getDocs(collection(db, "classGroups")),
        getDocs(collection(db, "students")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "attendanceRecords")),
      ]);

      setCampuses(campusesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Campus[]);
      setSchools(schoolsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as School[]);
      setPrograms(programsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Program[]);
      setGroups(groupsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClassGroup[]);
      setStudents(studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[]);
      setTeachers(teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[]);
      setRecords(recordsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getDateRangeDays() {
    switch (dateRange) {
      case "today": return 1;
      case "week": return 7;
      case "month": return 30;
      default: return 7;
    }
  }

  function calculateReports() {
    const days = getDateRangeDays();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const filteredRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate >= startDate && recordDate <= today;
    });

    const reports = groups.filter((g) => g.active).map((group) => {
      const groupRecords = filteredRecords.filter((r) => r.classGroupId === group.id);
      const program = programs.find((p) => p.id === group.programId);
      const teacher = teachers.find((t) => t.id === group.teacherId);
      const groupStudents = students.filter((s) => s.classGroupId === group.id && s.active);

      const present = groupRecords.filter((r) => r.status === "present").length;
      const absent = groupRecords.filter((r) => r.status === "absent").length;
      const justified = groupRecords.filter((r) => r.status === "justified").length;
      const total = groupRecords.length;
      const rate = total > 0 ? Math.round(((present + justified) / total) * 100) : 0;

      return {
        id: group.id,
        name: group.name,
        programName: program?.name || "—",
        teacherName: teacher?.displayName || "—",
        shift: shiftLabels[group.shift],
        studentCount: groupStudents.length,
        attendanceRate: rate,
        absentCount: absent,
        justifiedCount: justified,
      };
    });

    reports.sort((a, b) => b.attendanceRate - a.attendanceRate);
    setGroupReports(reports);

    const trend: { [date: string]: { present: number; total: number } } = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      trend[dateStr] = { present: 0, total: 0 };
    }

    filteredRecords.forEach((r) => {
      if (trend[r.date]) {
        trend[r.date].total++;
        if (r.status === "present" || r.status === "justified") {
          trend[r.date].present++;
        }
      }
    });

    const trendArray = Object.entries(trend).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      asistencia: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    }));

    setTrendData(trendArray);

    const programStats: { [id: string]: { name: string; present: number; absent: number; total: number } } = {};
    programs.forEach((p) => {
      programStats[p.id] = { name: p.name, present: 0, absent: 0, total: 0 };
    });

    filteredRecords.forEach((r) => {
      const group = groups.find((g) => g.id === r.classGroupId);
      if (group && programStats[group.programId]) {
        programStats[group.programId].total++;
        if (r.status === "present" || r.status === "justified") {
          programStats[group.programId].present++;
        } else {
          programStats[group.programId].absent++;
        }
      }
    });

    const programArray = Object.values(programStats)
      .filter((p) => p.total > 0)
      .map((p) => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
        asistencia: Math.round((p.present / p.total) * 100),
        ausencias: p.absent,
      }))
      .slice(0, 6);

    setProgramData(programArray);
  }

  const overallStats = {
    totalGroups: groupReports.length,
    avgAttendance: groupReports.length > 0
      ? Math.round(groupReports.reduce((acc, g) => acc + g.attendanceRate, 0) / groupReports.length)
      : 0,
    bestGroup: groupReports[0],
    worstGroup: groupReports[groupReports.length - 1],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-reports-title">Reportes</h1>
          <p className="text-muted-foreground mt-1">Análisis detallado de asistencia por grupos</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48" data-testid="select-date-range">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "..." : overallStats.totalGroups}</p>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asistencia Promedio</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "..." : `${overallStats.avgAttendance}%`}</p>
            <Progress value={overallStats.avgAttendance} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mejor Grupo</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading || !overallStats.bestGroup ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              <div>
                <p className="font-medium truncate">{overallStats.bestGroup.name}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {overallStats.bestGroup.attendanceRate}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Grupo a Mejorar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading || !overallStats.worstGroup ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              <div>
                <p className="font-medium truncate">{overallStats.worstGroup.name}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {overallStats.worstGroup.attendanceRate}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Tendencia de Asistencia</CardTitle>
            <CardDescription>Porcentaje de asistencia por día</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-md" />
            ) : trendData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos para mostrar
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="asistencia"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Asistencia por Carrera</CardTitle>
            <CardDescription>Comparativa entre programas académicos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-md" />
            ) : programData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos para mostrar
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={programData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" domain={[0, 100]} className="text-xs" />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="asistencia" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-card-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalle por Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : groupReports.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay grupos activos</p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Grupo</TableHead>
                    <TableHead className="hidden md:table-cell">Carrera</TableHead>
                    <TableHead className="hidden sm:table-cell">Docente</TableHead>
                    <TableHead className="hidden lg:table-cell">Turno</TableHead>
                    <TableHead className="text-center">Estudiantes</TableHead>
                    <TableHead className="text-center">Asistencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupReports.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {group.programName}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {group.teacherName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{group.shift}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{group.studentCount}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={group.attendanceRate} className="w-16" />
                          <span
                            className={
                              group.attendanceRate >= 80
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : group.attendanceRate >= 60
                                ? "text-yellow-600 dark:text-yellow-400 font-medium"
                                : "text-red-600 dark:text-red-400 font-medium"
                            }
                          >
                            {group.attendanceRate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
