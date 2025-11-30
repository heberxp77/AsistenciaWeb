import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, Search, MoreHorizontal } from "lucide-react";
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
import type { Program, School } from "@shared/schema";

export default function ProgramManagement() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", schoolId: "", active: true });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [programsSnap, schoolsSnap] = await Promise.all([
        getDocs(collection(db, "programs")),
        getDocs(collection(db, "schools")),
      ]);

      setPrograms(programsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Program[]);
      setSchools(schoolsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as School[]);
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

  const getSchoolName = (schoolId: string) => {
    return schools.find((s) => s.id === schoolId)?.name || "—";
  };

  const filteredPrograms = programs.filter(
    (program) =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSchoolName(program.schoolId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        name: program.name,
        code: program.code,
        schoolId: program.schoolId,
        active: program.active,
      });
    } else {
      setEditingProgram(null);
      setFormData({ name: "", code: "", schoolId: "", active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim() || !formData.schoolId) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingProgram) {
        await updateDoc(doc(db, "programs", editingProgram.id), formData);
        toast({ title: "Éxito", description: "Carrera actualizada correctamente" });
      } else {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, "programs", newId), { id: newId, ...formData });
        toast({ title: "Éxito", description: "Carrera creada correctamente" });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving program:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la carrera",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProgram) return;

    try {
      await deleteDoc(doc(db, "programs", deletingProgram.id));
      toast({ title: "Éxito", description: "Carrera eliminada correctamente" });
      setIsDeleteDialogOpen(false);
      setDeletingProgram(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting program:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la carrera",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-programs-title">Carreras</h1>
          <p className="text-muted-foreground mt-1">Gestiona las carreras universitarias</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-program">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Carrera
        </Button>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lista de Carreras
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar carreras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-program"
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
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron carreras" : "No hay carreras registradas"}
              </p>
              {!searchTerm && schools.length > 0 && (
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar la primera carrera
                </Button>
              )}
              {!searchTerm && schools.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Primero debes crear una escuela
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">Escuela</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrograms.map((program) => (
                    <TableRow key={program.id} data-testid={`row-program-${program.id}`}>
                      <TableCell className="font-mono text-sm">{program.code}</TableCell>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {getSchoolName(program.schoolId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={program.active ? "default" : "secondary"}>
                          {program.active ? "Activo" : "Inactivo"}
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(program)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingProgram(program);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProgram ? "Editar Carrera" : "Nueva Carrera"}</DialogTitle>
            <DialogDescription>
              {editingProgram
                ? "Modifica los datos de la carrera"
                : "Ingresa los datos de la nueva carrera"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ej: ING-SIS"
                data-testid="input-program-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la carrera"
                data-testid="input-program-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">Escuela *</Label>
              <Select
                value={formData.schoolId}
                onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
              >
                <SelectTrigger data-testid="select-program-school">
                  <SelectValue placeholder="Selecciona una escuela" />
                </SelectTrigger>
                <SelectContent>
                  {schools
                    .filter((s) => s.active)
                    .map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
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
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-program">
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
              ¿Estás seguro de que deseas eliminar la carrera "{deletingProgram?.name}"? Esta acción
              no se puede deshacer.
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
