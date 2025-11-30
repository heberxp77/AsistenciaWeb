import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, Search, MoreHorizontal, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "@/lib/firebase";
import type { Student, ClassGroup } from "@shared/schema";

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    classGroupId: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [studentsSnap, groupsSnap] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "classGroups")),
      ]);

      setStudents(studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[]);
      setClassGroups(groupsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClassGroup[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const getGroupName = (groupId: string) => {
    return classGroups.find((g) => g.id === groupId)?.name || "—";
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup = filterGroup === "all" || student.classGroupId === filterGroup;

    return matchesSearch && matchesGroup;
  });

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || "",
        phone: student.phone || "",
        classGroupId: student.classGroupId,
        active: student.active,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        studentId: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        classGroupId: "",
        active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.studentId.trim() || !formData.firstName.trim() || !formData.lastName.trim() || !formData.classGroupId) {
      toast({
        title: "Error",
        description: "La matrícula, nombre, apellido y grupo son requeridos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingStudent) {
        await updateDoc(doc(db, "students", editingStudent.id), formData);
        toast({ title: "Éxito", description: "Estudiante actualizado correctamente" });
      } else {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, "students", newId), { id: newId, ...formData });
        toast({ title: "Éxito", description: "Estudiante creado correctamente" });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving student:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el estudiante",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;

    try {
      await deleteDoc(doc(db, "students", deletingStudent.id));
      toast({ title: "Éxito", description: "Estudiante eliminado correctamente" });
      setIsDeleteDialogOpen(false);
      setDeletingStudent(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el estudiante",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-students-title">Estudiantes</h1>
          <p className="text-muted-foreground mt-1">Gestiona los estudiantes inscritos</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-student">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Estudiante
        </Button>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Estudiantes
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, matrícula o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-student"
                />
              </div>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-group">
                  <SelectValue placeholder="Filtrar por grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  {classGroups
                    .filter((g) => g.active)
                    .map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterGroup !== "all"
                  ? "No se encontraron estudiantes"
                  : "No hay estudiantes registrados"}
              </p>
              {!searchTerm && filterGroup === "all" && classGroups.length > 0 && (
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar el primer estudiante
                </Button>
              )}
              {!searchTerm && filterGroup === "all" && classGroups.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Primero debes crear un grupo de clase
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Grupo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                      <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {student.email || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {getGroupName(student.classGroupId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.active ? "default" : "secondary"}>
                          {student.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(student)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingStudent(student);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            <DialogTitle>{editingStudent ? "Editar Estudiante" : "Nuevo Estudiante"}</DialogTitle>
            <DialogDescription>
              {editingStudent
                ? "Modifica los datos del estudiante"
                : "Ingresa los datos del nuevo estudiante"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Matrícula *</Label>
              <Input
                id="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="Ej: 2024001234"
                data-testid="input-student-id"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Nombre"
                  data-testid="input-student-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Apellido"
                  data-testid="input-student-lastname"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                data-testid="input-student-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Número de teléfono"
                data-testid="input-student-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classGroup">Grupo de Clase *</Label>
              <Select
                value={formData.classGroupId}
                onValueChange={(value) => setFormData({ ...formData, classGroupId: value })}
              >
                <SelectTrigger data-testid="select-student-group">
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {classGroups
                    .filter((g) => g.active)
                    .map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Estado activo</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-student">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al estudiante "{deletingStudent?.firstName}{" "}
              {deletingStudent?.lastName}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
