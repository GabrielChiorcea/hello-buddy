/**
 * =============================================================================
 * PAGINA ADMIN – Reguli Add-on per Categorie
 * =============================================================================
 * Permite configurarea add-on-urilor sugerate per categorie de produs.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Package, FolderOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminCategory {
  id: string;
  name: string;
  displayName: string;
}

interface AdminProduct {
  id: string;
  name: string;
  price: number;
  isAddon: boolean;
  categoryId: string;
  categoryName?: string;
}

export default function AdminAddonRules() {
  const { fetchWithAuth } = useAdminApi();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [addonProducts, setAddonProducts] = useState<AdminProduct[]>([]);
  const [rules, setRules] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, rulesRes] = await Promise.all([
        fetchWithAuth<{ data: AdminCategory[] }>('/admin/categories'),
        fetchWithAuth<{ data: { products: AdminProduct[] } }>('/admin/products?limit=500'),
        fetchWithAuth<{ data: Record<string, string[]> }>('/admin/addon-rules'),
      ]);

      setCategories(catRes.data || []);
      // Filter only addon products
      const allProducts = prodRes.data?.products || [];
      setAddonProducts(allProducts.filter((p) => p.isAddon));
      setRules(rulesRes.data || {});

      if (catRes.data?.length > 0 && !selectedCategory) {
        setSelectedCategory(catRes.data[0].id);
      }
    } catch (error) {
      console.error('Error loading addon rules data:', error);
      toast({ title: 'Eroare la încărcarea datelor', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, selectedCategory]);

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSave = async () => {
    if (!selectedCategory) return;
    setSaving(true);
    try {
      // Only send rules for the selected category
      const payload = { rules: { [selectedCategory]: rules[selectedCategory] || [] } };
      const result = await fetchWithAuth<{ data: Record<string, string[]> }>(
        '/admin/addon-rules',
        { method: 'PUT', body: JSON.stringify(payload) }
      );
      setRules((prev) => ({ ...prev, ...result.data }));
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
      const result = await fetchWithAuth<{ data: Record<string, string[]> }>(
        '/admin/addon-rules',
        { method: 'PUT', body: JSON.stringify({ rules }) }
      );
      setRules(result.data || {});
      setHasChanges(false);
      toast({ title: 'Toate regulile au fost salvate' });
    } catch (error) {
      console.error('Error saving all addon rules:', error);
      toast({ title: 'Eroare la salvare', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategory)?.displayName || '';
  const selectedRules = selectedCategory ? rules[selectedCategory] || [] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reguli Add-on</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configurează ce produse add-on sunt sugerate pentru fiecare categorie de produs.
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={saving || !selectedCategory}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvează categoria
              </Button>
              <Button onClick={handleSaveAll} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvează tot
              </Button>
            </>
          )}
        </div>
      </div>

      {addonProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nu există produse marcate ca add-on. Mergi la{' '}
              <strong>Produse</strong> și marchează produsele dorite ca „Add-on la coș".
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categorii – stânga */}
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

          {/* Add-on-uri – dreapta */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Add-on-uri pentru: {selectedCategoryName}
              </CardTitle>
              <CardDescription className="text-xs">
                Bifează produsele add-on care vor fi sugerate clienților ce au produse din această categorie în coș.
                Produsele nebifate nu vor apărea (decât dacă nicio categorie din coș nu are reguli — fallback global).
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
      )}

      {/* Info fallback */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <strong>Fallback:</strong> Dacă o categorie de produs din coșul clientului nu are reguli configurate aici, 
            sistemul va afișa automat toate produsele add-on globale (marcate în Admin → Produse). 
            Pentru a dezactiva complet sugestiile pentru o categorie, nu adăuga nicio regulă și asigură-te 
            că toate categoriile din coș au reguli definite.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
