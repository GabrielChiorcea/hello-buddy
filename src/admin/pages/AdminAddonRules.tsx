/**
 * =============================================================================
 * PAGINA ADMIN – Add-ons (Basic + Avansat)
 * =============================================================================
 * Tab Basic: afișează produsele marcate isAddon (lista globală).
 * Tab Avansat: reguli per categorie – ce add-on-uri sunt sugerate per categorie.
 */

import { useEffect, useState } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Package, FolderOpen, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';

interface AdminCategory {
  id: string;
  name: string;
  displayName: string;
}

interface AdminProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  isAddon: boolean;
  categoryId: string;
  categoryName?: string;
}

// ─── Basic Tab ───────────────────────────────────────────────────────

function BasicTab({ addonProducts }: { addonProducts: AdminProduct[] }) {
  if (addonProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nu există produse marcate ca add-on. Mergi la{' '}
            <strong>Produse</strong> și marchează produsele dorite ca „Add-on la coș".
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by category
  const grouped = new Map<string, AdminProduct[]>();
  for (const p of addonProducts) {
    const key = p.categoryName || 'Fără categorie';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Aceste produse sunt afișate global în secțiunea „Adaugă la comandă" din coș.
              Pentru a adăuga sau elimina produse din această listă, mergi la <strong>Produse</strong> și modifică flag-ul „Add-on la coș".
            </span>
          </p>
        </CardContent>
      </Card>

      {Array.from(grouped.entries()).map(([categoryName, products]) => (
        <Card key={categoryName}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{categoryName}</CardTitle>
            <CardDescription className="text-xs">
              {products.length} {products.length === 1 ? 'produs' : 'produse'} add-on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  {product.image && (
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="h-10 w-10 rounded-md object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.price} RON
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Add-on
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Advanced Tab ────────────────────────────────────────────────────

function AdvancedTab({
  categories,
  addonProducts,
  rules,
  setRules,
  onSave,
  onSaveAll,
  saving,
  hasChanges,
  setHasChanges,
}: {
  categories: AdminCategory[];
  addonProducts: AdminProduct[];
  rules: Record<string, string[]>;
  setRules: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  onSave: (categoryId: string) => void;
  onSaveAll: () => void;
  saving: boolean;
  hasChanges: boolean;
  setHasChanges: (v: boolean) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );

  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategory)?.displayName || '';
  const selectedRules = selectedCategory ? rules[selectedCategory] || [] : [];

  const toggleAddon = (categoryId: string, productId: string) => {
    setRules((prev) => {
      const current = prev[categoryId] || [];
      const exists = current.includes(productId);
      const updated = exists
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      return { ...prev, [categoryId]: updated };
    });
    setHasChanges(true);
  };

  if (addonProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nu există produse marcate ca add-on. Mergi la{' '}
            <strong>Produse</strong> și marchează produsele dorite ca „Add-on la coș".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save buttons */}
      {hasChanges && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => selectedCategory && onSave(selectedCategory)}
            disabled={saving || !selectedCategory}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvează categoria
          </Button>
          <Button onClick={onSaveAll} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvează tot
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories – left */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Categorii
            </CardTitle>
            <CardDescription className="text-xs">
              Selectează o categorie pentru a configura add-on-urile.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0.5">
              {categories.map((cat) => {
                const ruleCount = (rules[cat.id] || []).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
                      isSelected
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50'
                    }`}
                  >
                    <span>{cat.displayName}</span>
                    {ruleCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {ruleCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Addon products – right */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Add-on-uri pentru: {selectedCategoryName}
            </CardTitle>
            <CardDescription className="text-xs">
              Bifează produsele add-on care vor fi sugerate clienților ce au produse din această categorie în coș.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCategory ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addonProducts.map((product) => {
                  const isChecked = selectedRules.includes(product.id);
                  return (
                    <label
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleAddon(selectedCategory, product.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.price} RON
                          {product.categoryName ? ` · ${product.categoryName}` : ''}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selectează o categorie din lista din stânga.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fallback info */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Fallback:</strong> Dacă o categorie de produs din coșul clientului nu are reguli configurate aici,
              sistemul va afișa automat toate produsele add-on globale (din tab-ul Basic).
              Pentru a dezactiva complet sugestiile pentru o categorie, definește reguli goale.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function AdminAddonRules() {
  const { getCategories, getProducts, getAddonRules, updateAddonRules } = useAdminApi();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [addonProducts, setAddonProducts] = useState<AdminProduct[]>([]);
  const [rules, setRules] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes, rulesRes] = await Promise.all([
          getCategories(),
          getProducts('limit=500'),
          getAddonRules(),
        ]);

        const cats: AdminCategory[] = (catRes as any)?.data || catRes || [];
        setCategories(Array.isArray(cats) ? cats : []);

        const allProducts: AdminProduct[] = prodRes?.products || [];
        setAddonProducts(allProducts.filter((p) => p.isAddon));

        setRules((rulesRes as any)?.data || {});
      } catch (error) {
        console.error('Error loading addon rules data:', error);
        toast({ title: 'Eroare la încărcarea datelor', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveCategory = async (categoryId: string) => {
    setSaving(true);
    try {
      const result = await updateAddonRules({ [categoryId]: rules[categoryId] || [] });
      setRules((prev) => ({ ...prev, ...((result as any)?.data || {}) }));
      setHasChanges(false);
      toast({ title: 'Regulile au fost salvate cu succes' });
    } catch (error) {
      console.error('Error saving addon rules:', error);
      toast({ title: 'Eroare la salvare', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const result = await updateAddonRules(rules);
      setRules((result as any)?.data || {});
      setHasChanges(false);
      toast({ title: 'Toate regulile au fost salvate' });
    } catch (error) {
      console.error('Error saving all addon rules:', error);
      toast({ title: 'Eroare la salvare', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add-ons</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configurează produsele add-on afișate în secțiunea „Adaugă la comandă" din coș.
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">
            Basic
            <Badge variant="secondary" className="ml-2 text-xs">
              {addonProducts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="advanced">Avansat</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <BasicTab addonProducts={addonProducts} />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <AdvancedTab
            categories={categories}
            addonProducts={addonProducts}
            rules={rules}
            setRules={setRules}
            onSave={handleSaveCategory}
            onSaveAll={handleSaveAll}
            saving={saving}
            hasChanges={hasChanges}
            setHasChanges={setHasChanges}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
