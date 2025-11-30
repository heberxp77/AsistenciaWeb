import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Building2, Search, MoreHorizontal } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "@/lib/firebase";
import type { Campus } from "@shared/schema";

export default function CampusManagement() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [deletingCampus, setDeletingCampus] = useState<Campus | null>(null);
  const [formData, setFormData] = useState({ name: "", address: "", active: true });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCampuses();
  }, []);

  async function fetchCampuses() {
    try {
      const querySnapshot = await getDocs(collection(db, "campuses"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Campus[];
      setCampuses(data);
    } catch (error) {
      console.error("Error fetching campuses:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los recintos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredCampuses = campuses.filter(
    (campus) =>
      campus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campus.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (campus?: Campus) => {
    if (campus) {
      setEditingCampus(campus);
      setFormData({ name: campus.name, address: campus.address || "", active: campus.active });
    } else {
      setEditingCampus(null);
      setFormData({ name: "", address: "", active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingCampus) {
        await updateDoc(doc(db, "campuses", editingCampus.id), formData);
        toast({ title: "Éxito", description: "Recinto actualizado correctamente" });
      } else {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, "campuses", newId), { id: newId, ...formData });
        toast({ title: "Éxito", description: "Recinto creado correctamente" });
      }
      setIsDialogOpen(false);
      fetchCampuses();
    } catch (error) {
      console.error("Error saving campus:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el recinto",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCampus) return;

    try {
      await deleteDoc(doc(db, "campuses", deletingCampus.id));
      toast({ title: "Éxito", description: "Recinto eliminado correctamente" });
      setIsDeleteDialogOpen(false);
      setDeletingCampus(null);
      fetchCampuses();
    } catch (error) {
      console.error("Error deleting campus:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el recinto",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-campuses-title">Recintos</h1>
          <p className="text-muted-foreground mt-1">Gestiona los recintos universitarios</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-campus">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Recinto
        </Button>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Lista de Recintos
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recintos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-campus"
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
          ) : filteredCampuses.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron recintos" : "No hay recintos registrados"}
              </p>
              {!searchTerm && (
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar el primer recinto
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">Dirección</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampuses.map((campus) => (
                    <TableRow key={campus.id} data-testid={`row-campus-${campus.id}`}>
                      <TableCell className="font-medium">{campus.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {campus.address || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={campus.active ? "default" : "secondary"}>
                          {campus.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-menu-${campus.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(campus)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingCampus(campus);
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
            <DialogTitle>{editingCampus ? "Editar Recinto" : "Nuevo Recinto"}</DialogTitle>
            <DialogDescription>
              {editingCampus
                ? "Modifica los datos del recinto"
                : "Ingresa los datos del nuevo recinto"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del recinto"
                data-testid="input-campus-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección del recinto"
                data-testid="input-campus-address"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Estado activo</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                data-testid="switch-campus-active"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-campus">
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
              ¿Estás seguro de que deseas eliminar el recinto "{deletingCampus?.name}"? Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="button-confirm-delete">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
