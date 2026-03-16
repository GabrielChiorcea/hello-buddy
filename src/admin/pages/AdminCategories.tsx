/**
 * =============================================================================
 * PAGINA CATEGORII ADMIN - INTEGRAT CU BACKEND
 * =============================================================================
 */

import { useEffect, useState } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { CATEGORY_ICONS, CategoryIconDisplay } from '@/config/categoryIcons';
import { cn } from '@/lib/utils';

interface AdminCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  image?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  productsCount?: number;
}

export default function AdminCategories() {
  const { getCategories, createCategory, updateCategory, deleteCategory } = useAdminApi();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: 'default',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const result = await getCategories();
      setCategories(result.categories || []);
    } catch (error) {
      console.error('Eroare la încărcarea categoriilor:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca categoriile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      displayName: category.displayName,
      description: category.description || '',
      icon: category.icon || 'default',
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', displayName: '', description: '', icon: 'default' });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validare
    if (!formData.name.trim()) {
      toast({ title: 'Eroare', description: 'Identificatorul este obligatoriu', variant: 'destructive' });
      return;
    }
    if (!formData.displayName.trim()) {
      toast({ title: 'Eroare', description: 'Numele afișat este obligatoriu', variant: 'destructive' });
      return;
    }

    // Validare slug (doar litere mici, cifre, underscore)
    if (!/^[a-z0-9_]+$/.test(formData.name)) {
      toast({ 
        title: 'Eroare', 
        description: 'Identificatorul poate conține doar litere mici, cifre și underscore', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSaving(true);

    try {
      const categoryData = {
        name: formData.name.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        description: formData.description.trim() || null,
        icon: formData.icon,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        toast({ title: 'Succes', description: 'Categorie actualizată cu succes' });
      } else {
        await createCategory(categoryData);
        toast({ title: 'Succes', description: 'Categorie creată cu succes' });
      }

      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Eroare la salvare:', error);
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Eroare la salvarea categoriei',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await deleteCategory(deleteConfirm.id);
      toast({ title: 'Succes', description: 'Categorie ștearsă cu succes' });
      setDeleteConfirm(null);
      fetchCategories();
    } catch (error) {
      console.error('Eroare la ștergere:', error);
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Eroare la ștergerea categoriei',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorii</h1>
          <p className="text-muted-foreground">
            Gestionează categoriile de produse
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adaugă categorie
        </Button>
      </div>

      {/* Grid categorii */}
      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nu există categorii. Adaugă prima categorie pentru a începe.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="group relative">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                {/* Icon categorie */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                  <CategoryIconDisplay categoryName={category.name} iconId={category.icon} size={22} className="text-primary" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    {category.displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.productsCount !== undefined 
                      ? `${category.productsCount} produse` 
                      : category.name}
                  </p>
                </div>

                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirm(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog creare/editare */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editează categorie' : 'Adaugă categorie nouă'}
            </DialogTitle>
            <DialogDescription>
              Completează detaliile categoriei
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Identificator (slug) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value.toLowerCase() }))
                }
                placeholder="pizza"
                disabled={!!editingCategory} // Nu permite editare slug pentru categorii existente
              />
              <p className="text-xs text-muted-foreground">
                Folosit intern pentru identificare (fără spații, doar litere mici)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nume afișat *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Pizza"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descrierea categoriei..."
                rows={3}
              />
            </div>

            {/* Selector iconițe */}
            <div className="space-y-2">
              <Label>Iconiță categorie</Label>
              <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors hover:bg-muted',
                      formData.icon === icon.id && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => setFormData((prev) => ({ ...prev, icon: icon.id }))}
                    title={icon.label}
                  >
                    <icon.icon size={18} />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selectează o iconiță pentru această categorie
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                editingCategory ? 'Salvează' : 'Adaugă'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmare ștergere */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmă ștergerea</DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să ștergi categoria "{deleteConfirm?.displayName}"?
              {deleteConfirm && deleteConfirm.productsCount && deleteConfirm.productsCount > 0 && (
                <span className="mt-2 block font-medium text-destructive">
                  Atenție: Această categorie conține {deleteConfirm.productsCount} produse!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se șterge...
                </>
              ) : (
                'Șterge'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
