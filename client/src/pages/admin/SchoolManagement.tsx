import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap, Search, MoreHorizontal } from "lucide-react";
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
import type { School, Campus } from "@shared/schema";

export default function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({ name: "", campusId: "", active: true });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [schoolsSnap, campusesSnap] = await Promise.all([
        getDocs(collection(db, "schools")),
        getDocs(collection(db, "campuses")),
      ]);

      setSchools(schoolsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as School[]);
      setCampuses(campusesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Campus[]);
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

  const getCampusName = (campusId: string) => {
    return campuses.find((c) => c.id === campusId)?.name || "—";
  };

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCampusName(school.campusId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (school?: School) => {
    if (school) {
      setEditingSchool(school);
      setFormData({ name: school.name, campusId: school.campusId, active: school.active });
    } else {
      setEditingSchool(null);
      setFormData({ name: "", campusId: "", active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.campusId) {
      toast({
        title: "Error",
        description: "El nombre y el recinto son requeridos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingSchool) {
        await updateDoc(doc(db, "schools", editingSchool.id), formData);
        toast({ title: "Éxito", description: "Escuela actualizada correctamente" });
      } else {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, "schools", newId), { id: newId, ...formData });
        toast({ title: "Éxito", description: "Escuela creada correctamente" });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving school:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la escuela",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSchool) return;

    try {
      await deleteDoc(doc(db, "schools", deletingSchool.id));
      toast({ title: "Éxito", description: "Escuela eliminada correctamente" });
      setIsDeleteDialogOpen(false);
      setDeletingSchool(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting school:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la escuela",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-schools-title">Escuelas</h1>
          <p className="text-muted-foreground mt-1">Gestiona las escuelas de la universidad</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-school">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Escuela
        </Button>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Lista de Escuelas
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar escuelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-school"
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
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron escuelas" : "No hay escuelas registradas"}
              </p>
              {!searchTerm && campuses.length > 0 && (
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar la primera escuela
                </Button>
              )}
              {!searchTerm && campuses.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Primero debes crear un recinto
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Recinto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.map((school) => (
                    <TableRow key={school.id} data-testid={`row-school-${school.id}`}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {getCampusName(school.campusId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={school.active ? "default" : "secondary"}>
                          {school.active ? "Activo" : "Inactivo"}
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(school)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingSchool(school);
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
            <DialogTitle>{editingSchool ? "Editar Escuela" : "Nueva Escuela"}</DialogTitle>
            <DialogDescription>
              {editingSchool
                ? "Modifica los datos de la escuela"
                : "Ingresa los datos de la nueva escuela"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la escuela"
                data-testid="input-school-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campus">Recinto *</Label>
              <Select
                value={formData.campusId}
                onValueChange={(value) => setFormData({ ...formData, campusId: value })}
              >
                <SelectTrigger data-testid="select-school-campus">
                  <SelectValue placeholder="Selecciona un recinto" />
                </SelectTrigger>
                <SelectContent>
                  {campuses
                    .filter((c) => c.active)
                    .map((campus) => (
                      <SelectItem key={campus.id} value={campus.id}>
                        {campus.name}
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
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-school">
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
              ¿Estás seguro de que deseas eliminar la escuela "{deletingSchool?.name}"? Esta acción
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
