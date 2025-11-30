import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, Search, MoreHorizontal } from "lucide-react";
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
import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from "@/lib/firebase";
import type { ClassGroup, Program, User, ShiftType } from "@shared/schema";
import { shiftLabels } from "@shared/schema";

export default function GroupManagement() {
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ClassGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<ClassGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    programId: "",
    teacherId: "",
    shift: "morning" as ShiftType,
    semester: "",
    year: new Date().getFullYear(),
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [groupsSnap, programsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "classGroups")),
        getDocs(collection(db, "programs")),
        getDocs(query(collection(db, "users"), where("role", "==", "teacher"))),
      ]);

      setGroups(groupsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClassGroup[]);
      setPrograms(programsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Program[]);
      setTeachers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[]);
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

  const getProgramName = (programId: string) => {
    return programs.find((p) => p.id === programId)?.name || "—";
  };

  const getTeacherName = (teacherId: string) => {
    return teachers.find((t) => t.id === teacherId)?.displayName || "—";
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProgramName(group.programId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTeacherName(group.teacherId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (group?: ClassGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        programId: group.programId,
        teacherId: group.teacherId,
        shift: group.shift,
        semester: group.semester,
        year: group.year,
        active: group.active,
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: "",
        programId: "",
        teacherId: "",
        shift: "morning",
        semester: "",
        year: new Date().getFullYear(),
        active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.programId || !formData.teacherId || !formData.semester) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingGroup) {
        await updateDoc(doc(db, "classGroups", editingGroup.id), formData);
        toast({ title: "Éxito", description: "Grupo actualizado correctamente" });
      } else {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, "classGroups", newId), { id: newId, ...formData });
        toast({ title: "Éxito", description: "Grupo creado correctamente" });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving group:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el grupo",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;

    try {
      await deleteDoc(doc(db, "classGroups", deletingGroup.id));
      toast({ title: "Éxito", description: "Grupo eliminado correctamente" });
      setIsDeleteDialogOpen(false);
      setDeletingGroup(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-groups-title">Grupos de Clase</h1>
          <p className="text-muted-foreground mt-1">Gestiona los grupos de clase</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-group">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Grupo
        </Button>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Grupos
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-group"
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
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron grupos" : "No hay grupos registrados"}
              </p>
              {!searchTerm && programs.length > 0 && teachers.length > 0 && (
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar el primer grupo
                </Button>
              )}
              {!searchTerm && (programs.length === 0 || teachers.length === 0) && (
                <p className="text-sm text-muted-foreground mt-2">
                  Primero debes crear carreras y docentes
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Carrera</TableHead>
                    <TableHead className="hidden sm:table-cell">Docente</TableHead>
                    <TableHead className="hidden lg:table-cell">Turno</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group) => (
                    <TableRow key={group.id} data-testid={`row-group-${group.id}`}>
                      <TableCell className="font-medium">
                        <div>
                          {group.name}
                          <span className="text-xs text-muted-foreground ml-2">
                            {group.semester} - {group.year}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {getProgramName(group.programId)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {getTeacherName(group.teacherId)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{shiftLabels[group.shift]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.active ? "default" : "secondary"}>
                          {group.active ? "Activo" : "Inactivo"}
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(group)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingGroup(group);
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
            <DialogTitle>{editingGroup ? "Editar Grupo" : "Nuevo Grupo"}</DialogTitle>
            <DialogDescription>
              {editingGroup
                ? "Modifica los datos del grupo"
                : "Ingresa los datos del nuevo grupo de clase"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Grupo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Grupo A, Sección 01"
                data-testid="input-group-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semestre *</Label>
                <Input
                  id="semester"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder="Ej: 1er Semestre"
                  data-testid="input-group-semester"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Año *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  data-testid="input-group-year"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Carrera *</Label>
              <Select
                value={formData.programId}
                onValueChange={(value) => setFormData({ ...formData, programId: value })}
              >
                <SelectTrigger data-testid="select-group-program">
                  <SelectValue placeholder="Selecciona una carrera" />
                </SelectTrigger>
                <SelectContent>
                  {programs
                    .filter((p) => p.active)
                    .map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Docente *</Label>
              <Select
                value={formData.teacherId}
                onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
              >
                <SelectTrigger data-testid="select-group-teacher">
                  <SelectValue placeholder="Selecciona un docente" />
                </SelectTrigger>
                <SelectContent>
                  {teachers
                    .filter((t) => t.active)
                    .map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift">Turno *</Label>
              <Select
                value={formData.shift}
                onValueChange={(value) => setFormData({ ...formData, shift: value as ShiftType })}
              >
                <SelectTrigger data-testid="select-group-shift">
                  <SelectValue placeholder="Selecciona un turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Matutino</SelectItem>
                  <SelectItem value="afternoon">Vespertino</SelectItem>
                  <SelectItem value="evening">Nocturno</SelectItem>
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
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-group">
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
              ¿Estás seguro de que deseas eliminar el grupo "{deletingGroup?.name}"? Esta acción no
              se puede deshacer.
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
