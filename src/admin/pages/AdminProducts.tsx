/**
 * =============================================================================
 * PAGINA PRODUSE ADMIN - INTEGRAT CU BACKEND
 * =============================================================================
 */

import { useEffect, useState, useRef } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { DataTable, Column } from '@/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, Upload, X, Loader2 } from 'lucide-react';
import { Pagination } from '@/types/admin';
import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';

interface ProductIngredient {
  id?: number;
  name: string;
  isAllergen: boolean;
}

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  categoryName?: string;
  isAvailable: boolean;
  isAddon?: boolean;
  rating: number;
  reviewsCount: number;
  preparationTime: number;
  ingredients?: ProductIngredient[];
}

interface Category {
  id: string;
  name: string;
  displayName: string;
}

export default function AdminProducts() {
  const { getProducts, getCategories, createProduct, updateProduct, deleteProduct } = useAdminApi();
  const { enabled: addonsPluginEnabled } = usePluginEnabled('addons');
  
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilterId, setCategoryFilterId] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
    isAddon: false,
    preparationTime: '',
    image: '',
    ingredients: '',  // Text liber pentru ingrediente
    allergens: '',    // Text liber pentru alergeni (opțional)
  });

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.limit, search, categoryFilterId]);

  const fetchCategories = async () => {
    try {
      const result = await getCategories();
      setCategories(result.categories || []);
    } catch (error) {
      console.error('Eroare la încărcarea categoriilor:', error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (search) params.append('search', search);
      if (categoryFilterId) params.append('categoryId', categoryFilterId);

      const result = await getProducts(params.toString());
      setProducts(result.products || []);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total || 0,
        pages: result.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Eroare la încărcarea produselor:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca produsele',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    // Parsează ingredientele existente
    const ingredientsList = product.ingredients || [];
    const regularIngredients = ingredientsList
      .filter(i => !i.isAllergen)
      .map(i => i.name)
      .join(', ');
    const allergensList = ingredientsList
      .filter(i => i.isAllergen)
      .map(i => i.name)
      .join(', ');
    
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: product.categoryId,
      isAvailable: product.isAvailable,
      isAddon: product.isAddon ?? false,
      preparationTime: String(product.preparationTime || ''),
      image: product.image || '',
      ingredients: regularIngredients,
      allergens: allergensList,
    });
    setImagePreview(product.image || null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: categories[0]?.id || '',
      isAvailable: true,
      isAddon: false,
      preparationTime: '30',
      image: '',
      ingredients: '',
      allergens: '',
    });
    setImagePreview(null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Eroare',
          description: 'Imaginea trebuie să fie mai mică de 5MB',
          variant: 'destructive',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validare
    if (!formData.name.trim()) {
      toast({ title: 'Eroare', description: 'Numele este obligatoriu', variant: 'destructive' });
      return;
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      toast({ title: 'Eroare', description: 'Prețul trebuie să fie un număr valid', variant: 'destructive' });
      return;
    }
    if (!formData.categoryId) {
      toast({ title: 'Eroare', description: 'Selectează o categorie', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      // Parsează ingredientele din text
      const parseIngredients = (text: string, isAllergen: boolean) => {
        return text
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(name => ({ name, isAllergen }));
      };
      
      const regularIngredients = parseIngredients(formData.ingredients, false);
      const allergenIngredients = parseIngredients(formData.allergens, true);
      const allIngredients = [...regularIngredients, ...allergenIngredients];
      
      // Pregătește datele - folosește URL imagine existent sau base64 preview
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        isAvailable: formData.isAvailable,
        isAddon: formData.isAddon,
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : 30,
        image: imagePreview || formData.image || '/placeholder.svg',
        ingredients: allIngredients.length > 0 ? allIngredients : undefined,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast({ title: 'Succes', description: 'Produs actualizat cu succes' });
      } else {
        await createProduct(productData);
        toast({ title: 'Succes', description: 'Produs creat cu succes' });
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Eroare la salvare:', error);
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Eroare la salvarea produsului',
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
      const result = await deleteProduct(deleteConfirm.id);
      toast({
        title: 'Succes',
        description: result.softDeleted ? result.message : 'Produs șters cu succes',
      });
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      console.error('Eroare la ștergere:', error);
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Eroare la ștergerea produsului',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.displayName || categoryId;
  };

  const columns: Column<AdminProduct>[] = [
    {
      key: 'image',
      header: 'Imagine',
      className: 'w-16',
      cell: (product) => (
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="h-10 w-10 rounded-md object-cover"
        />
      ),
    },
    {
      key: 'name',
      header: 'Nume',
      cell: (product) => (
        <div>
          <p className="font-medium text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {product.description}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categorie',
      cell: (product) => (
        <Badge variant="outline">
          {product.categoryName || getCategoryName(product.categoryId)}
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'Preț',
      cell: (product) => (
        <span className="font-medium">{product.price} RON</span>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      cell: (product) => (
        <span className="text-muted-foreground">
          {product.rating ? `${product.rating.toFixed(1)} ⭐` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (product) => (
        <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
          {product.isAvailable ? 'Disponibil' : 'Indisponibil'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(product)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editează
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm(product)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Șterge
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produse</h1>
          <p className="text-muted-foreground">
            Gestionează produsele din meniu
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adaugă produs
        </Button>
      </div>

      {/* Filtru categorie */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="category-filter" className="text-muted-foreground whitespace-nowrap">
            Categorie
          </Label>
          <Select
            value={categoryFilterId || 'all'}
            onValueChange={(value) => {
              setCategoryFilterId(value === 'all' ? '' : value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger id="category-filter" className="w-[200px]">
              <SelectValue placeholder="Toate categoriile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate categoriile</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        searchPlaceholder="Caută produse..."
        searchValue={search}
        onSearchChange={setSearch}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) =>
          setPagination((prev) => ({ ...prev, limit, page: 1 }))
        }
        emptyMessage="Nu există produse"
      />

      {/* Dialog creare/editare */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editează produs' : 'Adaugă produs nou'}
            </DialogTitle>
            <DialogDescription>
              Completează detaliile produsului
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload imagine */}
            <div className="space-y-2">
              <Label>Imagine produs</Label>
              <div className="flex items-center gap-4">
                <div 
                  className="relative h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={getImageUrl(imagePreview)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setImageFile(null);
                          setFormData(prev => ({ ...prev, image: '' }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Click pentru a încărca o imagine.<br />
                  Max 5MB, format JPG, PNG sau WebP
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nume *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Pizza Margherita"
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
                placeholder="Descrierea produsului..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preț (RON) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="32.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categorie *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selectează..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prepTime">Timp preparare (minute)</Label>
              <Input
                id="prepTime"
                type="number"
                min="1"
                value={formData.preparationTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preparationTime: e.target.value,
                  }))
                }
                placeholder="25"
              />
            </div>

            {/* Ingrediente */}
            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingrediente</Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ingredients: e.target.value,
                  }))
                }
                placeholder="Făină, mozzarella, roșii, busuioc..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Separă ingredientele prin virgulă
              </p>
            </div>

            {/* Alergeni */}
            <div className="space-y-2">
              <Label htmlFor="allergens">Alergeni (opțional)</Label>
              <Input
                id="allergens"
                value={formData.allergens}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    allergens: e.target.value,
                  }))
                }
                placeholder="Gluten, lactate, ouă..."
              />
              <p className="text-xs text-muted-foreground">
                Separă alergenii prin virgulă (ex: gluten, lactate)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="available">Disponibil pentru comenzi</Label>
              <Switch
                id="available"
                checked={formData.isAvailable}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isAvailable: checked }))
                }
              />
            </div>
            <div className={`flex items-center justify-between${!addonsPluginEnabled ? ' opacity-50' : ''}`}>
              <div>
                <Label htmlFor="isAddon">Add-on la coș</Label>
                <p className="text-xs text-muted-foreground">
                  {addonsPluginEnabled
                    ? 'Apare în secțiunea „Adaugă la comandă" pe pagina Coș'
                    : 'Plugin-ul Add-ons este dezactivat din Setări → Plugin-uri'}
                </p>
              </div>
              <Switch
                id="isAddon"
                checked={addonsPluginEnabled ? formData.isAddon : false}
                disabled={!addonsPluginEnabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isAddon: checked }))
                }
              />
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
                editingProduct ? 'Salvează' : 'Adaugă'
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
              Ești sigur că vrei să ștergi produsul "{deleteConfirm?.name}"?
              Această acțiune nu poate fi anulată.
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
