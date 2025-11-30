import { useEffect, useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { Check, X, FileText, Save, Users, Calendar, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db, collection, getDocs, doc, setDoc, query, where, writeBatch } from "@/lib/firebase";
import type { ClassGroup, Student, AttendanceRecord, AttendanceStatusType } from "@shared/schema";
import { shiftLabels, statusLabels } from "@shared/schema";

interface StudentAttendance extends Student {
  status: AttendanceStatusType;
}

export default function TakeAttendance() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const preselectedGroup = searchParams.get("group");

  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(preselectedGroup || "");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userData?.id) {
      fetchGroups();
    }
  }, [userData?.id]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchStudentsAndRecords();
    }
  }, [selectedGroupId, selectedDate]);

  async function fetchGroups() {
    try {
      const groupsSnap = await getDocs(
        query(
          collection(db, "classGroups"),
          where("teacherId", "==", userData?.id),
          where("active", "==", true)
        )
      );
      const data = groupsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClassGroup[];
      setGroups(data);

      if (preselectedGroup && data.some((g) => g.id === preselectedGroup)) {
        setSelectedGroupId(preselectedGroup);
      } else if (data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudentsAndRecords() {
    try {
      const [studentsSnap, recordsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "students"),
            where("classGroupId", "==", selectedGroupId),
            where("active", "==", true)
          )
        ),
        getDocs(
          query(
            collection(db, "attendanceRecords"),
            where("classGroupId", "==", selectedGroupId),
            where("date", "==", selectedDate)
          )
        ),
      ]);

      const records = recordsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AttendanceRecord[];

      setExistingRecords(records);

      const studentsWithAttendance = studentsSnap.docs.map((doc) => {
        const student = { id: doc.id, ...doc.data() } as Student;
        const existingRecord = records.find((r) => r.studentId === student.id);
        return {
          ...student,
          status: existingRecord?.status || ("present" as AttendanceStatusType),
        };
      });

      studentsWithAttendance.sort((a, b) => a.lastName.localeCompare(b.lastName));
      setStudents(studentsWithAttendance);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId);
  }, [groups, selectedGroupId]);

  const stats = useMemo(() => {
    const present = students.filter((s) => s.status === "present").length;
    const absent = students.filter((s) => s.status === "absent").length;
    const justified = students.filter((s) => s.status === "justified").length;
    const total = students.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, justified, total, percentage };
  }, [students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatusType) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const handleMarkAll = (status: AttendanceStatusType) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!selectedGroupId || !userData?.id) return;

    setSaving(true);
    try {
      const batch = writeBatch(db);

      for (const student of students) {
        const existingRecord = existingRecords.find((r) => r.studentId === student.id);

        if (existingRecord) {
          batch.update(doc(db, "attendanceRecords", existingRecord.id), {
            status: student.status,
          });
        } else {
          const newId = crypto.randomUUID();
          batch.set(doc(db, "attendanceRecords", newId), {
            id: newId,
            studentId: student.id,
            classGroupId: selectedGroupId,
            date: selectedDate,
            status: student.status,
            teacherId: userData.id,
            createdAt: new Date().toISOString(),
          });
        }
      }

      await batch.commit();

      toast({
        title: "Asistencia guardada",
        description: `Se registró la asistencia de ${students.length} estudiantes`,
      });

      fetchStudentsAndRecords();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la asistencia",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getStatusColor = (status: AttendanceStatusType) => {
    switch (status) {
      case "present":
        return "bg-green-500";
      case "absent":
        return "bg-red-500";
      case "justified":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-muted animate-pulse rounded-md" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Pasar Asistencia</h1>
        <Card className="border-card-border">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tienes grupos asignados actualmente</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-attendance-title">Pasar Asistencia</h1>
          <p className="text-muted-foreground mt-1">Registra la asistencia de tus estudiantes</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger className="w-full sm:w-64" data-testid="select-group">
            <SelectValue placeholder="Selecciona un grupo" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name} - {shiftLabels[group.shift]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            data-testid="input-date"
          />
        </div>
      </div>

      {selectedGroup && (
        <>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="border-card-border">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</div>
                <p className="text-xs text-muted-foreground">Presentes</p>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</div>
                <p className="text-xs text-muted-foreground">Ausentes</p>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.justified}</div>
                <p className="text-xs text-muted-foreground">Justificados</p>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold">{stats.percentage}%</div>
                <p className="text-xs text-muted-foreground">Asistencia</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-card-border">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{selectedGroup.name}</CardTitle>
                  <CardDescription>
                    {selectedGroup.semester} - {selectedGroup.year} | {students.length} estudiantes
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll("present")}
                    data-testid="button-mark-all-present"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Todos Presentes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll("absent")}
                    data-testid="button-mark-all-absent"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Todos Ausentes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay estudiantes en este grupo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      data-testid={`row-student-${student.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(student.firstName, student.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {student.lastName}, {student.firstName}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.studentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={student.status === "present" ? "default" : "outline"}
                          size="sm"
                          className={student.status === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={() => handleStatusChange(student.id, "present")}
                          data-testid={`button-present-${student.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={student.status === "absent" ? "default" : "outline"}
                          size="sm"
                          className={student.status === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                          onClick={() => handleStatusChange(student.id, "absent")}
                          data-testid={`button-absent-${student.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={student.status === "justified" ? "default" : "outline"}
                          size="sm"
                          className={student.status === "justified" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                          onClick={() => handleStatusChange(student.id, "justified")}
                          data-testid={`button-justified-${student.id}`}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {students.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg" data-testid="button-save-attendance">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Asistencia"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
