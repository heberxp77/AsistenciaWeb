import { useEffect, useState } from "react";
import { Search, Filter, Calendar, Users, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { db, collection, getDocs, query, where } from "@/lib/firebase";
import type { Campus, School, Program, ClassGroup, Student, AttendanceRecord, User } from "@shared/schema";
import { shiftLabels, statusLabels, AttendanceStatusType } from "@shared/schema";

interface AttendanceWithDetails extends AttendanceRecord {
  studentName?: string;
  studentMatricula?: string;
  groupName?: string;
  programName?: string;
  teacherName?: string;
}

export default function AttendanceReports() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceWithDetails[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);

  const [filters, setFilters] = useState({
    campusId: "all",
    schoolId: "all",
    programId: "all",
    groupId: "all",
    teacherId: "all",
    shift: "all",
    status: "all",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, allRecords, students, groups, programs, teachers, searchTerm]);

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
        getDocs(query(collection(db, "users"), where("role", "==", "teacher"))),
        getDocs(collection(db, "attendanceRecords")),
      ]);

      setCampuses(campusesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Campus[]);
      setSchools(schoolsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as School[]);
      setPrograms(programsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Program[]);
      setGroups(groupsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClassGroup[]);
      setStudents(studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[]);
      setTeachers(teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[]);
      setAllRecords(recordsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...allRecords];

    if (filters.groupId !== "all") {
      filtered = filtered.filter((r) => r.classGroupId === filters.groupId);
    }

    if (filters.teacherId !== "all") {
      filtered = filtered.filter((r) => r.teacherId === filters.teacherId);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((r) => r.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter((r) => r.date >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter((r) => r.date <= filters.endDate);
    }

    if (filters.shift !== "all") {
      const shiftGroupIds = groups.filter((g) => g.shift === filters.shift).map((g) => g.id);
      filtered = filtered.filter((r) => shiftGroupIds.includes(r.classGroupId));
    }

    if (filters.programId !== "all") {
      const programGroupIds = groups.filter((g) => g.programId === filters.programId).map((g) => g.id);
      filtered = filtered.filter((r) => programGroupIds.includes(r.classGroupId));
    }

    if (filters.schoolId !== "all") {
      const schoolProgramIds = programs.filter((p) => p.schoolId === filters.schoolId).map((p) => p.id);
      const schoolGroupIds = groups.filter((g) => schoolProgramIds.includes(g.programId)).map((g) => g.id);
      filtered = filtered.filter((r) => schoolGroupIds.includes(r.classGroupId));
    }

    if (filters.campusId !== "all") {
      const campusSchoolIds = schools.filter((s) => s.campusId === filters.campusId).map((s) => s.id);
      const campusProgramIds = programs.filter((p) => campusSchoolIds.includes(p.schoolId)).map((p) => p.id);
      const campusGroupIds = groups.filter((g) => campusProgramIds.includes(g.programId)).map((g) => g.id);
      filtered = filtered.filter((r) => campusGroupIds.includes(r.classGroupId));
    }

    const withDetails = filtered.map((record) => {
      const student = students.find((s) => s.id === record.studentId);
      const group = groups.find((g) => g.id === record.classGroupId);
      const program = programs.find((p) => p.id === group?.programId);
      const teacher = teachers.find((t) => t.id === record.teacherId);

      return {
        ...record,
        studentName: student ? `${student.firstName} ${student.lastName}` : "—",
        studentMatricula: student?.studentId,
        groupName: group?.name,
        programName: program?.name,
        teacherName: teacher?.displayName,
      };
    });

    const searchFiltered = searchTerm
      ? withDetails.filter(
          (r) =>
            r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.studentMatricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.groupName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : withDetails;

    searchFiltered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setRecords(searchFiltered.slice(0, 100));
  }

  const getStatusBadge = (status: AttendanceStatusType) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500 hover:bg-green-600">Presente</Badge>;
      case "absent":
        return <Badge variant="destructive">Ausente</Badge>;
      case "justified":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Justificado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredSchools = filters.campusId === "all"
    ? schools
    : schools.filter((s) => s.campusId === filters.campusId);

  const filteredPrograms = filters.schoolId === "all"
    ? programs
    : programs.filter((p) => p.schoolId === filters.schoolId);

  const filteredGroups = filters.programId === "all"
    ? groups
    : groups.filter((g) => g.programId === filters.programId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-reports-title">Consultar Asistencia</h1>
          <p className="text-muted-foreground mt-1">Visualiza el historial de asistencia con filtros avanzados</p>
        </div>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={filters.campusId}
              onValueChange={(value) => setFilters({ ...filters, campusId: value, schoolId: "all", programId: "all", groupId: "all" })}
            >
              <SelectTrigger>
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
              onValueChange={(value) => setFilters({ ...filters, schoolId: value, programId: "all", groupId: "all" })}
            >
              <SelectTrigger>
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
              onValueChange={(value) => setFilters({ ...filters, programId: value, groupId: "all" })}
            >
              <SelectTrigger>
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
              value={filters.groupId}
              onValueChange={(value) => setFilters({ ...filters, groupId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                {filteredGroups.filter((g) => g.active).map((group) => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.teacherId}
              onValueChange={(value) => setFilters({ ...filters, teacherId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Docente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los docentes</SelectItem>
                {teachers.filter((t) => t.active).map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.shift}
              onValueChange={(value) => setFilters({ ...filters, shift: value })}
            >
              <SelectTrigger>
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
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="present">Presente</SelectItem>
                <SelectItem value="absent">Ausente</SelectItem>
                <SelectItem value="justified">Justificado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                placeholder="Desde"
                className="flex-1"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                placeholder="Hasta"
                className="flex-1"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por estudiante, matrícula o grupo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  campusId: "all",
                  schoolId: "all",
                  programId: "all",
                  groupId: "all",
                  teacherId: "all",
                  shift: "all",
                  status: "all",
                  startDate: "",
                  endDate: "",
                })
              }
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registros de Asistencia ({records.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron registros con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead className="hidden md:table-cell">Grupo</TableHead>
                    <TableHead className="hidden lg:table-cell">Docente</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} data-testid={`row-record-${record.id}`}>
                      <TableCell className="font-mono text-sm">
                        {new Date(record.date).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.studentName}</p>
                          <p className="text-xs text-muted-foreground">{record.studentMatricula}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {record.groupName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {record.teacherName}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
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
