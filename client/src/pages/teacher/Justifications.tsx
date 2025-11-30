import { useEffect, useState, useRef } from "react";
import { FileText, Upload, Search, Check, X, Eye, Download, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  db,
  storage,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  ref,
  uploadBytes,
  getDownloadURL,
} from "@/lib/firebase";
import type { ClassGroup, Student, AttendanceRecord, Justification } from "@shared/schema";

interface JustificationWithDetails extends Justification {
  studentName?: string;
  studentId?: string;
  groupName?: string;
  date?: string;
}

export default function JustificationsPage() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [justifications, setJustifications] = useState<JustificationWithDetails[]>([]);
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingJustification, setViewingJustification] = useState<JustificationWithDetails | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    attendanceRecordId: "",
    studentId: "",
    note: "",
    file: null as File | null,
  });

  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [absentRecords, setAbsentRecords] = useState<(AttendanceRecord & { student?: Student })[]>([]);

  useEffect(() => {
    if (userData?.id) {
      fetchData();
    }
  }, [userData?.id]);

  useEffect(() => {
    filterAbsentRecords();
  }, [selectedGroup, attendanceRecords, students, justifications]);

  async function fetchData() {
    try {
      const [groupsSnap, studentsSnap, recordsSnap, justificationsSnap] = await Promise.all([
        getDocs(query(collection(db, "classGroups"), where("teacherId", "==", userData?.id))),
        getDocs(collection(db, "students")),
        getDocs(query(collection(db, "attendanceRecords"), where("teacherId", "==", userData?.id))),
        getDocs(collection(db, "justifications")),
      ]);

      const groupsData = groupsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClassGroup[];
      const studentsData = studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[];
      const recordsData = recordsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[];
      const justificationsData = justificationsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Justification[];

      setGroups(groupsData);
      setStudents(studentsData);
      setAttendanceRecords(recordsData);

      const justificationsWithDetails = justificationsData.map((j) => {
        const record = recordsData.find((r) => r.id === j.attendanceRecordId);
        const student = studentsData.find((s) => s.id === j.studentId);
        const group = groupsData.find((g) => g.id === record?.classGroupId);

        return {
          ...j,
          studentName: student ? `${student.firstName} ${student.lastName}` : "—",
          studentId: student?.studentId,
          groupName: group?.name,
          date: record?.date,
        };
      });

      setJustifications(justificationsWithDetails);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function filterAbsentRecords() {
    const teacherGroupIds = groups.map((g) => g.id);
    const absentOnly = attendanceRecords.filter((r) => {
      const isAbsent = r.status === "absent";
      const inTeacherGroup = teacherGroupIds.includes(r.classGroupId);
      const matchesFilter = selectedGroup === "all" || r.classGroupId === selectedGroup;
      const hasNoJustification = !justifications.some((j) => j.attendanceRecordId === r.id);
      return isAbsent && inTeacherGroup && matchesFilter && hasNoJustification;
    });

    const withStudentInfo = absentOnly.map((r) => ({
      ...r,
      student: students.find((s) => s.id === r.studentId),
    }));

    setAbsentRecords(withStudentInfo);
  }

  const filteredJustifications = justifications.filter(
    (j) =>
      j.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = () => {
    setFormData({ attendanceRecordId: "", studentId: "", note: "", file: null });
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo no debe superar 5MB",
          variant: "destructive",
        });
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleSave = async () => {
    if (!formData.attendanceRecordId || !formData.note.trim()) {
      toast({
        title: "Error",
        description: "Selecciona un registro de ausencia y agrega una nota",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let documentUrl = "";
      let documentName = "";

      if (formData.file) {
        const fileRef = ref(storage, `justifications/${Date.now()}_${formData.file.name}`);
        await uploadBytes(fileRef, formData.file);
        documentUrl = await getDownloadURL(fileRef);
        documentName = formData.file.name;
      }

      const selectedRecord = absentRecords.find((r) => r.id === formData.attendanceRecordId);
      if (!selectedRecord) throw new Error("Record not found");

      const newId = crypto.randomUUID();
      await setDoc(doc(db, "justifications", newId), {
        id: newId,
        attendanceRecordId: formData.attendanceRecordId,
        studentId: selectedRecord.studentId,
        note: formData.note,
        documentUrl,
        documentName,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, "attendanceRecords", formData.attendanceRecordId), {
        status: "justified",
      });

      toast({ title: "Éxito", description: "Justificación registrada correctamente" });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving justification:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la justificación",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleView = (justification: JustificationWithDetails) => {
    setViewingJustification(justification);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-justifications-title">Justificaciones</h1>
          <p className="text-muted-foreground mt-1">Gestiona las justificaciones de inasistencias</p>
        </div>
        <Button onClick={handleOpenDialog} data-testid="button-add-justification">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Justificación
        </Button>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historial de Justificaciones
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar justificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-justification"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : filteredJustifications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron justificaciones" : "No hay justificaciones registradas"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Estudiante</TableHead>
                    <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                    <TableHead className="hidden md:table-cell">Grupo</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJustifications.map((justification) => (
                    <TableRow key={justification.id} data-testid={`row-justification-${justification.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{justification.studentName}</p>
                          <p className="text-xs text-muted-foreground">{justification.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {justification.date ? new Date(justification.date).toLocaleDateString("es-ES") : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {justification.groupName || "—"}
                      </TableCell>
                      <TableCell>
                        {justification.documentUrl ? (
                          <Badge variant="outline" className="gap-1">
                            <FileText className="h-3 w-3" />
                            Adjunto
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Solo nota</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(justification)}
                          data-testid={`button-view-${justification.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Justificación</DialogTitle>
            <DialogDescription>
              Registra una justificación para una inasistencia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Filtrar por Grupo</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seleccionar Ausencia *</Label>
              <Select
                value={formData.attendanceRecordId}
                onValueChange={(value) => setFormData({ ...formData, attendanceRecordId: value })}
              >
                <SelectTrigger data-testid="select-absence">
                  <SelectValue placeholder="Selecciona una ausencia" />
                </SelectTrigger>
                <SelectContent>
                  {absentRecords.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No hay ausencias sin justificar
                    </SelectItem>
                  ) : (
                    absentRecords.map((record) => (
                      <SelectItem key={record.id} value={record.id}>
                        {record.student?.firstName} {record.student?.lastName} -{" "}
                        {new Date(record.date).toLocaleDateString("es-ES")}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Nota de Justificación *</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Describe el motivo de la inasistencia..."
                rows={3}
                data-testid="textarea-note"
              />
            </div>

            <div className="space-y-2">
              <Label>Documento de Soporte (opcional)</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-file"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {formData.file ? (
                  <p className="text-sm font-medium">{formData.file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Haz clic para subir un archivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG o PDF (máx. 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-justification">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Justificación</DialogTitle>
          </DialogHeader>
          {viewingJustification && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estudiante</p>
                  <p className="font-medium">{viewingJustification.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Matrícula</p>
                  <p className="font-medium">{viewingJustification.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Ausencia</p>
                  <p className="font-medium">
                    {viewingJustification.date
                      ? new Date(viewingJustification.date).toLocaleDateString("es-ES")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grupo</p>
                  <p className="font-medium">{viewingJustification.groupName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nota</p>
                <p className="p-3 bg-muted rounded-md">{viewingJustification.note}</p>
              </div>
              {viewingJustification.documentUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Documento Adjunto</p>
                  <a
                    href={viewingJustification.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    {viewingJustification.documentName || "Ver documento"}
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
